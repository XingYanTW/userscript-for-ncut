// ==UserScript==
// @name         NCUT NMSD Auto Redirect
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Auto redirect nmsd to wbcmss
// @author       xy
// @match        https://nmsd.ncut.edu.tw/*
// @grant        none
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/xydesu/userscript-for-ncut/main/NCUT NMSD Auto Redirect.user.js
// @downloadURL  https://raw.githubusercontent.com/xydesu/userscript-for-ncut/main/NCUT NMSD Auto Redirect.user.js
// ==/UserScript==

(function() {
    'use strict';
    // Only redirect if we are exactly at the root
    if (window.location.pathname === '/' || window.location.pathname === '') {
        window.location.replace("https://nmsd.ncut.edu.tw/wbcmss/");
    }
})();
