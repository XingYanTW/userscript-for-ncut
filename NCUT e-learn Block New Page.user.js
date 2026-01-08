// ==UserScript==
// @name         NCUT e-learn Block New Page
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

    const urlMap = {};
    let isMapReady = false;

    function fetchCourseUrls() {
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
            return;
        }

        var apiUrl = `/xmlapi/index.php?action=my-course-path-info&onlyProgress=0&descendant=1&cid=${ctx.cid}&ticket=${ctx.pTicket}`;

        fetch(apiUrl)
            .then(r => r.json())
            .then(res => {
                if (res.data && res.data.path && res.data.path.item) {
                    let items = res.data.path.item;
                    if (!Array.isArray(items)) items = [items];

                    items.forEach(item => {
                        if (item.href && item.href !== 'about:blank') {
                            let link = item.href.includes('@') ? item.href.split('@')[1] : item.href;

                            if (item.identifier) {
                                urlMap[item.identifier] = link;
                            }
                        }
                    });
                    isMapReady = true;
                }
            });
    }

    fetchCourseUrls();
    setTimeout(fetchCourseUrls, 1000);


    let realLaunchActivity = null;

    function hookedLaunchActivity(obj, id, target) {
        let forceTarget = 's_main';

        if (isMapReady && urlMap[id]) {
            const realUrl = urlMap[id];

            if (realUrl.startsWith('http')) {
                if (!realUrl.includes('elearn.ncut.edu.tw')) {
                    forceTarget = '_blank';
                }
            }
        }

        let fn = realLaunchActivity || window.launchActivity;
        if (typeof fn === 'function' && fn !== hookedLaunchActivity) {
            return fn.apply(this, [obj, id, forceTarget]);
        } else {
            if (isMapReady && urlMap[id]) {
                 if (forceTarget === '_blank') window.open(urlMap[id]);
                 else window.location.href = urlMap[id];
            }
        }
    }
    hookedLaunchActivity.isMyHook = true;

    window.addEventListener('load', () => {
        window.isLaunching = true;
        setTimeout(() => {
            window.isLaunching = false;
        }, 1000);
    });

    var checkTimer = setInterval(function() {
        if (typeof window.launchActivity === 'function') {
            if (window.launchActivity !== hookedLaunchActivity) {
                realLaunchActivity = window.launchActivity;
                window.launchActivity = hookedLaunchActivity;
            }
        }
    }, 50);

    setTimeout(() => clearInterval(checkTimer), 20000);

})();