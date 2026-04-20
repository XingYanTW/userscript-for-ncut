// ==UserScript==
// @name         NCUT e-learn SCORM Path Fixer
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Fetches course list via API to get real URLs, then intercepts launchActivity to block new pages accurately.
// @author       xy
// @match        https://elearn.ncut.edu.tw/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    console.log('%c[SCORM-Fixer] 已啟動，攔截同步加載器...', 'color: #00ff00; font-weight: bold;');

    // 1. 攔截 window.onload，防止原網頁的同步邏輯直接鎖死 UI
    let savedOnload = null;
    Object.defineProperty(window, 'onload', {
        set: function(fn) {
            console.log('[SCORM-Fixer] 偵測到網頁註冊 onload，進行改寫...');
            savedOnload = fn;
            // 執行我們自己的優化版載入邏輯
            optimizedLoader();
        },
        get: function() { return savedOnload; }
    });

    async function optimizedLoader() {
        // 等待基本的 DOM 元素出現 (如 displayPanel)
        const checkInterval = setInterval(async () => {
            if (document.getElementById('displayPanel') || document.body) {
                clearInterval(checkInterval);
                await startAsyncFetch();
            }
        }, 10);
    }

    async function startAsyncFetch() {
        try {
            // 模擬原程式碼需要的全域變數
            if (typeof(_SYNC_NON_IMPLEMENTED) != "undefined") window._SYNC_NON_IMPLEMENTED = true;

            // 取得原本要請求的 URL
            const url = 'SCORM_loadCA.php' + (window.ser || '');
            console.log(`[SCORM-Fixer] 開始非同步抓取: ${url}`);

            // 建立一個簡單的 Loading 提示
            const loadingMsg = document.createElement('div');
            loadingMsg.innerHTML = '🚀 正在優化載入目錄中...';
            Object.assign(loadingMsg.style, {
                position: 'fixed', top: '10px', right: '10px', background: '#333',
                color: '#fff', padding: '10px', borderRadius: '5px', zIndex: '99999', fontSize: '12px'
            });
            document.body.appendChild(loadingMsg);

            // 使用 fetch 進行非同步請求
            const response = await fetch(url);
            const xmlString = await response.text();

            // 將結果填入原有的 xmlDoc 物件中，確保後續 xmlProcessor() 不會報錯
            if (window.xmlDoc) {
                if (window.xmlDoc.loadXML) {
                    window.xmlDoc.loadXML(xmlString);
                } else {
                    const parser = new DOMParser();
                    const newDoc = parser.parseFromString(xmlString, "text/xml");
                    // 覆蓋原本的 xmlDoc
                    window.xmlDoc = newDoc;
                }
            }

            console.log('[SCORM-Fixer] XML 接收完成，啟動 xmlProcessor');

            // 執行原網頁的處理邏輯
            if (typeof window.xmlProcessor === 'function') {
                // 使用 setTimeout 分開執行，避免 DOM 生成時卡頓
                setTimeout(() => {
                    window.xmlProcessor();
                    loadingMsg.style.background = '#007b00';
                    loadingMsg.innerHTML = '✅ 載入完成';
                    setTimeout(() => loadingMsg.remove(), 2000);
                }, 0);
            }

            // 啟動定時追蹤功能
            if (typeof window.setReading === 'function') {
                window.setInterval(() => {
                    window.setReading('end', window.traceReadingIntervalTime);
                }, window.traceReadingIntervalTime);
            }

        } catch (e) {
            console.error('[SCORM-Fixer] 載入失敗:', e);
        }
    }

    // 2. 攔截 xmlDoc.load 避免它在其他地方又被同步調用
    if (window.xmlDoc) {
        window.xmlDoc.load = function() {
            console.warn('[SCORM-Fixer] 攔截到同步 load 調用，已取消以避免卡頓');
            return true;
        };
    }

})();