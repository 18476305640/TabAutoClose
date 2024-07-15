
// 【页面操作主逻辑】
import {submitRuleBeforeEventListener} from './event/event.js'
$(function () {
    // 【规则】
    // 将“列表刷新”函数注册被后台bg调用
    registerBGFun(receptionFunKeys.refreshRuleList, refreshRuleList)
    // 全局config对象
    let config = null;
    // 保存配置
    function saveConfig(incomingConfig) {
        if (incomingConfig == null) incomingConfig = config;
        // 通过调用后台方法，防止前台关闭导致添加失败
        callBGFun(bgFunKeys.setStorePlus, [ConfigKeys.TC_CONFIG, incomingConfig]).then(() => { })
    }

    // 刷新规则列表
    let currentListCount = 0;
    let currentTotal = 0;
    let isLoadingCompleted = false;
    let isLoading = false;
    function ensureExistCompletedTis() {
        if ($("#show .completed").length == 0) {
            $("#show").append(`
                <p class='completed'>全部加载完了！</p>
            `)
        }
    }
    const refreshRuleListPreProcess = ({isNextPageRefresh} = {}) => {
        if(isLoading) return false;
        console.log("isLoadingCompleted",isLoadingCompleted)
        if(isNextPageRefresh && isLoadingCompleted)  {
            refreshRuleListPostProcess();
            ensureExistCompletedTis();
            return false;
        }
        // 如果已经存在则路过添加
        if ($("#show .loading").length > 0) return false;
        // 刷新列表的前置处理器
        $("#show").append(`
            <p class='loading'>规则有点多，正在努力加载中(${currentListCount}/${currentTotal})...</p>
        `)
        isLoading = true;
        return true;
    }
    const refreshRuleListPostProcess = () => {
        // 刷新列表的后置处理器
        $("#show .loading").remove();
        isLoading = false;
    }
    async function refreshRuleList({ dataList, keyword, maxShowCount = 10, isNextPageRefresh = false } = {}) {
        if(!refreshRuleListPreProcess({isNextPageRefresh})) return;
        try {
            // 如果是下页刷新，则增加maxShowCount
            if (isNextPageRefresh) {
                maxShowCount *= 2;
            } else {
                currentListCount = 0;
                isLoadingCompleted = false;
            }
            if (dataList == null) {
                // 获取配置-赋于全局变量
                await notTooFast(async ()=>{
                    const configFromStore = await getStorePlus(ConfigKeys.TC_CONFIG);
                    if (configFromStore != null) {
                        config = configFromStore;
                    } else {
                        // 赋于初始配置
                        config = defaultConfig.TC_CONFIG
                        // 保存配置
                        saveConfig(config);
                    }
                    dataList = config.retentionRules
                },isNextPageRefresh?550:0)
            }
            // 刷新到全局对象 retentionRules 中
            config.retentionRules = dataList
            $("#msg>.ruleCount").text(dataList.length);
            // keyword过滤
            let showListData = ((keyword || '').trim().length > 0) ? dataList.filter(item => item.includes(keyword)) : dataList
            currentTotal = showListData.length;
            showListData = showListData.slice(currentListCount, currentListCount + maxShowCount)

            // 列表置空
            if (!isNextPageRefresh) $("#show").html('');
            // 看当前列表个数
            // 如果 当前显示的列表数 <= retentionRules.length ，则不刷新(已无法刷新)
            if (currentListCount >= currentTotal) {
                console.log("加载完成")
                isLoadingCompleted = true;
                return;
            }
            // 规则 append to 列表视图
            if (!Array.isArray(showListData)) return;
            for (let item of showListData) {
                $("#show").append(`
                    <p class='item'><span title="${item}">${item}</span><button class='del'>x</button></p>
                `)
            }
            // 刷新显示列表数
            currentListCount += showListData.length;
        } finally {
            refreshRuleListPostProcess()
        }

    }
    // 放在window中，是因为其它js需要被调用 search.js  并且进行调用进行列表初始化
    (window.refreshRuleList = refreshRuleList)();
    // 保存规则
    async function getRetentionRules() {
        // 从配置中重新获取一次，防止还没有获取，而导致规则丢失
        config = await getStorePlus(ConfigKeys.TC_CONFIG)
        return config.retentionRules
    }
    window.getRetentionRules = getRetentionRules
    // 保存配置(其它js中调用)
    async function saveRetentionRules(rules, isAppend = false) {
        // 有效条数
        let count = 0;
        const allRule = (await getRetentionRules()) ?? []
        if (isAppend) {
            const newRules = rules.filter(rule => !allRule.includes(rule))
            count = newRules.length
            allRule.unshift(...newRules)
        } else {
            allRule = rules
            count = rules.length
        }
        config.retentionRules = allRule
        saveConfig(config)
        return count;
    }
    window.saveRetentionRules = saveRetentionRules
    // 监听bg的刷新请求
    registerBGFun(receptionFunKeys.onCompletedStore, (key, result) => {
        if (key === ConfigKeys.TC_CONFIG) refreshRuleList({isNextPageRefresh: false})
    })

    // 点击提交规则处理函数
    let ruleInput = $("#rule");
    // 提交保存规则前置事件-监听者
    function submitSaveRule() {
        // 通知保存规则前置事件
        submitRuleBeforeEventListener.forEach(async (listener) => await listener())
        // 获取要添加的规则
        let inputRule = ruleInput.val();
        // 清空输入框
        ruleInput.val('')
        // 看添加的是否有效（是否为空）
        if ((inputRule = inputRule.trim()).length == 0) return;
        // 看是否有重复的
        if (config.retentionRules.includes(inputRule)) {
            alert("已存在该规则，无需重复添加！")
            return;
        }
        // push到全局config对象中(使用unshift在前面添加，防止过多，添加后要往下拉才知道是否添加)
        config.retentionRules.unshift(inputRule);
        // 保存配置
        saveConfig(config);
        // 刷新列表(无法刷新，异步保存完会自动通知信息)
        // refreshRuleList();
    }
    // 给提交按钮添加点击事件
    $("#push").click(submitSaveRule);
    // 回车添加规则
    ruleInput.keydown(function (e) {
        if (e.key === "Enter") $("#push").click();
    })
    // 删除
    $("#show").on("click", ".del", async function (e) {
        // 获取要删除的规则
        let delTarget = $(e.target).parent().find("span").text();
        // 过滤掉删除的
        config.retentionRules = config.retentionRules.filter(item => item.trim() != delTarget.trim());
        // 向bg请求删除rule
        callBGFun(bgFunKeys.debounceRemoveRules, [delTarget])
        // 删除元素(让用户看不见被删除的元素)
        $(e.target).parent(".item").remove();
    })

    // 【回显】
    // 回显保护secureCount
    getStore(ConfigKeys.SECURE_COUNT).then((value) => $("#secure-range").val(value))
    // 回显delayed
    getStore(ConfigKeys.DELAYED).then((value) => $("#delayed").val(value))

    // 【修改监听保存】
    async function saveSecureCount() {
        let newVal = $("#secure-range").val() ?? 0
        await setStore(ConfigKeys.SECURE_COUNT, newVal)
        $("#secure-range").val(newVal)
    }

    async function saveDelayed() {
        let newVal = $("#delayed").val() ?? 0
        await setStore(ConfigKeys.DELAYED, newVal)
        $("#delayed").val(newVal);
        // 发送触发刷新后台的Delayed.value事件
        callBGFun(bgFunKeys.refreshDelayedValue)
    }
    $('#secure-range').on('input', () => saveSecureCount(true));
    $('#delayed').on('input', () => saveDelayed());

})