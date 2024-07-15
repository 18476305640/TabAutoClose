import {submitRuleBeforeEventListener} from '../event/event.js'
$(()=>{
    // 搜索区
    const searchView = document.querySelector("#search");
    // 搜索按钮(点击显示/隐藏搜索区)
    let searchButton = document.getElementById("search-rule");
    // 搜索区：搜索input
    let searchInput = document.querySelector("#search > .search-input");
    // 搜索区：搜索按钮
    let searchRuleButton = document.querySelector("#search > .search-btn");
    // 搜索区显示/隐藏切换
    // 清空搜索框内容并重置刷新规则列表
    function cancelSearchPostProcess(){
        searchRule(searchInput.value = "");
        // 关闭搜索视图
        searchView.style.display = "none"
    }
    searchButton.addEventListener("click", ()=>{
        // 切换搜索区的可见性
        if (searchView.style.display === "none") {
            searchView.style.display = "flex";
            searchInput.focus();
        }else {
            cancelSearchPostProcess();
        }
    });
    // 当搜索输入框失去焦点时且没有内容时，隐藏
    searchInput.addEventListener("blur", ()=>{
        // 防止点击"查找"来取消搜索时的回调与当前失去焦点回调冲突
        setTimeout(()=>{
            if (searchInput.value === "" && searchView.style.display !== "none") cancelSearchPostProcess();
        },200);
    })

    // 回车搜索
    // 搜索函数
    function searchRule(keyword = searchInput.value){
        window.refreshRuleList({keyword})
    }
    // 搜索触发
    // - 回车搜索
    searchInput.addEventListener("keydown", (e)=>{
        if (e.key === "Enter") searchRule()
    })
    // - 触发点击搜索事件
    searchRuleButton.addEventListener("click", (e)=>searchRule());

    // 列表区滚动触底刷新
    const ruleListView = document.getElementById("show")
    scrollBottom(ruleListView,()=>window.refreshRuleList({keyword: searchInput.value,isNextPageRefresh : true}),{triggerHeight: 50});

    // 当提交规则前(取消搜索模式：清空搜索框+内容并重置刷新规则列表+隐藏搜索视图)
    submitRuleBeforeEventListener.push(()=>cancelSearchPostProcess())
})