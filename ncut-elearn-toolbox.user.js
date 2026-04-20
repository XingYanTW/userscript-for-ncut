// ==UserScript==
// @name         NCUT e-learn 萬用工具箱
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  解決 Frameset 畫不出視窗的問題，改由右側主畫面 (s_main) 負責渲染設定介面。
// @author       xy
// @match        https://elearn.ncut.edu.tw/*
// @grant        GM_setValue
// @grant        GM_getValue
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
    // 2. 各項功能模組
    // ==========================================
    const Modules = {
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

            function showResult(list) {
                let modal = document.getElementById('export-result-modal');
                if (modal) modal.remove();
                modal = document.createElement('div');
                modal.id = 'export-result-modal';
                Object.assign(modal.style, { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', maxHeight: '80vh', backgroundColor: 'white', border: '1px solid #ccc', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', zIndex: '100000', padding: '20px', borderRadius: '8px', display: 'flex', flexDirection: 'column' });
                const title = document.createElement('h3');
                title.innerText = `匯出結果 (${list.length} 筆)`;
                title.style.marginTop = '0';
                const textarea = document.createElement('textarea');
                Object.assign(textarea.style, { width: '100%', height: '300px', marginBottom: '10px', fontFamily: 'monospace' });
                textarea.value = list.map(i => `${i.title}\n${i.url}`).join('\n\n');
                const closeBtn = document.createElement('button'); closeBtn.innerText = '關閉'; closeBtn.onclick = () => modal.remove();
                const copyBtn = document.createElement('button'); copyBtn.innerText = '複製到剪貼簿'; copyBtn.style.marginRight = '10px'; copyBtn.onclick = () => { textarea.select(); document.execCommand('copy'); copyBtn.innerText = '已複製!'; setTimeout(() => copyBtn.innerText = '複製到剪貼簿', 2000); };
                const btnContainer = document.createElement('div'); btnContainer.appendChild(copyBtn); btnContainer.appendChild(closeBtn);
                modal.appendChild(title); modal.appendChild(textarea); modal.appendChild(btnContainer);
                document.body.appendChild(modal);
            }
        },

        funcUnlock: function() {
            if (!config.funcUnlock) return;
            const unlock = () => {
                document.oncontextmenu = document.onselectstart = document.ondragstart = document.oncopy = document.oncut = null;
                if(document.body) { document.body.oncontextmenu = document.body.onselectstart = document.body.oncopy = document.body.oncut = null; document.body.style.userSelect = "text"; }
            };
            window.addEventListener('keydown', e => { if (['F12', 'I', 'J', 'C', 'U'].includes(e.key.toUpperCase()) && (e.ctrlKey || e.key === 'F12')) e.stopImmediatePropagation(); }, true);
            window.addEventListener('copy', e => e.stopImmediatePropagation(), true); window.addEventListener('cut', e => e.stopImmediatePropagation(), true);
            setInterval(unlock, 2000);

            if (!document.getElementById('ncut-unlock-style')) {
                const style = document.createElement('style');
                style.id = 'ncut-unlock-style';
                style.innerHTML = '* { user-select: text !important; -webkit-user-select: text !important; -moz-user-select: text !important; }';
                document.documentElement.appendChild(style);
            }
        },

        pdfDownload: function() {
            if (!config.pdfDownload || !location.href.includes('viewPDF.php')) return;
            const check = setInterval(() => {
                const nativeBtn = document.getElementById('download');
                const isHidden = nativeBtn && (window.getComputedStyle(nativeBtn).display === 'none' || nativeBtn.classList.contains('hiddenMediumView') && window.innerWidth < 800);
                if (isHidden && !document.getElementById('custom-dl')) {
                    const pdfPath = unsafeWindow.DEFAULT_URL;
                    if (!pdfPath) return;
                    const dl = document.createElement('button');
                    dl.id = 'custom-dl'; dl.innerHTML = '下載 PDF';
                    Object.assign(dl.style, { position: 'fixed', bottom: '20px', right: '20px', zIndex: '2147483647', padding: '10px 18px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontWeight: '600' });
                    dl.onclick = () => {
                        const fullUrl = pdfPath.startsWith('http') ? pdfPath : window.location.origin + '/learn/path/' + pdfPath;
                        let cleanPath = decodeURIComponent(pdfPath.split('?')[0]);
                        const a = document.createElement('a'); a.href = fullUrl; a.download = cleanPath.substring(cleanPath.lastIndexOf('/') + 1);
                        document.body.appendChild(a); a.click(); document.body.removeChild(a);
                    };
                    document.body.appendChild(dl);
                }
            }, 1000);
        },

        scormFix: function() {
            if (!config.scormFix) return;
            const originalSrc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
            Object.defineProperty(HTMLImageElement.prototype, 'src', { set: function(v) { if (typeof v === 'string' && v.includes('wmcookie/set/')) return; originalSrc.set.call(this, v); } });
            const imgObserver = new MutationObserver((mutations) => { mutations.forEach(m => m.addedNodes.forEach(n => { if (n.tagName === 'IMG' && n.src?.includes('wmcookie/set/')) { n.removeAttribute('src'); n.remove(); } })); });
            imgObserver.observe(document.documentElement, { childList: true, subtree: true });

            let savedOnload = null;
            Object.defineProperty(unsafeWindow, 'onload', {
                set: function(fn) {
                    savedOnload = fn;
                    (async () => {
                        while (!document.body) await new Promise(r => setTimeout(r, 10));
                        try {
                            const res = await fetch('SCORM_loadCA.php' + (unsafeWindow.ser || ''));
                            unsafeWindow.xmlDoc = new DOMParser().parseFromString(await res.text(), "text/xml");
                            if (unsafeWindow.xmlDoc) unsafeWindow.xmlDoc.load = () => true;
                            if (typeof unsafeWindow.xmlProcessor === 'function') setTimeout(() => unsafeWindow.xmlProcessor(), 0);
                            if (typeof unsafeWindow.setReading === 'function' && unsafeWindow.traceReadingIntervalTime) unsafeWindow.setInterval(() => unsafeWindow.setReading('end', unsafeWindow.traceReadingIntervalTime), unsafeWindow.traceReadingIntervalTime);
                        } catch(e) {}
                    })();
                },
                get: function() { return savedOnload; }
            });
        }
    };

    // ==========================================
    // 3. UI 介面與跨框架通訊 (最終極解法)
    // ==========================================

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

    function buildModal() {
        if (document.getElementById('ncut-box-modal')) return;

        const style = document.createElement('style');
        style.id = 'ncut-custom-style';
        style.innerHTML = `
            #ncut-box-modal { display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 320px; background: #fff; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); z-index: 1000001; padding: 20px; font-family: "Microsoft JhengHei", sans-serif; color: #333; }
            #ncut-box-overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000000; }
            .ncut-header { font-size: 18px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px; display: flex; justify-content: space-between; }
            .ncut-item { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
            .ncut-item span { font-size: 14px; }
            .ncut-switch { position: relative; display: inline-block; width: 40px; height: 20px; }
            .ncut-switch input { opacity: 0; width: 0; height: 0; }
            .ncut-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 20px; }
            .ncut-slider:before { position: absolute; content: ""; height: 14px; width: 14px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
            input:checked + .ncut-slider { background-color: #10b981; }
            input:checked + .ncut-slider:before { transform: translateX(20px); }
        `;
        document.head.appendChild(style);

        const html = `
            <div id="ncut-box-overlay"></div>
            <div id="ncut-box-modal">
                <div class="ncut-header">腳本控制中心 <span id="ncut-close" style="cursor:pointer; color:#999;">×</span></div>
                ${createItem('阻擋新視窗 (內嵌播放)', 'blockNewPage')}
                ${createItem('顯示教材匯出按鈕', 'courseExport')}
                ${createItem('解鎖右鍵與複製 (F12)', 'funcUnlock')}
                ${createItem('強制顯示 PDF 下載鈕', 'pdfDownload')}
                ${createItem('SCORM 載入優化 (防凍結)', 'scormFix')}
                <div style="font-size:11px; color:gray; text-align:center; margin-top:15px;">* 更改設定後請重新整理網頁生效</div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);

        document.getElementById('ncut-close').onclick = toggleModal;
        document.getElementById('ncut-box-overlay').onclick = toggleModal;

        Object.keys(config).forEach(key => {
            const el = document.getElementById(`chk-${key}`);
            if (el) el.addEventListener('change', (e) => saveConfig(key, e.target.checked));
        });
    }

    function toggleModal() {
        let m = document.getElementById('ncut-box-modal');
        let o = document.getElementById('ncut-box-overlay');

        if (!m || !o) {
            buildModal();
            m = document.getElementById('ncut-box-modal');
            o = document.getElementById('ncut-box-overlay');
        }

        if (!m || !o) return;

        const isVisible = m.style.display === 'block';
        m.style.display = isVisible ? 'none' : 'block';
        o.style.display = isVisible ? 'none' : 'block';
    }

    function initUI() {
        // [A] 在所有視窗加入監聽器。只有「不是 Frameset 的一般網頁」才能負責顯示彈出視窗
        window.addEventListener('message', (event) => {
            if (event.data === 'NCUT_TOGGLE_MODAL') {
                const isFrameset = document.getElementsByTagName('frameset').length > 0;
                // 我們指定右側的 s_main，或是沒有使用 frameset 的單頁來顯示視窗
                if (window.name === 's_main' || (!isFrameset && window === window.top)) {
                    toggleModal();
                }
            }
        });

        // [B] 無論在哪個框架，只要找到選單，就插入按鈕
        const searchInterval = setInterval(() => {
            const links = document.querySelectorAll('ul.nav li a, a');
            let targetLink = Array.from(links).find(a => a.textContent && a.textContent.trim() === '全校課程');

            if (targetLink && !document.getElementById('ncut-settings-menu-item')) {
                const targetLi = targetLink.closest('li');
                if (targetLi && targetLi.parentNode) {
                    const newDivider = document.createElement('li');
                    newDivider.className = 'divider';

                    const newLi = document.createElement('li');
                    const newA = document.createElement('a');

                    newA.id = 'ncut-settings-menu-item';
                    newA.href = 'javascript:void(0);';
                    newA.innerHTML = '⚙️ 腳本設定';

                    newA.addEventListener('click', (e) => {
                        e.preventDefault();

                        // 當按鈕被點擊，直接通知右邊的主畫面 (s_main) 打開介面
                        if (unsafeWindow.parent && unsafeWindow.parent.frames['s_main']) {
                            unsafeWindow.parent.frames['s_main'].postMessage('NCUT_TOGGLE_MODAL', '*');
                        } else {
                            // 備用方案：廣播給所有視窗
                            window.postMessage('NCUT_TOGGLE_MODAL', '*');
                            if (unsafeWindow.top) unsafeWindow.top.postMessage('NCUT_TOGGLE_MODAL', '*');
                        }
                    });

                    newLi.appendChild(newA);
                    targetLi.parentNode.insertBefore(newLi, targetLi);
                    targetLi.parentNode.insertBefore(newDivider, newLi);

                    clearInterval(searchInterval);
                }
            }
        }, 500);

        setTimeout(() => clearInterval(searchInterval), 10000);
    }

    // ==========================================
    // 4. 初始化啟動
    // ==========================================
    Modules.blockNewPage();
    Modules.funcUnlock();
    Modules.scormFix();
    Modules.pdfDownload();
    Modules.courseExport();

    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', initUI);
    } else {
        initUI();
    }

})();
