// 发送函数
function callBGFun(funName,args = [],callback) {
    return new Promise((resolve,reject)=>{
        chrome.runtime.sendMessage({funName,args }, (response)=>{
            console.log("The response to the request is ",response)
            const responseData = response && response.result;
            if(callback != null) callback(responseData)
            resolve(responseData)
        });
    })
}