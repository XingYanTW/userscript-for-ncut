(function getDirectList(win) {
    // 1. 找變數
    function findContext(w) {
        try {
            if (w.cid && w.pTicket) return w;
            for (var i = 0; i < w.frames.length; i++) {
                var found = findContext(w.frames[i]);
                if (found) return found;
            }
        } catch (e) {}
        return null;
    }
    var ctx = findContext(win);
    if (!ctx) return console.error("找不到 cid");

    // 2. 發送請求
    var apiUrl = `/xmlapi/index.php?action=my-course-path-info&onlyProgress=0&descendant=1&cid=${ctx.cid}&ticket=${ctx.pTicket}`;
    console.log("正在讀取課程列表...");

    fetch(apiUrl).then(r => r.json()).then(res => {
        // 3. 直接讀取正確的路徑 data.path.item
        if (res.data && res.data.path && res.data.path.item) {
            var items = res.data.path.item;
            var list = [];

            items.forEach(item => {
                // 過濾掉沒有連結或 about:blank 的項目
                if (item.href && item.href !== 'about:blank') {
                    // 處理 @ 符號 (如果有的話)
                    var link = item.href.includes('@') ? item.href.split('@')[1] : item.href;
                    
                    list.push({
                        identifier: item.identifier,
                        title: item.text,
                        url: link
                    });
                }
            });

            console.table(list);
            console.log("--- 純文字清單 ---");
            list.forEach(i => console.log(i.url));
            return list;
        } else {
            console.error("結構不符合預期", res);
        }
    });
})(window.top);