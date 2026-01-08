# Userscripts-For-NCUT

## 包含腳本列表

| 腳本名稱 | 版本 | 功能描述 | 安裝 |
| :--- | :---: | :--- | :---: |
| **NCUT e-learn PDF Downloader** | 1.5 | **PDF 下載器**<br>在平台的 PDF 閱讀器頁面中解鎖下載權限，自動偵測隱藏按鈕並提供浮動下載鈕。 | [⬇️ 安裝腳本](https://raw.githubusercontent.com/XingYanTW/userscript-for-ncut/main/NCUT%20e-learn%20PDF%20Downloader.user.js) |
| **NCUT e-Learning Function Unlocker** | 1.11 | **功能限制解鎖**<br>恢復右鍵選單、選取複製文字 (Enable Copy)、F12 開發者工具。修正 `launchActivity` 連結行為：透過攔截 `window.open` 與表單提交，智慧判斷網域。內部連結 (ncut.edu.tw) 維持在原視窗 (iframe) 開啟，外部連結 (包含 iframe 內部的表單提交) 則強制開啟新分頁，徹底修復 X-Frame-Options 錯誤。 | [⬇️ 安裝腳本](https://raw.githubusercontent.com/XingYanTW/userscript-for-ncut/main/NCUT%20e-learn%20Function%20Unlocker.user.js) |
| **NCUT e-learn Course Export** | 1.0 | **匯出教材清單**<br>在課程頁面新增「匯出教材清單」按鈕，可抓取該課程所有教材的標題與直接連結。 | [⬇️ 安裝腳本](https://raw.githubusercontent.com/XingYanTW/userscript-for-ncut/main/NCUT%20e-learn%20Course%20Export-1.0.user.js) |
| **NCUT NMSD Auto Redirect** | 1.0 | **自動重定向**<br>訪問勤益入口網 (nmsd) 首頁時，自動導向至 wbcmss 系統。 | [⬇️ 安裝腳本](https://raw.githubusercontent.com/XingYanTW/userscript-for-ncut/main/NCUT%20NMSD%20Auto%20Redirect.user.js) |

## 安裝方式

1. 首先，你需要在瀏覽器安裝 Userscript 管理器外掛：
    *   **Chrome / Edge**: [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) 或 [Violentmonkey](https://chrome.google.com/webstore/detail/violentmonkey/jinjaccalgkegednnccohejagpfpbnid)
    *   **Firefox**: [Tampermonkey](https://addons.mozilla.org/zh-TW/firefox/addon/tampermonkey/)
2. 點擊上方表格中的 **「⬇️ 安裝腳本」** 按鈕。
3. 管理器應會自動跳出安裝視窗。
4. 點擊「安裝」或「重新安裝」。

## 使用說明

*   安裝後，只需進入 NCUT E-learning 平台 (https://elearn.ncut.edu.tw/)，腳本即會自動在背景運作。
*   若要暫時關閉功能，可透過瀏覽器擴充功能選單停用該腳本。

## 免責聲明 (Disclaimer)

*   本專案腳本僅供學術研究與個人輔助使用，開發者不對使用此腳本產生的任何後果負責。
*   請合理使用，尊重智慧財產權。
