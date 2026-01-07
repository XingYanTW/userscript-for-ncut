// ==UserScript==
// @name         NCUT e-Learning Function Unlocker
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Unlock NCUT e-Learning Function such as F12 and select text
// @author       xy
// @match        https://elearn.ncut.edu.tw/*
// @grant        none
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/XingYanTW/userscript-for-ncut/main/NCUT e-Learning Function Unlocker-1.0.user.js
// @downloadURL  https://raw.githubusercontent.com/XingYanTW/userscript-for-ncut/main/NCUT e-Learning Function Unlocker-1.0.user.js
// ==/UserScript==

(function() {
    'use strict';

    const ALLOW_KEYS = [
        'F12',
        { ctrl: true, shift: true, key: 'I' },
        { ctrl: true, shift: true, key: 'J' },
        { ctrl: true, shift: true, key: 'C' },
        { ctrl: true, key: 'U' }
    ];

    window.addEventListener('keydown', function(e) {
        const isTargetKey = ALLOW_KEYS.some(k => {
            if (typeof k === 'string') return e.key === k;
            return e.key.toUpperCase() === k.key &&
                   !!e.ctrlKey === !!k.ctrl &&
                   !!e.shiftKey === !!k.shift &&
                   !!e.altKey === !!k.alt;
        });

        if (isTargetKey) {
            e.stopImmediatePropagation();
        }
    }, true);

    function unlockUI() {
        document.oncontextmenu = null;
        document.onselectstart = null;
        document.ondragstart = null;
        document.onmousedown = null;

        if (document.body) {
            document.body.oncontextmenu = null;
            document.body.onselectstart = null;
            document.body.style.userSelect = "text";
            document.body.style.webkitUserSelect = "text";
        }

        if (!document.getElementById('ncut-unlock-style')) {
            var style = document.createElement('style');
            style.id = 'ncut-unlock-style';
            style.innerHTML = `
                * {
                    user-select: text !important;
                    -webkit-user-select: text !important;
                    -moz-user-select: text !important;
                }
            `;
            (document.head || document.documentElement).appendChild(style);
        }
    }

    unlockUI();
    window.addEventListener('DOMContentLoaded', unlockUI);
    window.addEventListener('load', unlockUI);

    setInterval(unlockUI, 2000);

})();