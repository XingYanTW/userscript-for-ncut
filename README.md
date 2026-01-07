# NCUT Userscripts (勤益科大 E-learning 油猴腳本)

這是針對國立勤益科技大學 (NCUT) E-learning 數位學習平台所開發的 UserScript (油猴腳本) 集合，旨在改善使用體驗與解除部分限制。

## 包含腳本

### 1. NCUT e-learn PDF Downloader (PDF 下載器)
*   **檔案**: `NCUT e-learn PDF Downloader-1.3.user.js`
*   **版本**: 1.3
*   **描述**: 在平台的 PDF 閱讀器頁面中，解鎖下載權限。
*   **詳細功能**:
    *   自動偵測原生的下載按鈕是否被隱藏。
    *   若被隱藏，則會在右下角產生一個紅色的「下載 PDF」浮動按鈕。
    *   點擊即可直接下載該 PDF 文件。

### 2. NCUT e-Learning Function Unlocker (功能限制解鎖)
*   **檔案**: `NCUT e-Learning Function Unlocker-1.0.user.js`
*   **版本**: 1.0
*   **描述**: 解鎖網頁鎖定的常見功能，如右鍵、選取複製與開發者工具。
*   **詳細功能**:
    *   **解除右鍵鎖定**: 恢復瀏覽器原本的右鍵選單。
    *   **解除選取限制**: 允許游標選取網頁上的文字內容。
    *   **解除快捷鍵鎖定**: 恢復 `F12`、`Ctrl+Shift+I` (開發人員工具)、`Ctrl+U` (檢視原始碼) 等快捷鍵功能。

## 安裝方式

1. 首先，你需要在瀏覽器安裝 Userscript 管理器外掛：
    *   **Chrome / Edge**: [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) 或 [Violentmonkey](https://chrome.google.com/webstore/detail/violentmonkey/jinjaccalgkegednnccohejagpfpbnid)
    *   **Firefox**: [Tampermonkey](https://addons.mozilla.org/zh-TW/firefox/addon/tampermonkey/)
2. 在此 Repository 中點擊任一 `.user.js` 檔案。
3. 點擊 **Raw** 按鈕，管理器應會自動跳出安裝視窗。
4. 點擊「安裝」或「重新安裝」。

## 使用說明

*   安裝後，只需進入 NCUT E-learning 平台 (https://elearn.ncut.edu.tw/)，腳本即會自動在背景運作。
*   若要暫時關閉功能，可透過瀏覽器擴充功能選單停用該腳本。

## 免責聲明 (Disclaimer)

*   本專案腳本僅供學術研究與個人輔助使用，開發者不對使用此腳本產生的任何後果負責。
*   請合理使用，尊重智慧財產權。
