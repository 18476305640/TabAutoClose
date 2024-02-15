// 【页面操作主逻辑】

// 保存配置
async function saveConfig(config) {
    if(!(await setStorePlus(ConfigKeys.TC_CONFIG,config))) {
        alert("保存失败了，可能是数据过多！")
    }
}
$(function() {
	// 【规则】
    // 刷新规则列表
    function refreshList(items) {
        $("#show").html('');
        if(!Array.isArray(items)) return;
        for(let item of items ) {
            $("#show").append(`
                <p class='item'><span title="${item}">${item}</span><button class='del'>x</button></p>
            `)
        }
    }

    // 全局config对象
    let config = null;
    // 获取配置-赋于全局变量
    getStorePlus(ConfigKeys.TC_CONFIG).then(configJson=>{
        if(configJson != null) {
            config = configJson;
            // 初始化列表
            refreshList(config.retentionRules);
        }else{
            // 赋于初始配置
            config = {
                retentionRules: []
            }
            // 保存配置
            saveConfig(config);
        }
    })
    // 点击提交规则处理函数
    function submitSaveRule() {
        // 获取要添加的规则
        let inputRule = $("#rule").val();
        // 看添加的是否有效（是否为空）
        if((inputRule = inputRule.trim()).length == 0 ) return;
        // 看是否有重复的
        if(config.retentionRules.includes(inputRule)) return;
        // push到全局config对象中(使用unshift在前面添加，防止过多，添加后要往下拉才知道是否添加)
        config.retentionRules.unshift(inputRule);
        // 保存配置
        saveConfig(config);
        // 刷新列表
        refreshList(config.retentionRules);
        // 清空输入框
        $("#rule").val('')
    }
    // 给提交按钮添加点击事件
    $("#push").click(submitSaveRule);
    // 删除
    $("#show").on("click",".del",function(e) {
        let delTarget = $(e.target).parent().find("span").text();
        config.retentionRules = config.retentionRules.filter(item=>item.trim() != delTarget.trim());
        // 保存配置
        saveConfig(config);
        // 刷新列表
        refreshList(config.retentionRules);
    })

	// 【回显】
	// 回显保护secureCount
    getStore(ConfigKeys.SECURE_COUNT).then((value)=>$("#secure-range").val(value))
    // 回显delayed
	getStore(ConfigKeys.DELAYED).then((value)=>$("#delayed").val(value))

	// 【修改监听保存】
	async function saveSecureCount() {
        let newVal = $("#secure-range").val() ?? 0
        await setStore(ConfigKeys.SECURE_COUNT,newVal)
        $("#secure-range").val(newVal)
	}

	async function saveDelayed() {
        let newVal = $("#delayed").val() ?? 0
        await setStore(ConfigKeys.DELAYED,newVal)
        $("#delayed").val(newVal);
	}
	$('#secure-range').on('input', ()=>saveSecureCount(true));
	$('#delayed').on('input', ()=>saveDelayed());

})