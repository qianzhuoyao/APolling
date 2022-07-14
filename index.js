import { from, timer } from 'rxjs'
import { map, exhaustMap, tap, takeWhile } from 'rxjs/operators'

const BASE_TYPE = ['number', 'string', 'boolean', 'function']
const DEFAULT_WAIT_TIME = 2
export default class Polling {
  constructor(waitTime, ageing) {
    this.timer = null
    this.ageing = parseFloat(ageing) || 120 * 1000
    this.setWaitTime(waitTime)
    this.countdown()
  }

  countdown() {
    setTimeout(() => {
      this.over()
    }, this.ageing)
  }

  check(anything, checkType) {
    if (BASE_TYPE.includes(checkType)) {
      return typeof anything === checkType
    } else {
      throw new Error('类型不被允许')
    }
  }

  setWaitTime(waitTime) {
    this.waitTime = this.isNumber(waitTime) ? waitTime : DEFAULT_WAIT_TIME
  }

  isNumber(anything) {
    return this.check(anything, 'number')
  }

  isTruth(a) {
    return !!a
  }

  isFunc(anything) {
    return this.check(anything, 'function')
  }

  registryStopCondition(stopCondition) {
    if (this.isFunc(stopCondition)) {
      this.pollingContinue = stopCondition
    }
    return this
  }

  registryEffect(effect) {
    if (this.isFunc(effect)) {
      this.effect = effect
    }
    return this
  }

  over() {
    this.timer && this.timer.unsubscribe()
  }

  registryFinishedCallback(callback) {
    if (this.isFunc(callback)) {
      this.finished = callback
    }
    return this
  }

  running(pollingRequest) {
    const that = this
    if (this.isFunc(pollingRequest)) {
      this.timer = timer(0, this.waitTime * 1000)
        .pipe(
          exhaustMap(() => from(pollingRequest())
          ),
          map(r => r),
          tap((pollingCallbackResult) => {
            this.isFunc(this.effect) && this.effect(pollingCallbackResult)
          }),
          takeWhile(pollingCallbackResult => {
            return this.isFunc(this.pollingContinue) && this.pollingContinue(pollingCallbackResult)
          })
        )
        .subscribe({
          error(err) {
            throw new Error(`轮询异常 信息如下:${err}`)
          },
          complete() {
            that.isFunc(that.finished) && that.finished()
          }
        })
    }
  }
}
