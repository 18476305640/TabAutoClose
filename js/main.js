
// 【页面操作主逻辑】

$(function () {
    // 【规则】
    // 将“列表刷新”函数注册被后台bg调用
    registerBGFun(receptionFunKeys.refreshRuleList, refreshRuleList)
    // 全局config对象
    let config = null;
    // 保存配置
    function saveConfig(incomingConfig) {
        if(incomingConfig == null) incomingConfig = config;
        // 通过调用后台方法，防止前台关闭导致添加失败
        callBGFun(bgFunKeys.setStorePlus, [ConfigKeys.TC_CONFIG, incomingConfig]).then(() => { })
    }
    // 刷新规则列表
    async function refreshRuleList(items) {
        if (items == null) {
            // 获取配置-赋于全局变量
            const configFromStore = await getStorePlus(ConfigKeys.TC_CONFIG);
            if (configFromStore != null) {
                config = configFromStore;
            } else {
                // 赋于初始配置
                config = defaultConfig.TC_CONFIG
                // 保存配置
                saveConfig(config);
            }
            items = config.retentionRules
        }
        $("#show").html('');
        if (!Array.isArray(items)) return;
        for (let item of items) {
            $("#show").append(`
                <p class='item'><span title="${item}">${item}</span><button class='del'>x</button></p>
            `)
        }
        // 刷新条数显示
        $("#msg>.ruleCount").text(items.length);
        // 该函数可能被后台js触发调用
        config.retentionRules = items
    }
    // 初始化列表（这里不要传值，没有值会自动从store中获取）
    refreshRuleList();
    // 监听bg的刷新请求
    registerBGFun(receptionFunKeys.onCompletedStore,(key,result)=>{
        if(key === ConfigKeys.TC_CONFIG) refreshRuleList()
    })

    // 点击提交规则处理函数
    function submitSaveRule() {
        // 获取要添加的规则
        let inputRule = $("#rule").val();
        // 清空输入框
        $("#rule").val('')
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
        // 刷新列表
        refreshRuleList(config.retentionRules);
    }
    // 给提交按钮添加点击事件
    $("#push").click(submitSaveRule);
    // 删除
    $("#show").on("click", ".del", function (e) {
        // 获取要删除的规则
        let delTarget = $(e.target).parent().find("span").text();
        // 过滤掉删除的
        config.retentionRules = config.retentionRules.filter(item => item.trim() != delTarget.trim());
        // 刷新列表
        refreshRuleList(config.retentionRules);
        // 向bg请求删除rule
        callBGFun(bgFunKeys.debounceRemoveRules,[delTarget])
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