// 【store】store操作工具
function getStore(key) {
	return new Promise((resolve,reject)=>{
		chrome.storage.sync.get(key,(res)=>{
			resolve(res[key])
		})
	})
}
function setStore(key,value) {
	return new Promise((resolve,reject)=>{
		const obj = {}
		obj[key] = value
		chrome.storage.sync.set(obj, () => {
			resolve(true)
		});
	})
}
// 使用的storeKeys
let ConfigKeys = {
	TC_CONFIG: 'tc_config',
	SECURE_COUNT: 'secureCount',
	DELAYED: 'delayed'
}
// 【页面操作主逻辑】

// 保存配置
function saveConfig(config) {
    chrome.storage.sync.set({"tc_config": JSON.stringify(config)}, () => {});
}
$(function() {
	// 【规则】
    // 刷新规则列表
    function refreshList(items) {
        $("#show").html('');
        for(let item of items ) {
            $("#show").append(`
                <p class='item'><span title="${item}">${item}</span><button class='del'>x</button></p>
            `)

        }
    }

    // 全局config对象
    let config = null;
    // 获取配置-赋于全局变量
    getStore(ConfigKeys.TC_CONFIG).then(configJson=>{
        if(configJson != null) {
            config = JSON.parse(configJson);
        }else{
            // 赋于初始配置
            config = {
                retentionRules: []
            }
            // 保存配置
            saveConfig(config);
        }
        // 初始化列表
        refreshList(config.retentionRules);
    })
    // 点击提交规则处理函数
    function tcConfig() {
        // 获取要添加的规则
        let inputRule = $("#rule").val();
        if(inputRule.trim().length == 0 ) return;
        // push到全局config对象中
        config.retentionRules.push(inputRule);
        // 保存配置
        saveConfig(config);
        // 刷新列表
        refreshList(config.retentionRules);
        // 清空输入框
        $("#rule").val('')
    }
    // 给提交按钮添加点击事件
    $("#push").click(tcConfig);
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