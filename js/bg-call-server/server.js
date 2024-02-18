const bgFun = {
    // setStorePlus: ()=>{}
}

// 动态调用
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if(request.funName != null){
            console.log(`bg log: call a function named ${request.funName} with parameters `,request.args)
            const targetFun = bgFun[request.funName]
            const args = Array.isArray(request.args)?request.args:[]
            let result = targetFun(...args)
            // 如果是promise需要等待结果
            sendResponse({result});
        }
    });
// 注册远程方法
function registerBGFun(funName,fun){
    bgFun[funName] = fun;
}