// ==UserScript==
// @name         NCUT e-learn 萬用工具箱 (五合一整合版)
// @namespace    http://tampermonkey.net/
// @version      2.0.1
// @description  整合阻擋新視窗、課程匯出、功能解鎖、PDF下載、SCORM優化，點擊左側 narrow 區塊開啟設定。
// @author       xy & Gemini
// @match        https://elearn.ncut.edu.tw/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // ==========================================
    // 1. 設定與儲存管理
    // ==========================================
    const config = {
        blockNewPage: GM_getValue('blockNewPage', true),
        courseExport: GM_getValue('courseExport', true),
        funcUnlock: GM_getValue('funcUnlock', true),
        pdfDownload: GM_getValue('pdfDownload', true),
        scormFix: GM_getValue('scormFix', true)
    };

    function saveConfig(key, value) {
        config[key] = value;
        GM_setValue(key, value);
    }

    // ==========================================
    // 2. 樣式表 (UI)
    // ==========================================
    GM_addStyle(`
        #ncut-box-modal {
            display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 320px; background: #fff; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            z-index: 1000001; padding: 20px; font-family: "Microsoft JhengHei", sans-serif; color: #333;
        }
        #ncut-box-overlay {
            display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); z-index: 1000000;
        }
        .ncut-header { font-size: 18px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px; display: flex; justify-content: space-between; }
        .ncut-item { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .ncut-item span { font-size: 14px; }
        .ncut-switch { position: relative; display: inline-block; width: 40px; height: 20px; }
        .ncut-switch input { opacity: 0; width: 0; height: 0; }
        .ncut-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 20px; }
        .ncut-slider:before { position: absolute; content: ""; height: 14px; width: 14px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
        input:checked + .ncut-slider { background-color: #10b981; }
        input:checked + .ncut-slider:before { transform: translateX(20px); }
        .narrow { cursor: pointer !important; }
        .narrow:hover { background-color: rgba(255,255,255,0.1); }
    `);

    // ==========================================
    // 3. 各項功能模組
    // ==========================================

    const Modules = {
        // [1] 阻擋新視窗
        blockNewPage: function() {
            if (!config.blockNewPage) return;
            const urlMap = {};
            let isMapReady = false;
            let realLaunchActivity = null;

            function fetchUrls() {
                function findCtx(w) { try { if (w.cid && w.pTicket) return w; for (let i=0; i<w.frames.length; i++) { let f = findCtx(w.frames[i]); if(f) return f; } } catch(e){} return null; }
                let ctx = findCtx(unsafeWindow.top);
                if (!ctx) return;
                fetch(`/xmlapi/index.php?action=my-course-path-info&onlyProgress=0&descendant=1&cid=${ctx.cid}&ticket=${ctx.pTicket}`)
                    .then(r => r.json()).then(res => {
                        if (res.data?.path?.item) {
                            let items = Array.isArray(res.data.path.item) ? res.data.path.item : [res.data.path.item];
                            items.forEach(item => { if(item.identifier) urlMap[item.identifier] = item.href.includes('@') ? item.href.split('@')[1] : item.href; });
                            isMapReady = true;
                        }
                    });
            }
            fetchUrls();
            setInterval(() => {
                if (typeof unsafeWindow.launchActivity === 'function' && !unsafeWindow.launchActivity.isMyHook) {
                    realLaunchActivity = unsafeWindow.launchActivity;
                    unsafeWindow.launchActivity = function(obj, id, target) {
                        let forceTarget = 's_main';
                        if (isMapReady && urlMap[id]?.startsWith('http') && !urlMap[id].includes('elearn.ncut.edu.tw')) forceTarget = '_blank';
                        return realLaunchActivity.apply(this, [obj, id, forceTarget]);
                    };
                    unsafeWindow.launchActivity.isMyHook = true;
                }
            }, 50);
        },

        // [2] 課程匯出 (保留你原本精美的 Modal)
        courseExport: function() {
            if (!config.courseExport || window.name !== 's_main') return;
            window.addEventListener('load', () => {
                const btn = document.createElement('button');
                btn.innerHTML = '匯出教材清單';
                Object.assign(btn.style, { position: 'fixed', bottom: '70px', right: '20px', zIndex: '99999', padding: '8px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' });
                btn.onclick = () => {
                    function findCtx(w){ try { if (w.cid && w.pTicket) return w; for (let i=0; i<w.frames.length; i++){ let f=findCtx(w.frames[i]); if(f) return f; } } catch(e){} return null; }
                    let ctx = findCtx(unsafeWindow.top);
                    if (!ctx) { alert("找不到課程 ID，請確認已進入課程。"); return; }
                    
                    fetch(`/xmlapi/index.php?action=my-course-path-info&onlyProgress=0&descendant=1&cid=${ctx.cid}&ticket=${ctx.pTicket}`)
                        .then(r=>r.json()).then(res => {
                            let items = res.data?.path?.item || [];
                            if(!Array.isArray(items)) items = [items];
                            let list = items.filter(i => i.href && i.href !== 'about:blank').map(i => {
                                let link = i.href.includes('@') ? i.href.split('@')[1] : i.href;
                                if (!link.startsWith('http')) link = new URL(link, window.location.href).href;
                                return { title: i.text, url: link };
                            });
                            showResult(list);
                        });
                };
                document.body.appendChild(btn);
            });

            // 原本的 UI 渲染函數
            function showResult(list) {
                let modal = document.getElementById('export-result-modal');
                if (modal) modal.remove();
                modal = document.createElement('div');
                modal.id = 'export-result-modal';
                Object.assign(modal.style, {
                    position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    width: '600px', maxHeight: '80vh', backgroundColor: 'white', border: '1px solid #ccc',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.3)', zIndex: '100000', padding: '20px',
                    borderRadius: '8px', display: 'flex', flexDirection: 'column'
                });
                const title = document.createElement('h3');
                title.innerText = `匯出結果 (${list.length} 筆)`;
                title.style.marginTop = '0';
                const textarea = document.createElement('textarea');
                Object.assign(textarea.style, { width: '100%', height: '300px', marginBottom: '10px', fontFamily: 'monospace' });
                textarea.value = list.map(i => `${i.title}\n${i.url}`).join('\n\n');
                
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
                modal.appendChild(title); modal.appendChild(textarea); modal.appendChild(btnContainer);
                document.body.appendChild(modal);
            }
        },

        // [3] 功能解鎖
        funcUnlock: function() {
            if (!config.funcUnlock) return;
            const unlock = () => {
                document.oncontextmenu = document.onselectstart = document.ondragstart = document.oncopy = document.oncut = null;
                if(document.body) {
                    document.body.oncontextmenu = document.body.onselectstart = document.body.oncopy = document.body.oncut = null;
                    document.body.style.userSelect = "text";
                }
            };
            window.addEventListener('keydown', e => {
                if (['F12', 'I', 'J', 'C', 'U'].includes(e.key.toUpperCase()) && (e.ctrlKey || e.key === 'F12')) e.stopImmediatePropagation();
            }, true);
            window.addEventListener('copy', e => e.stopImmediatePropagation(), true);
            window.addEventListener('cut', e => e.stopImmediatePropagation(), true);
            setInterval(unlock, 2000);
            GM_addStyle('* { user-select: text !important; -webkit-user-select: text !important; -moz-user-select: text !important; }');
        },

        // [4] PDF 下載
        pdfDownload: function() {
            if (!config.pdfDownload || !location.href.includes('viewPDF.php')) return;
            const check = setInterval(() => {
                const nativeBtn = document.getElementById('download');
                const isHidden = nativeBtn && (window.getComputedStyle(nativeBtn).display === 'none' || nativeBtn.classList.contains('hiddenMediumView') && window.innerWidth < 800);
                
                if (isHidden && !document.getElementById('custom-dl')) {
                    const pdfPath = unsafeWindow.DEFAULT_URL;
                    if (!pdfPath) return;
                    const dl = document.createElement('button');
                    dl.id = 'custom-dl';
                    dl.innerHTML = '下載 PDF';
                    Object.assign(dl.style, { position: 'fixed', bottom: '20px', right: '20px', zIndex: '2147483647', padding: '10px 18px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontWeight: '600' });
                    dl.onclick = () => {
                        const fullUrl = pdfPath.startsWith('http') ? pdfPath : window.location.origin + '/learn/path/' + pdfPath;
                        let cleanPath = decodeURIComponent(pdfPath.split('?')[0]);
                        const a = document.createElement('a');
                        a.href = fullUrl;
                        a.download = cleanPath.substring(cleanPath.lastIndexOf('/') + 1);
                        document.body.appendChild(a); a.click(); document.body.removeChild(a);
                    };
                    document.body.appendChild(dl);
                }
            }, 1000);
        },

        // [5] SCORM 非同步優化
        scormFix: function() {
            if (!config.scormFix) return;
            const originalSrc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
            Object.defineProperty(HTMLImageElement.prototype, 'src', {
                set: function(v) { if (typeof v === 'string' && v.includes('wmcookie/set/')) return; originalSrc.set.call(this, v); }
            });
            const imgObserver = new MutationObserver((mutations) => {
                mutations.forEach(m => m.addedNodes.forEach(n => {
                    if (n.tagName === 'IMG' && n.src?.includes('wmcookie/set/')) { n.removeAttribute('src'); n.remove(); }
                }));
            });
            imgObserver.observe(document.documentElement, { childList: true, subtree: true });

            let savedOnload = null;
            Object.defineProperty(unsafeWindow, 'onload', {
                set: function(fn) {
                    savedOnload = fn;
                    (async () => {
                        while (!document.body) await new Promise(r => setTimeout(r, 10));
                        const url = 'SCORM_loadCA.php' + (unsafeWindow.ser || '');
                        try {
                            const res = await fetch(url);
                            const xmlString = await res.text();
                            unsafeWindow.xmlDoc = new DOMParser().parseFromString(xmlString, "text/xml");
                            if (unsafeWindow.xmlDoc) unsafeWindow.xmlDoc.load = () => true;
                            if (typeof unsafeWindow.xmlProcessor === 'function') setTimeout(() => unsafeWindow.xmlProcessor(), 0);
                            
                            if (typeof unsafeWindow.setReading === 'function' && unsafeWindow.traceReadingIntervalTime) {
                                unsafeWindow.setInterval(() => unsafeWindow.setReading('end', unsafeWindow.traceReadingIntervalTime), unsafeWindow.traceReadingIntervalTime);
                            }
                        } catch(e) { console.error('SCORM-Fixer 載入失敗', e); }
                    })();
                },
                get: function() { return savedOnload; }
            });
        }
    };

    // ==========================================
    // 4. UI 控制面板邏輯
    // ==========================================
    function createUI() {
        if (window.self !== window.top) return;

        const html = `
            <div id="ncut-box-overlay"></div>
            <div id="ncut-box-modal">
                <div class="ncut-header">工具箱設定 <span id="ncut-close" style="cursor:pointer">×</span></div>
                ${createItem('阻擋新視窗 (內嵌播放)', 'blockNewPage')}
                ${createItem('顯示教材匯出按鈕', 'courseExport')}
                ${createItem('解鎖右鍵與複製 (F12)', 'funcUnlock')}
                ${createItem('強制顯示 PDF 下載鈕', 'pdfDownload')}
                ${createItem('SCORM 載入優化 (防凍結)', 'scormFix')}
                <div style="font-size:11px; color:gray; text-align:center; margin-top:10px;">* 更改後請重新整理網頁以生效</div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);

        document.getElementById('ncut-close').onclick = toggleModal;
        document.getElementById('ncut-box-overlay').onclick = toggleModal;

        const interval = setInterval(() => {
            const narrow = document.querySelector('.narrow');
            if (narrow) {
                narrow.addEventListener('click', (e) => {
                    if (e.target.tagName !== 'A' && !e.target.closest('a')) {
                        e.preventDefault();
                        toggleModal();
                    }
                });
                clearInterval(interval);
            }
        }, 500);
    }

    function createItem(label, key) {
        return `
            <div class="ncut-item">
                <span>${label}</span>
                <label class="ncut-switch">
                    <input type="checkbox" id="chk-${key}" ${config[key] ? 'checked' : ''}>
                    <span class="ncut-slider"></span>
                </label>
            </div>
        `;
    }

    function toggleModal() {
        const m = document.getElementById('ncut-box-modal');
        const o = document.getElementById('ncut-box-overlay');
        const isVisible = m.style.display === 'block';
        m.style.display = isVisible ? 'none' : 'block';
        o.style.display = isVisible ? 'none' : 'block';

        if (isVisible) {
            Object.keys(config).forEach(key => saveConfig(key, document.getElementById(`chk-${key}`).checked));
        }
    }

    // ==========================================
    // 5. 初始化啟動
    // ==========================================
    Modules.blockNewPage();
    Modules.funcUnlock();
    Modules.scormFix();
    Modules.pdfDownload();
    Modules.courseExport();

    if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', createUI);
    else createUI();

})();
