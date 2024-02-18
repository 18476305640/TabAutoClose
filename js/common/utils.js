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
