// 延时时间-这里这样写，是为了更快地获取Delayed的值，否则使用getStore会有问题
function debounce(func, wait) {
    var timeout;
    return function() {
        var context = this;
        var args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(function() {
            func.apply(context, args)
        }, wait);
    }
}


// 当给定的元素滚动触底时
function scrollBottom(element, callback,{ triggerHeight = 3 } = {}) {
    element.addEventListener('scroll', debounce(function() {
        if (element.scrollTop + element.clientHeight + triggerHeight >= element.scrollHeight) {
            callback();
        }
    }, 100));
}

// 同步等待指定毫秒数
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 不要太快函数
async function notTooFast(func, wait) {
    const beginTime = Date.now();
    await func();
    const endTime = Date.now();
    if (endTime - beginTime < wait) {
        await sleep(wait - (endTime - beginTime));
    }
}
