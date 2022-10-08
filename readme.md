### 使用

```JavaScript
/**
 * 建立定格时间的轮询 ,通过running开始执行,其回调表明每次执行的结果，会等待接口resolve,
 * 并设置结束条件pollingCondition与副作用effectHook（不影响轮询结果）,当
 * pollingCondition 回调返回false时代表轮询任务完成执行finishedHook的回调。否则会一直执行并且会使用
 * effectHook 回调。
 * 当你对effectHook回调的返回结果数据不满意则可以通过forceChangeResponse来更改，
 * 区别在于 forceChangeResponse 会更改每次流的传递数据。而effectHook不会。
 * 顺序为 forceChangeResponse -> effectHook.即effectHook的参数被forceChangeResponse返回值影响
 *
 * 事件结束后调用over()销毁轮询实例,注意 over不会引起finishedHook回调！！！
 * finishedHook 表明整个轮询流程结束。不算在流程内，它更像是一个标志，即 整个流程从开始一直到pollingCondition返回false为止一直不被人为over的一个阶段。
 * 反之 forceChangeResponse 与 effectHook 与running 则对应流程的过程 （开始->过程ing）当其中存在异常后则结束流程不再轮询，此时finishedHook会被调用
 * 当catchReject被调用后，forceChangeResponse 与 effectHook 与running 则对应流程的过程的异常将会被捕获，
 *
 */
//创建 构造函数参数为 （间隔时间,时效单位秒）
new Polling(1, 30000000)
    //结束条件,false时结束
    .pollingCondition(i => true)
    .finishedHook(() => {
        //结束回调
        console.log('finished')
    })
    .forceChangeResponse(r => {
        //更改流处理内容，参数r为每次轮询的结果，返回值会合并进流中 同map
        return {}
    })
    //暂停请求，不中止流程。return true 时不再发送请求但会持续执行。pre为上一个执行成功的来自请求的数据
    .pauseRequest((pre)=>{
        console.log(pre)
      //  return true
    })
    //捕获错误信息，它会捕获源自effectHook 与 forceChangeResponse 与running回调返回的接口结果 的错误信息。不对finishedHook捕获
    .catchReject(err => {
        console.log(err)
    })
    //轮询副作用回调，不影响流程结果同tap
    .effectHook((newValue, oldValue) => {
        // ...
        console.log({newValue, oldValue}, 'effect')
    })
    //开启轮询 回调返回某个接口从处理
    .running(() => axios.get('xxxx/xxxx/xxxx'))

//销毁
new Polling(1).over()

```

### download

- npm i apolling

### FQ:

email:arronqzy@outlook.com
