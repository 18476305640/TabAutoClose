// 保存配置
function saveConfig(config) {
    chrome.storage.sync.set({"tc_config": JSON.stringify(config)}, () => {});
}
$(function() {
    // 刷新列表
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
    chrome.storage.sync.get('tc_config', (res) => {
        let configJson = res.tc_config;
        
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
        
    });
    // 点击提交处理函数
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
    // 安全位
    function count(num) {
        chrome.storage.sync.get('secureCount', (res) => {
            let modifiedSecureCount = (res.secureCount??3) + num;
            if(modifiedSecureCount < 0) return;
            chrome.storage.sync.set({"secureCount": modifiedSecureCount}, () => {});
            $("#secure-range").val(modifiedSecureCount)
        });
    }
    count(0) // 回显secureCount
    $("#add").click(()=>count(1))
    $("#reduce").click(()=>count(-1))

    
})