// ==UserScript==
// @name         NCUT e-learn Course Export
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Export course content list from NCUT e-learn
// @author       xy
// @match        https://elearn.ncut.edu.tw/*
// @grant        GM_setClipboard
// @grant        unsafeWindow
// @run-at       document-end
// @updateURL    https://raw.githubusercontent.com/XingYanTW/userscript-for-ncut/main/NCUT e-learn Course Export-1.0.user.js
// @downloadURL  https://raw.githubusercontent.com/XingYanTW/userscript-for-ncut/main/NCUT e-learn Course Export-1.0.user.js
// ==/UserScript==

(function() {
    'use strict';

    function addExportButton() {
        // Only run if we are in the s_main frame
        if (window.name !== 's_main') return;

        // Prevent duplicates
        if (document.getElementById('ncut-course-export-btn')) return;
        
        const btn = document.createElement('button');
        btn.id = 'ncut-course-export-btn';
        btn.innerText = '匯出教材清單';
        Object.assign(btn.style, {
            position: 'fixed',
            bottom: '70px',
            right: '20px',
            zIndex: '99999',
            padding: '8px 16px',
            backgroundColor: '#10b981', // green
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
        });
        
        btn.onclick = runExport;
        document.body.appendChild(btn);
    }

    function runExport() {
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
        
        var ctx = findContext(window.top);
        if (!ctx) {
            alert("找不到課程 ID (cid) 或 Ticket，請確認您已進入某個課程頁面。");
            return;
        }

        // 2. 發送請求
        var apiUrl = `/xmlapi/index.php?action=my-course-path-info&onlyProgress=0&descendant=1&cid=${ctx.cid}&ticket=${ctx.pTicket}`;
        console.log("正在讀取課程列表...", apiUrl);

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
                        
                        // Handle relative URLs
                        if (!link.startsWith('http')) {
                            link = new URL(link, window.location.href).href;
                        }

                        list.push({
                            title: item.text,
                            url: link
                        });
                    }
                });

                console.table(list);
                showResult(list);
            } else {
                console.error("結構不符合預期", res);
                alert("無法取得教材清單，結構不符合預期。");
            }
        }).catch(err => {
            console.error(err);
            alert("讀取失敗");
        });
    }
    
    function showResult(list) {
        // Create modal
        let modal = document.getElementById('export-result-modal');
        if (modal) modal.remove();
        
        modal = document.createElement('div');
        modal.id = 'export-result-modal';
        Object.assign(modal.style, {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '600px',
            maxHeight: '80vh',
            backgroundColor: 'white',
            border: '1px solid #ccc',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            zIndex: '100000',
            padding: '20px',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column'
        });
        
        const title = document.createElement('h3');
        title.innerText = `匯出結果 (${list.length} 筆)`;
        title.style.marginTop = '0';
        
        const textarea = document.createElement('textarea');
        textarea.style.width = '100%';
        textarea.style.height = '300px';
        textarea.style.marginBottom = '10px';
        textarea.style.fontFamily = 'monospace';
        
        // Format content
        const content = list.map(i => `${i.title}\n${i.url}`).join('\n\n');
        textarea.value = content;
        
        const closeBtn = document.createElement('button');
        closeBtn.innerText = '關閉';
        closeBtn.onclick = () => modal.remove();
        
        const copyBtn = document.createElement('button');
        copyBtn.innerText = '複製到剪貼簿';
        copyBtn.style.marginRight = '10px';
        copyBtn.onclick = () => {
             textarea.select();
             document.execCommand('copy');
             copyBtn.innerText = '已複製!';
             setTimeout(() => copyBtn.innerText = '複製到剪貼簿', 2000);
        };
        
        const btnContainer = document.createElement('div');
        btnContainer.appendChild(copyBtn);
        btnContainer.appendChild(closeBtn);
        
        modal.appendChild(title);
        modal.appendChild(textarea);
        modal.appendChild(btnContainer);
        
        document.body.appendChild(modal);
    }
    
    // Attempt to inject button
    setTimeout(addExportButton, 2000);

})();
