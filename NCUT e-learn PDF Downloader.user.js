// ==UserScript==
// @name         NCUT e-learn PDF Downloader
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Download Locked PDF File
// @author       xy
// @match        https://elearn.ncut.edu.tw/learn/path/viewPDF.php*
// @grant        unsafeWindow
// @run-at       document-end
// @updateURL    https://raw.githubusercontent.com/xydesu/userscript-for-ncut/main/NCUT e-learn PDF Downloader.user.js
// @downloadURL  https://raw.githubusercontent.com/xydesu/userscript-for-ncut/main/NCUT e-learn PDF Downloader.user.js
// ==/UserScript==

(function() {
    'use strict';

    let customBtnCreated = false;

    function monitorNativeButton() {
        const nativeBtn = document.getElementById('download');

        if (!nativeBtn) return;

        const isHidden = window.getComputedStyle(nativeBtn).display === 'none' ||
                         nativeBtn.style.display === 'none' ||
                         nativeBtn.classList.contains('hiddenMediumView') && window.innerWidth < 800;

        if (isHidden && !customBtnCreated) {
            createCustomBtn();
            customBtnCreated = true;
        } else if (!isHidden && customBtnCreated) {
            const btn = document.getElementById('custom-download-helper');
            if (btn) btn.remove();
            customBtnCreated = false;
        }
    }

    function createCustomBtn() {
        const pdfPath = unsafeWindow.DEFAULT_URL;
        if (!pdfPath) return;

        const downloadBtn = document.createElement('button');
        downloadBtn.id = 'custom-download-helper';
        downloadBtn.innerHTML = '下載 PDF';

        Object.assign(downloadBtn.style, {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: '2147483647',
            padding: '10px 18px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontSize: '14px',
            fontWeight: '600',
            fontFamily: 'sans-serif'
        });

        downloadBtn.onclick = function() {
            const fullUrl = pdfPath.startsWith('http')
                ? pdfPath
                : window.location.origin + '/learn/path/' + pdfPath;

            const a = document.createElement('a');
            a.href = fullUrl;
            
            // Fix filename: extract just the filename from path
            let cleanPath = pdfPath.split('?')[0]; // Remove query string
            cleanPath = decodeURIComponent(cleanPath); // Decode URI components
            const fileName = cleanPath.substring(cleanPath.lastIndexOf('/') + 1); // Get string after last slash
            
            a.download = fileName;

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        };

        document.body.appendChild(downloadBtn);
    }

    const checkTimer = setInterval(monitorNativeButton, 1000);

    setTimeout(() => clearInterval(checkTimer), 300000);
})();