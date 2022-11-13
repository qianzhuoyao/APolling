import { catchError, from, of, throwError, timer } from "rxjs";
import { map, exhaustMap, delay, tap, takeWhile } from "rxjs/operators";
import { ACollector } from "./collector";

const BASE_TYPE = ["number", "string", "boolean", "function"];
const DEFAULT_WAIT_TIME = 2;
export default class Polling {
  constructor(waitTime, ageing) {
    this.timer = null;
    this.delayTime = 0;
    this.stop = false;
    this.preValueOfPollingEffect = null;
    this.ageing = outPutNumber(ageing) * 1000;
    this.setWaitTime(waitTime);
    this.countdown();
  }

  outPutNumber(anything) {
    return Number(anything) || 0;
  }

  countdown() {
    if (!!this.ageing) {
      setTimeout(() => {
        this.over();
      }, this.ageing);
    }
  }

  check(anything, checkType) {
    if (BASE_TYPE.includes(checkType)) {
      return typeof anything === checkType;
    } else {
      throw new Error("类型不被允许");
    }
  }

  setWaitTime(waitTime) {
    this.waitTime = this.isNumber(waitTime) ? waitTime : DEFAULT_WAIT_TIME;
  }

  isNumber(anything) {
    return this.check(anything, "number");
  }

  isFunc(anything) {
    return this.check(anything, "function");
  }

  pollingCondition(stopCondition) {
    if (this.isFunc(stopCondition)) {
      this.pollingContinue = stopCondition;
    }
    return this;
  }

  effectHook(effect) {
    if (this.isFunc(effect)) {
      this.effect = effect;
    }
    return this;
  }

  over() {
    if (this.timer) {
      this.timer.unsubscribe();
      this.timer = null;
    }
  }

  finishedHook(callback) {
    if (this.isFunc(callback)) {
      this.finished = callback;
    }
    return this;
  }

  forceChangeResponse(valueBuildCallback) {
    if (this.isFunc(valueBuildCallback)) {
      this.valueBuildFn = valueBuildCallback;
    }
    return this;
  }

  pauseRequest(fn) {
    if (this.isFunc(fn)) {
      this.runPause = fn;
    }
    return this;
  }
  catchReject(fn) {
    if (this.isFunc(fn)) {
      this.reject = fn;
    }
    return this;
  }

  delay(time) {
    this.delayTime = this.isNumber(time) ? time : 0;
    return this;
  }
  running(pollingRequest) {
    const that = this;
    if (this.isFunc(pollingRequest)) {
      this.timer = timer(0, this.waitTime * 1000)
        .pipe(
          exhaustMap(() => {
            if (
              this.isFunc(this.runPause) &&
              this.runPause(this.preValueOfPollingEffect)
            ) {
              return of(null);
            } else {
              return from(pollingRequest()).pipe(
                delay(this.delayTime),
                catchError((err) => {
                  if (this.reject) {
                    this.reject(err);
                    this.stop = true;
                    return of(err);
                  } else {
                    return throwError(
                      `轮询异常,接口被拒绝,running回调函数${pollingRequest.name}可能不是一个可以被有效使用的接口`
                    );
                  }
                })
              );
            }
          }),
          map((r) => {
            try {
              let otherValue = {};
              if (this.isFunc(this.valueBuildFn) && !this.stop) {
                //非空处理
                otherValue = this.valueBuildFn(r) || {};
              }
              return {
                ...r,
                ...otherValue,
              };
            } catch (e) {
              this.reject && this.reject(e);
              this.stop = true;
            }
          }),
          tap((pollingCallbackResult) => {
            try {
              //心跳检测,当等待时间+1后未获取继续的任务，则触发心跳机制重新跑轮询
              new ACollector(this.waitTime + 10000).do(() => {
                return new Promise(() => {
                  this.over();
                  this.running(pollingRequest);
                  new ACollector().reset();
                });
              });
              this.isFunc(this.effect) &&
                !this.stop &&
                this.effect(
                  pollingCallbackResult,
                  this.preValueOfPollingEffect
                );
              this.preValueOfPollingEffect = pollingCallbackResult;
            } catch (e) {
              this.reject && this.reject(e);
              this.stop = true;
            }
          }),
          takeWhile((pollingCallbackResult) => {
            try {
              return (
                this.isFunc(this.pollingContinue) &&
                this.pollingContinue(pollingCallbackResult) &&
                !this.stop
              );
            } catch (e) {
              this.reject && this.reject(e);
              return false;
            }
          })
        )
        .subscribe({
          error(err) {
            throw new Error(`轮询操作失败 信息如下:${err}`);
          },
          complete() {
            that.isFunc(that.finished) && that.finished();
          },
        });
    }
  }
}
