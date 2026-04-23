# Design System Pro — 24 色大師版 (Figma 一鍵改風格外掛)

Design System Pro 是一個專為 UI/UX 設計師打造的革命性 Figma 擴充外掛。它將複雜的 Design System 色彩架構（24 色系統）與 Google Gemini AI 完美結合，讓設計師能夠透過對話指令、參考圖片、或是萃取現有畫布，一鍵生成並套用極具專業水準的完整介面配色。

## 🌟 核心功能

### 1. 🤖 AI 智慧大腦 (AI Smart Palette)
只需輸入一句話（例如：「高質感柔霧森林系風格，色彩豐富且帶有柔和漸層」），內建的 Gemini 引擎就會自動為您運算出完美的 24 色 UI 色彩矩陣。
- **語意精準對齊**：AI 完全理解背景(BG)、面板(Surface)、主按鈕(Primary)、輔助色(Secondary)、成功/危險(Success/Danger) 以及反白文字(TextOnBtn)的層級關係。
- **無縫套用**：一鍵套用至您框選的 Figma 設計稿上，系統會自動辨識畫布上的按鈕、文字、卡片背景，並智慧地上色。

### 2. 🎨 大師調色與畫布萃取 (Canvas Extraction)
如果您已經在 Figma 上有初步的設計，或者想複製某個區塊的顏色設定：
- 點擊「萃取畫布色彩」，系統會深度遍歷選取的圖層，根據圖層的角色面積、層級，自動反推出一套完整的 24 色調色盤。
- 支援手動微調任意色塊（包含純色與漸層）。

### 3. 👁️ 圖片靈感與 DNA 萃取 (Vision DNA)
- **視覺分析**：上傳任何參考圖片，系統會使用 Gemini Vision 模型萃取圖片的「視覺 DNA」（例如：毛玻璃擬物、極簡線性、次世代 3D）。
- **素材生成**：結合您輸入的主題與萃取出的 DNA，自動生成完美契合該風格的 UI 裝飾圖片，並可一鍵注入到您的 Figma 畫布中。

### 4. 📚 收藏與開發者交付 (Collections & Export)
- 遇到滿意的配色，可以儲存至「收藏」庫中，隨時切換與更名。
- 內建優化過的超大編輯面板，讓您輕鬆檢視 24 色矩陣。
- **工程師友善**：一鍵複製 CSS Variables (Tokens)，直接匯出標準化的 `--primary`, `--surface2` 等 CSS 變數，實現設計與開發零時差。

---

## 🚀 如何安裝與使用

### 本地安裝至 Figma
1. 下載或 Clone 本專案的原始碼資料夾。
2. 開啟 Figma 桌面版應用程式。
3. 在上方選單選擇 **Plugins** > **Development** > **Import plugin from manifest...**。
4. 選擇專案資料夾內的 `manifest.json` 檔案。
5. 安裝完成後，即可在畫布上按右鍵 > Plugins > Development > 執行 `一鍵改風格 - Design System 版`。

### 操作流程
1. **框選畫布**：在 Figma 中框選您想要變更風格的 Frame 或 UI 元件。
2. **開啟外掛**：執行外掛，點擊「AI 智慧」頁籤。
3. **輸入 API Key**：貼上您的 Google Gemini API Key（請見下方說明）。
4. **生成色彩**：輸入風格描述並點擊「啟動 AI 24 色系統與變數」。
5. **微調與收藏**：若對個別顏色不滿意，可在介面上直接點擊色塊編輯，並將結果加入收藏。

---

## 🔑 如何申請 Gemini API Key？

本外掛的 AI 核心由 Google 最先進的 Gemini 模型（包含 `gemini-2.5-flash`、`gemini-2.0-flash` 等）驅動。

1. **前往 Google AI Studio**
   請至 [Google AI Studio (https://aistudio.google.com/)](https://aistudio.google.com/) 並登入您的 Google 帳號。
2. **取得 API Key**
   點擊左側選單的 **"Get API key"**。
3. **建立新的 Key**
   點擊 **"Create API key"**，選擇您現有的 Google Cloud 專案（或是建立一個新專案）。
4. **複製金鑰**
   將產生出的一串長字元金鑰複製下來。
5. **貼入 Figma 外掛**
   回到 Figma 中，將這串金鑰貼到外掛「AI 智慧」頁籤最上方的 `Gemini API Key` 欄位中。系統會自動記憶，未來不需重複輸入！

---

## 🛠 技術特點 (給開發者的話)

- **智慧節點穿透 (Smart Node Traversal)**：外掛內建了深度優先的節點搜尋算法。它可以繞過群組(Group)不能上色的限制，實作了「原子級角色繼承」，確保按鈕內的背景與文字永遠保持最佳的對比度，不會發生文字消失的狀況。
- **無縫避開字體載入錯誤**：採用智能圖層名稱與 `characters` 聯合解析策略，避開了 Figma API 非同步加載字體造成的效能瓶頸。
- **多模型備援機制 (Fallback Chain)**：自動因應 API 流量狀況，在 `gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-1.5-pro` 之間無縫切換，徹底告別 503 與 404 錯誤。

**Design System Pro** – 讓每一份設計稿都像藝術品般精準。
