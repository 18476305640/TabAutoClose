
$(()=>{
    let fileInput = document.getElementById('fileInput');
    let importButton = document.getElementById("import");
    let exportButton = document.getElementById("export");
    importButton.addEventListener("click", triggerFileInput);
    exportButton.addEventListener("click", exportFile);
    function triggerFileInput() {
        fileInput.click();
        fileInput.onchange = function(){
            importFile();
        }
    }

    function importFile() {
        console.log("导入文件")
        let files = fileInput.files;
        if (files.length <= 0) {
            return false;
        }

        let fileReader = new FileReader();

        fileReader.onload = async function(e) {
            let rawExportResult;
            try {
                rawExportResult = JSON.parse(e.target.result);
                if(!Array.isArray(rawExportResult)) throw new Error()
            }catch(e) {
                alert('导入失败！内容格式错误')
            }
            const processedExportResult = rawExportResult.filter(item=>typeof item === 'string')
            // 导入
            console.log('[导入]：',processedExportResult)
            const validCount = await saveRetentionRules(processedExportResult,true);
            alert(`导入成功，共导入${validCount}条数据！`)
        }
        fileReader.readAsText(files.item(0));
    }

    async function exportFile() {
        console.log("导出文件")
        let allRule = await getRetentionRules();
        console.log('导出内容:',allRule)
        let dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(JSON.stringify(allRule));

        let linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', `TabAutoClose导出的规则-${allRule.length}条.json`);
        linkElement.click();
    }
})
