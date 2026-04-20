// ==UserScript==
// @name         NCUT e-learn SCORM Path Fixer & Blocker
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  1. 非同步載入目錄與伺服器時間 2. 封鎖 wmcookie 圖片 3. 防止同步請求導致的瀏覽器凍結
// @author       xy
// @match        https://elearn.ncut.edu.tw/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=elearn.ncut.edu.tw
// @grant        none
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/xydesu/userscript-for-ncut/refs/heads/main/NCUT%20e-learn%20SCORM%20Path%20Fixer.user.js
// @downloadURL  https://raw.githubusercontent.com/xydesu/userscript-for-ncut/refs/heads/main/NCUT%20e-learn%20SCORM%20Path%20Fixer.user.js
// ==/UserScript==

(function() {
    'use strict';

    console.log('%c[SCORM-Fixer] 腳本已啟動，正在接管環境...', 'color: #00ff00; font-weight: bold;');

    const BLOCK_TARGET = 'lcms.ncut.edu.tw//lms/wmcookie/set/';

    // ==========================================
    // 1. 圖片封鎖邏輯 (針對靜態與動態產生的 <img>)
    // ==========================================

    // 攔截原型鏈上的 src 設定，防止任何 JS 動態插入該圖片
    const originalSrcDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
    Object.defineProperty(HTMLImageElement.prototype, 'src', {
        set: function(value) {
            if (typeof value === 'string' && value.includes(BLOCK_TARGET)) {
                console.warn('[SCORM-Fixer] 已攔截動態圖片請求:', value);
                return; // 直接攔截，不設定 src
            }
            originalSrcDescriptor.set.call(this, value);
        },
        get: function() {
            return originalSrcDescriptor.get.call(this);
        }
    });

    // 監控 DOM 變動，處理 HTML 原始碼中硬編碼的 <img> 標籤
    const imgObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            mutation.addedNodes.forEach(node => {
                if (node.tagName === 'IMG' && node.src && node.src.includes(BLOCK_TARGET)) {
                    node.removeAttribute('src'); // 清除路徑防止後續觸發
                    node.remove(); // 從 DOM 移除
                    console.log('%c[SCORM-Fixer] 已從 HTML 移除 Cookie 設定圖片標籤', 'color: #ff4500');
                }
            });
        }
    });
    imgObserver.observe(document.documentElement, { childList: true, subtree: true });


    // ==========================================
    // 2. SCORM 非同步優化邏輯
    // ==========================================

    let savedOnload = null;

    // 攔截 window.onload，避免觸發原有的同步 SCORM 載入流程
    Object.defineProperty(window, 'onload', {
        set: function(fn) {
            console.log('[SCORM-Fixer] 偵測到網頁註冊 onload，切換至優化載入器...');
            savedOnload = fn;
            optimizedLoader();
        },
        get: function() { return savedOnload; }
    });

    async function optimizedLoader() {
        // 等待必要的 DOM 元素 (如 displayPanel) 或是 Body 出現
        while (!document.body) {
            await new Promise(r => setTimeout(r, 10));
        }

        try {
            // 建立狀態顯示 UI
            const loadingMsg = document.createElement('div');
            loadingMsg.id = 'scorm-fixer-msg';
            loadingMsg.innerHTML = '🚀 正在優化目錄載入 (Async)...';
            Object.assign(loadingMsg.style, {
                position: 'fixed', top: '10px', right: '10px', background: '#333',
                color: '#00ff00', padding: '10px', borderRadius: '5px', zIndex: '99999',
                fontSize: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.5)'
            });
            document.body.appendChild(loadingMsg);

            // 準備請求 URL
            const url = 'SCORM_loadCA.php' + (window.ser || '');
            console.log(`[SCORM-Fixer] 開始非同步抓取教材目錄: ${url}`);

            // 使用 fetch 進行非同步請求，避免畫面凍結
            const response = await fetch(url);
            const xmlString = await response.text();

            // 解析 XML 並掛載到原網頁期待的全域變數 window.xmlDoc
            const parser = new DOMParser();
            window.xmlDoc = parser.parseFromString(xmlString, "text/xml");

            // 攔截舊式同步載入方法，防止重複執行
            if (window.xmlDoc) {
                window.xmlDoc.load = function() { return true; };
            }

            // 執行原網頁的渲染邏輯 (xmlProcessor)
            if (typeof window.xmlProcessor === 'function') {
                setTimeout(() => {
                    window.xmlProcessor();
                    loadingMsg.innerHTML = '✅ 載入完成';
                    loadingMsg.style.background = '#006400';
                    setTimeout(() => loadingMsg.remove(), 2000);
                }, 0);
            }

            // 啟動定時閱讀追蹤 (確保學習時數正常計算)
            if (typeof window.setReading === 'function' && window.traceReadingIntervalTime) {
                window.setInterval(() => {
                    window.setReading('end', window.traceReadingIntervalTime);
                }, window.traceReadingIntervalTime);
            }

        } catch (e) {
            console.error('[SCORM-Fixer] 載入失敗:', e);
            const msg = document.getElementById('scorm-fixer-msg');
            if (msg) msg.innerHTML = '❌ 載入失敗';
        }
    }

})();
