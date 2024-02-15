
importScripts('./common/store.js','./common/store-keys.js','./common/default-config.js');
// 规则为空-初始化
getStorePlus(ConfigKeys.TC_CONFIG).then(value=>{
    if(value == null) {
        setStorePlus(ConfigKeys.TC_CONFIG, defaultConfig.TC_CONFIG)
    }
})
// 安全个数-初始化
getStore(ConfigKeys.SECURE_COUNT).then(value=>{
    let defaultSecureCount = defaultConfig.SECURE_COUNT; // window不被清理的为3个（2保护+1活跃）
	let secureCount = value??defaultSecureCount;
	if(secureCount < 0) secureCount = defaultSecureCount;
    setStore(ConfigKeys.SECURE_COUNT,secureCount);
})

// 定时器时间初始化
let defaultDelayed = defaultConfig.DELAYED; // 默延时关闭时间为60秒
getStore(ConfigKeys.DELAYED).then(value=>{
	let delayed = value??defaultDelayed;
	if(delayed < 0) delayed = 0;
    setStore(ConfigKeys.DELAYED,delayed)
})

// 传入tab通过ruleList过滤返回过滤后的ruleList
function matchUrlPromise(tabList) {
    return new Promise((resolve,reject)=>{
		getStorePlus(ConfigKeys.TC_CONFIG).then(value=>{
            // 获取配置成功
            let config = value == null ? {} : value;
            let ruleList = config.retentionRules??[];
            // 使用规则匹配
            tabList = tabList.filter(tab => {
                for(let rule of ruleList) {
                    if( RegExp(rule).test(tab.url) ) return true;
                }
                return false;
            })
            resolve(tabList)
        })
    })
}
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

let Delayed = {
    value: null,
    // 防抖更新Delayed.value值
    debounceUpdate: debounce(updateDelayedValue, 460)
}
// 更新Delayed.value值-core
function updateDelayedValue() {
    return new Promise((resole,reject)=>{
        getStore(ConfigKeys.DELAYED).then(_value=>{
            resole(Delayed.value = _value)
        } )
    })
}
let closeTimerOperator = {
    timers: {
        // tabId: timer
     },
    // 添加定时器
    async upsertTimer(tabId) {
        // alert("添加定时器id="+tabId)
        if(this.timers[tabId] != null) return; // 如果已经存在定时器，忽略
        let waitTime = Delayed.value; // 秒
        if(waitTime == null) waitTime = (await updateDelayedValue()) ?? defaultDelayed
        let that = this;
        this.timers[tabId] = setInterval(()=> {
            chrome.scripting.executeScript({
                target: {tabId: tabId},
                func: (arg1)=>{document.title = `${arg1} | ${document.title.replace(/^\d+ \| /,"")}`;},
                args: [waitTime],
              });
            waitTime--;
            // 关闭标签的定时器
            if (waitTime <= 0) {
                clearInterval(that.timers[tabId])
                delete that.timers[tabId]
                chrome.tabs.remove(tabId)
            }
        }, 1000)
        Delayed.debounceUpdate()
    },
    // 取消定时器，将定时器关闭且从timers中移除
    cancelTimer(tabId) {
        let timer = this.timers[tabId];
        if(timer == null ) return;
        clearInterval(timer)
        delete this.timers[tabId]
        // 恢复标题
        // chrome.tabs.executeScript(tabId, {
        //     code: `document.title = document.title.replace(/^\\d+ \\| /,"");`
        // });
        chrome.scripting.executeScript({
            target: {tabId: tabId},
            func: ()=>{document.title = document.title.replace(/^\d+ \| /,"");}
        });
    }

}
// tab操作集
let tabOperator = {
    tabs: {
        // tabId: tab
    },
    activeTab: [], // 放tab
    getSafeRange() { // 在安全范围内不能被清理
        return new Promise( (resolve,reject)=>{
            getStore(ConfigKeys.SECURE_COUNT).then(value=>{
                let defaultSecureCount = 2;
                let secureCount = value??defaultSecureCount;
                if(secureCount < 0) resolve(defaultSecureCount);
                resolve(secureCount);
            })
        })
    }, 
    safeRangeArray: [], // 在安全的tab
    addTab(tab) {
        this.tabs[tab.id] = tab;
    },
    removeTab(tabIdOrTab) {
        let tabId = tabIdOrTab;
        if(typeof tabIdOrTab === "object") tabId = tabIdOrTab.id;
        delete this.tabs[tabId]
    },
    findTab(tabId) {
        return this.tabs[tabId]
    },
    async refreshTabHandle() {
        // alert("refreshTabHandle")
        // tab有两种状态, 活跃状态 1 与不活跃状态 0
        let noCloseTab = [...this.safeRangeArray,...this.activeTab]
        let waitCloseTab = this.tabs.filter( tab=> ! noCloseTab.includes(tab)); 
        let that = this;
        // 等待关闭的需要满足,不是活跃的不在安全范围,还需要再"满足配置的规则"
        waitCloseTab = await matchUrlPromise(waitCloseTab)
        // alert("需要进入等待关闭的："+JSON.stringify(waitCloseTab))
        noCloseTab.forEach(secureTab=>{
            // 清理定时器
            closeTimerOperator.cancelTimer(secureTab.id)
        })
        waitCloseTab.forEach(waitTab=>{
            // 保证有定时器
            closeTimerOperator.upsertTimer(waitTab.id);
        })

    },
    // 刷新各tab状态-对应的handle也会调整（通过调用refreshTabHandle）
    refreshState() {
        let that = this;
        let globalActiveTab = [];
        let globalTab = []; // 重置
        let globalSafeRangeArray = [] // 重置
        chrome.windows.getAll({ populate: true }, async function(windows) {
            let safeRange = await tabOperator.getSafeRange();
            windows.forEach(function(window) {
                // let windowIsActive = window.focused;
                let safeRangeArray = [] // push - shift
                let activeTab = null;
                window.tabs.forEach(function(tab) {
                    let active = tab.active; // 是否活跃
                    globalTab.push(tab)
                    if ( activeTab == null && active) {
                        activeTab = tab;
                    }else if(activeTab == null){
                        safeRangeArray.push(tab)
                        if(safeRangeArray.length > safeRange) safeRangeArray.shift();
                    }
                });
                if(activeTab != null) globalActiveTab.push(activeTab);
                globalSafeRangeArray.push(...safeRangeArray);
            });
            that.tabs = globalTab;
            that.safeRangeArray = globalSafeRangeArray;
            that.activeTab = globalActiveTab;
            // alert("所有的tab："+JSON.stringify(globalTab))
            // alert("安全范围的tab："+JSON.stringify(globalSafeRangeArray))
            // alert("活跃的"+JSON.stringify(globalActiveTab))
            that.refreshTabHandle()
        });
    }
}
// 触发刷新（refreshState）的一系列方式
tabOperator.refreshState()
chrome.tabs.onActivated.addListener(()=>tabOperator.refreshState()); // tab切换
chrome.windows.onFocusChanged.addListener(()=>tabOperator.refreshState()) // window切换
chrome.tabs.onCreated.addListener(()=>tabOperator.refreshState()) // tab创建
// 监听标签关闭-维护tabIdTabObj
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => closeTimerOperator.cancelTimer(tabId));
// 监听选项卡位置改变事件
chrome.tabs.onMoved.addListener((tabId, moveInfo) =>tabOperator.refreshState());
// 标签加载完成
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        tabOperator.refreshState()
    }
});

