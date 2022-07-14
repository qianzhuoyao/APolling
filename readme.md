### 使用
```JavaScript
/**
 * 建立每秒的轮询 ,并设置结束条件与副作用（不影响轮询结果）,当
 * registryStopCondition 回调返回false时 结束轮询执行   
 * registryFinishedCallback回调,事件结束后调用over()销毁轮询实例
 * 通过running开始执行,其回调表明每次执行的结果，会等待resolve
 * 
 */
//创建
 new Polling(1)
        .registryStopCondition(i => true)
         .registryFinishedCallback(() => {
            console.log('finished')
          })
          .registryEffect((i)=>{
             console.log('effect')
          })
          .running(() => Promise().resolve())

 //销毁
        new Polling(1).over()  

```
### download
- npm i apolling