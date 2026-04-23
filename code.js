// ── Figma Plugin: AI Design System Master (V21 - 24色終極商業完整版) ──

figma.showUI(__html__, { width: 380, height: 680, title: "Design System Pro — 24色大師版" });

figma.clientStorage.getAsync('gemini_api_key').then(apiKey => {
  figma.clientStorage.getAsync('saved_palettes').then(palettes => {
    figma.ui.postMessage({ type: 'LOAD_KEY_AND_PALETTES', key: apiKey || '', palettes: palettes || [] });
  });
}).catch(e => console.warn(e));

// 🎨 數學公式：Figma 漸層矩陣轉角度 (Matrix to Angle)
function getAngleFromTransform(transform) {
  if (!transform || !transform[0] || !transform[1]) return 90;
  const a = transform[0][0];
  const d = transform[1][0];
  const angle = Math.atan2(d, a) * (180 / Math.PI);
  return Math.round(angle + 90);
}

// 🎨 數學公式：角度轉 Figma 漸層矩陣 (Angle to Matrix)
function getTransformFromAngle(angle) {
  const safeAngle = isNaN(angle) ? 90 : angle;
  const rad = (safeAngle - 90) * (Math.PI / 180);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return [
    [cos, -sin, 0.5 - 0.5 * cos + 0.5 * sin],
    [sin, cos, 0.5 - 0.5 * sin - 0.5 * cos]
  ];
}


async function readAndSend() {
  const selection = figma.currentPage.selection;
  figma.ui.postMessage({ type: "FILLS_DATA", nodes: selection.map(n => ({ id: n.id, name: n.name })) });

  if (selection.length > 0) {
    for (const node of selection) {
      if ('fills' in node && Array.isArray(node.fills)) {
        const imageFill = node.fills.find(f => f.type === 'IMAGE');
        if (imageFill && imageFill.imageHash) {
          try {
            const image = figma.getImageByHash(imageFill.imageHash);
            const bytes = await image.getBytesAsync();
            // Figma sandbox: 使用 figma.base64Encode 避免 Uint8Array postMessage 問題
            const base64 = figma.base64Encode(bytes);
            figma.ui.postMessage({ type: 'IMAGE_DNA', bytes: base64 });
            return;
          } catch (e) { console.error(e); }
        }
      }
    }
  }
  figma.ui.postMessage({ type: 'CLEAR_DNA' });
}

readAndSend();

let debounceTimer = null;
figma.on("selectionchange", () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(readAndSend, 200);
});

// 🛡️ 防護網 (排除圖片、隱藏物件、小圖標內的形狀)
function isStrictlyProtected(node) {
  if (node.type === "BOOLEAN_OPERATION") return false;
  if (!node.visible || (node.opacity !== undefined && node.opacity < 0.05)) return true;
  if ("fills" in node && Array.isArray(node.fills)) {
    for (let f of node.fills) if (f.type === "IMAGE" || f.type === "VIDEO") return true;
  }
  let p = node.parent;
  while (p) {
    if (['icon', 'icon_', 'ic_'].some(k => (p.name || "").toLowerCase().indexOf(k) !== -1)) {
      if (node.type !== "VECTOR" && node.type !== "BOOLEAN_OPERATION" && node.type !== "TEXT") return true;
    }
    p = p.parent;
  }
  var n = (node.name || "").toLowerCase();
  var blackList = ['logo', 'img', 'image', 'pic', 'avatar', 'photo', 'illustration', 'shadow', '陰影', 'glow', 'highlight', '高光', 'hitbox', 'mask'];
  return blackList.some(keyword => n.indexOf(keyword) !== -1);
}

// 🎯 24 色角色判定 (深度感知版)
function determineRole(node, depth) {
  if (depth === undefined) depth = 0;
  var name = (node.name || "").toLowerCase();
  var type = node.type;
  var parentName = (node.parent && node.parent.name) ? node.parent.name.toLowerCase() : "";
  var fullPath = name + " " + parentName;

  var w = Math.max(node.width || 0, 0.1);
  var h = Math.max(node.height || 0, 0.1);
  var area = w * h;

  // 1. 強制隔離文字
  if (type === "TEXT") {
    if (['button', 'btn', 'primary', 'cta'].some(k => fullPath.indexOf(k) !== -1)) return "textOnBtn";
    if (node.opacity !== undefined && node.opacity < 0.5) return "text3";
    if (['disabled', 'weak', '禁用', '弱化'].some(k => fullPath.indexOf(k) !== -1)) return "text3";
    if (node.opacity !== undefined && node.opacity < 0.8) return "text2";
    if (['sub', 'desc', 'caption', 'time', 'date', 'placeholder', '次要'].some(k => fullPath.indexOf(k) !== -1)) return "text2";
    return "text";
  }

  // 2. 強制隔離線條與小圖示
  if (type === "LINE" || (type === "VECTOR" && (w <= 1.5 || h <= 1.5)) || ['line', 'divider', 'separator', '分割'].some(k => name.indexOf(k) !== -1)) return "divider";

  // 2.5 邊框判定 (有線條寬度且不是 LINE)
  if (node.strokes && node.strokes.length > 0 && node.strokeWeight > 0) {
    if (['border', 'stroke', 'outline', '線框', '描邊'].some(k => name.indexOf(k) !== -1)) return "border";
  }

  if ((type === "VECTOR" || type === "BOOLEAN_OPERATION") && w <= 48 && h <= 48 && !['bg', 'base', 'mask'].some(k => name.indexOf(k) !== -1)) {
    if (['disable', 'disabled', '次要', 'secondary', 'sub', '2'].some(k => name.indexOf(k) !== -1)) return "icon2";
    return "icon";
  }

  // 3. 狀態標籤與回饋
  if (['delete', 'remove', 'danger', '刪除', '移除', 'fail', '失敗', '錯誤'].some(k => fullPath.indexOf(k) !== -1)) return "danger";
  if (['warning', 'error', 'alert', '警告'].some(k => fullPath.indexOf(k) !== -1)) return "accent";
  if (['success', '成功', '通過', 'online', 'completed'].some(k => fullPath.indexOf(k) !== -1)) return "success";
  if (['info', 'tip', '提示', '資訊', 'help'].some(k => fullPath.indexOf(k) !== -1)) return "info";

  // 輔助函式：深度讀取按鈕內的文字內容 (使用 name 避開 loadFontAsync 限制)
  function getButtonTextRole(n) {
    if (n.type === 'TEXT') return n.name || '';
    if (!n.children) return '';
    let t = '';
    for (const c of n.children) {
      if (c.type === 'TEXT') t += c.name;
      else if (c.children) t += getButtonTextRole(c);
    }
    return t;
  }

  // 4. 按鈕層級細分 (Buttons & Tabs)
  let btnText = '';
  try { btnText = getButtonTextRole(node).toLowerCase(); } catch(e){}
  const searchString = name + btnText;

  const isNamedButton = ['button', 'btn', 'tab', 'action', '按鈕', '按钮', 'btn_'].some(k => fullPath.indexOf(k) !== -1);
  const isButtonText = btnText && ['確認', '确认', '提交', '登入', '登录', '註冊', '注册', '送出', '清空', '分析', '開獎', '开奖', '投注', '取消', '更多', '儲存', '保存', '加入', '確定', '确定', 'confirm', 'submit', 'login', 'cancel', 'save', 'search', '搜尋', '搜索'].some(k => btnText.indexOf(k) !== -1);
  const isButtonLikeShape = (type === "FRAME" || type === "GROUP" || type === "RECTANGLE" || type === "COMPONENT" || type === "INSTANCE") && h >= 20 && h <= 120 && w >= 40 && w <= 400;

  if (isNamedButton || (isButtonText && isButtonLikeShape)) {
    if (['danger', 'delete', 'remove', 'warning', '刪除', '删除', '危險', '危险', '警告', '清空', '重置', '取消', 'cancel'].some(k => searchString.indexOf(k) !== -1)) return "danger";
    if (['success', 'add', 'confirm', 'check', '成功', '確認', '确认', '新增', '儲存', '保存', '送出', '投注', '確定', '确定'].some(k => searchString.indexOf(k) !== -1)) return "success";
    if (['secondary', 'outline', 'ghost', 'sub', '次要', '更多', '詳細', '详细', '返回', '分析', '開獎', '开奖'].some(k => searchString.indexOf(k) !== -1)) return "secondary";
    if (['tab', 'switch', 'menu_item', '切換', '切换', '三級', '三级'].some(k => searchString.indexOf(k) !== -1)) return "secondary2";
    if (['gradient', 'special', '主按鈕2', '主按钮2', '漸變按鈕', '渐变按钮', 'vip'].some(k => searchString.indexOf(k) !== -1)) return "primary2";
    return "primary";
  }

  // 5. 背景判定（深度優先）
  if (depth === 0) return "bg"; // 選取物本身就是背景
  if (type === "FRAME" && (!node.parent || node.parent.type === "PAGE")) return "bg";
  if (['bg', 'background', '底圖', 'wallpaper', 'page'].some(k => fullPath.indexOf(k) !== -1)) return "bg";
  // depth=1 : 薄帶狀元素 (h<=100) = nav/footer → surface；寬且高 = 背景大區 → bg
  if (depth === 1) {
    const isNavEl = ['nav', 'header', 'toolbar', 'topbar', 'menubar', 'menu-bar', '導航', '頂欄', '导航'].some(k => name.indexOf(k) !== -1);
    if (isNavEl || (h <= 100 && w >= 400)) return "surface"; // 薄橫帶（含 nav、sub-nav）
    if (w >= 1200 && h >= 150) return "bg";   // 全幅且有一定高度 = 背景延伸
    if (w >= 800 || h >= 600) return "bg";    // 廣域元素 = bg（還原舊邏輯，避免大區域被誤判）
    return "surface";                          // 其他 depth=1 小面板 = surface
  }

  // 6. 裝飾圖形（Vector 且有一定大小）
  if (type === "VECTOR" && area > 2000) {
    if (name.indexOf('3') !== -1) return "deco3";
    if (name.indexOf('2') !== -1 || ['secondary', 'deco2'].some(k => name.indexOf(k) !== -1)) return "deco2";
    return "deco1";
  }
  if (['deco', 'wave', 'blob', 'illustration', '裝飾', '波浪', '裝飾'].some(k => name.indexOf(k) !== -1)) {
    if (name.indexOf('3') !== -1) return "deco3";
    if (name.indexOf('2') !== -1) return "deco2";
    return "deco1";
  }

  // 7. 具名面板
  if (['dropdown', 'tooltip', 'popover', 'modal', 'dialog', '浮層', '彈窗'].some(k => fullPath.indexOf(k) !== -1)) return "surface4";
  if (['input', 'search', 'field', '輸入框', '搜索', 'textarea', 'textbox'].some(k => fullPath.indexOf(k) !== -1)) return "surface3";
  if (['inner', 'sub', 'item', 'list', 'content', 'card_bg', 'inner_card', '項目', '列表'].some(k => fullPath.indexOf(k) !== -1)) return "surface2";
  if (['card', 'surface', 'panel', 'menu', 'bar', 'view', 'rectangle', 'box', 'header', 'footer', 'nav', 'section', '導航', '區塊', '卡片'].some(k => fullPath.indexOf(k) !== -1)) return "surface";

  // 8. 深度 + 面積複合判定 (無名區塊)
  if (depth === 1 && area > 200000) return "bg"; // 非常大的第一層子元素應視為背景延伸
  if (depth === 1) return "surface"; // bg 的直接子層 = 大面板
  if (area > 250000) return "surface";
  if (area > 20000) return "surface2";
  return "surface3";
}
figma.ui.onmessage = async function (msg) {

  // ── 🎯 從畫布擷取顏色 (16色權重抓取) ──
  if (msg.type === "EXTRACT_CANVAS_COLORS") {
    try {
      const selection = figma.currentPage.selection;
      if (selection.length === 0) return figma.notify("⚠️ 請先框選要擷取顏色的設計稿圖層！");

      const rolePriority = ['bg', 'surface', 'surface2', 'surface3', 'surface4', 'primary', 'primary2', 'accent', 'danger', 'success', 'info', 'secondary', 'secondary2', 'text', 'text2', 'text3', 'textOnBtn', 'border', 'divider', 'icon', 'icon2', 'deco1', 'deco2', 'deco3'];
      const colorStats = {};
      rolePriority.forEach(r => colorStats[r] = {});
      const globalColors = new Map();
      const MAX_WALK_DEPTH = 15;

    function figmaPaintToData(paint) {
      if (!paint) return null;
      const toHex = (c) => "#" + Math.round(c.r * 255).toString(16).padStart(2, '0').toUpperCase() + Math.round(c.g * 255).toString(16).padStart(2, '0').toUpperCase() + Math.round(c.b * 255).toString(16).padStart(2, '0').toUpperCase();
      if (paint.type === 'SOLID' && paint.color) {
        return { type: 'SOLID', hex: toHex(paint.color), opacity: paint.opacity !== undefined ? paint.opacity : 1 };
      } else if (paint.type === 'GRADIENT_LINEAR' && paint.gradientStops && paint.gradientStops.length >= 2) {
        return {
          type: 'GRADIENT',
          hex1: toHex(paint.gradientStops[0].color), opacity1: paint.gradientStops[0].color.a !== undefined ? paint.gradientStops[0].color.a : 1,
          hex2: toHex(paint.gradientStops[paint.gradientStops.length - 1].color), opacity2: paint.gradientStops[paint.gradientStops.length - 1].color.a !== undefined ? paint.gradientStops[paint.gradientStops.length - 1].color.a : 1,
          angle: getAngleFromTransform(paint.gradientTransform)
        };
      }
      return null;
    }

    function getVisiblePaint(node, role) {
      if ((role === 'border' || role === 'divider') && node.strokes && node.strokes.length > 0) return node.strokes.find(s => s.visible !== false) || null;
      if (!node.fills || !Array.isArray(node.fills)) return null;
      return node.fills.find(p => p.visible !== false && (p.opacity === undefined || p.opacity > 0.05) && p.type !== 'IMAGE' && p.type !== 'VIDEO') || null;
    }

    selection.forEach(function (selRoot) {
      (function walk(node, depth) {
        if (depth > MAX_WALK_DEPTH) return;
        if (node.visible === false || (node.opacity !== undefined && node.opacity <= 0.05)) return;
        const role = determineRole(node, depth);
        if (node.type !== 'GROUP') {
          const paint = getVisiblePaint(node, role);
          const data = figmaPaintToData(paint);
          if (data) {
            const keyStr = JSON.stringify(data);
            let w = Math.max(node.absoluteBoundingBox ? node.absoluteBoundingBox.width : 10, 1);
            let h = Math.max(node.absoluteBoundingBox ? node.absoluteBoundingBox.height : 10, 1);
            let area = w * h;

            // 防污染加權
            if (role.startsWith('text') || role === 'icon' || role === 'divider') area = 50000;
            // 階段三：非裝飾角色的 Vector 大幅降噪（防止裝飾漸層沙染 surface 統計）
            else if (node.type === 'VECTOR' && role !== 'deco1' && role !== 'deco2') area = area * 0.05;
            else if (node.type === 'VECTOR') area = area * 0.5; // deco 對應角色保留權重
            // 階段一強化權重：根節點與直接子層
            else if (depth === 0) area = area * 10; // depth=0 除了統計外，後迵直取
            else if (depth === 1) area = area * 3;

            if (!colorStats[role][keyStr]) colorStats[role][keyStr] = 0;
            colorStats[role][keyStr] += area;
            if (!globalColors.has(keyStr)) globalColors.set(keyStr, 0);
            globalColors.set(keyStr, globalColors.get(keyStr) + area);
          }
        }
        if ("children" in node && node.type !== "BOOLEAN_OPERATION") node.children.forEach(c => walk(c, depth + 1));
      })(selRoot, 0);
    });

    // ── 階段一：根節點直取 BG 色（最高優先度）
    // 如果 depth=0 節點自身有 fill，直接指定為 bg，不經過統計競爭
    const finalExtracted = {};
    for (const selRoot of selection) {
      if ('fills' in selRoot && Array.isArray(selRoot.fills)) {
        const rootPaint = selRoot.fills.find(p => p.visible !== false && p.type !== 'IMAGE' && p.type !== 'VIDEO' && p.opacity > 0.05);
        const rootData = rootPaint ? figmaPaintToData(rootPaint) : null;
        if (rootData) {
          finalExtracted['bg'] = rootData;
          break; // 只取第一個選取物的背景色
        }
      }
    }

    const allSortedGlobal = Array.from(globalColors.keys()).sort((a, b) => globalColors.get(b) - globalColors.get(a));
    const dominantColorStr = allSortedGlobal.length > 0 ? allSortedGlobal[0] : JSON.stringify({ type: 'SOLID', hex: '#FFFFFF', opacity: 1 });

    if (!finalExtracted['bg']) {
      // 若根節點沒抓到，嘗試從統計抓最高頻
      const bgStats = Object.keys(colorStats['bg']).sort((a, b) => colorStats['bg'][b] - colorStats['bg'][a]);
      if (bgStats.length > 0) finalExtracted['bg'] = JSON.parse(bgStats[0]);
      else finalExtracted['bg'] = JSON.parse(dominantColorStr); // 畫布最多使用的顏色必定是背景
    }

    const assignedKeys = new Set();
    if (finalExtracted['bg']) assignedKeys.add(JSON.stringify(finalExtracted['bg']));

    for (let role of rolePriority) {
      if (finalExtracted[role]) continue;
      const sortedKeys = Object.keys(colorStats[role]).sort((a, b) => colorStats[role][b] - colorStats[role][a]);
      let assigned = false;
      for (let key of sortedKeys) {
        if (!assignedKeys.has(key) || ['text', 'text2', 'text3', 'textOnBtn', 'border', 'divider', 'icon', 'icon2'].includes(role)) {
          finalExtracted[role] = JSON.parse(key);
          if (!['text', 'text2', 'text3', 'textOnBtn', 'border', 'divider', 'icon', 'icon2'].includes(role)) assignedKeys.add(key);
          assigned = true; break;
        }
      }
      if (!assigned && sortedKeys.length > 0) {
        finalExtracted[role] = JSON.parse(sortedKeys[0]);
        if (!['text', 'text2', 'text3', 'textOnBtn', 'border', 'divider', 'icon', 'icon2'].includes(role)) assignedKeys.add(sortedKeys[0]);
      }
    }

    let unassignedKeys = Array.from(globalColors.keys()).filter(k => !assignedKeys.has(k));
    unassignedKeys.sort((a, b) => globalColors.get(b) - globalColors.get(a));

    for (let r of rolePriority) {
      if (!finalExtracted[r] && unassignedKeys.length > 0) {
        let chosenIdx = 0;
        if (['primary', 'primary2', 'accent', 'danger', 'success', 'info', 'secondary', 'secondary2'].includes(r)) {
          let colorfulIdx = unassignedKeys.findIndex(k => !k.includes('#FFFFFF') && !k.includes('#000000'));
          if (colorfulIdx !== -1) chosenIdx = colorfulIdx;
        }
        finalExtracted[r] = JSON.parse(unassignedKeys[chosenIdx]);
        unassignedKeys.splice(chosenIdx, 1);
      }
    }

    // ── 終極備援：Smart Fallback (確保 24 色全滿，不再出現 undefined)
    const dom = JSON.parse(dominantColorStr);
    const smartFallback = {
      bg: finalExtracted['surface'] || dom,
      surface: finalExtracted['bg'] || dom,
      surface2: finalExtracted['surface'] || finalExtracted['bg'] || dom,
      surface3: finalExtracted['surface2'] || dom,
      surface4: finalExtracted['surface'] || dom,
      primary: finalExtracted['accent'] || finalExtracted['text'] || { type: 'SOLID', hex: '#38BDF8', opacity: 1 },
      primary2: finalExtracted['primary'] || { type: 'SOLID', hex: '#0284C7', opacity: 1 },
      secondary: finalExtracted['surface3'] || finalExtracted['surface'] || dom,
      secondary2: finalExtracted['secondary'] || dom,
      accent: finalExtracted['primary'] || { type: 'SOLID', hex: '#F59E0B', opacity: 1 },
      danger: finalExtracted['accent'] || { type: 'SOLID', hex: '#EF4444', opacity: 1 },
      success: finalExtracted['success'] || { type: 'SOLID', hex: '#10B981', opacity: 1 },
      info: finalExtracted['primary'] || { type: 'SOLID', hex: '#3B82F6', opacity: 1 },
      text: allSortedGlobal.length > 1 ? JSON.parse(allSortedGlobal[1]) : { type: 'SOLID', hex: '#0F172A', opacity: 1 },
      text2: finalExtracted['text'] || dom,
      text3: finalExtracted['text2'] || dom,
      textOnBtn: finalExtracted['bg'] || dom,
      border: finalExtracted['divider'] || finalExtracted['surface2'] || dom,
      divider: finalExtracted['border'] || dom,
      icon: finalExtracted['text'] || finalExtracted['primary'] || dom,
      icon2: finalExtracted['icon'] || dom,
      deco1: finalExtracted['primary'] || finalExtracted['secondary'] || dom,
      deco2: finalExtracted['secondary'] || dom,
      deco3: finalExtracted['primary2'] || dom
    };

    for (let r of rolePriority) {
      if (!finalExtracted[r]) finalExtracted[r] = smartFallback[r] || dom;
    }

    // ── 階段四：層級顏色去重 Sanity Check
    // 確保 bg → surface → surface2 → surface3 四層顏色線角可辨
    function hexToRgbExtract(hex) {
      if (!hex) return null;
      let h = hex.replace('#', '');
      if (h.length === 3) h = h.split('').map(c => c + c).join('');
      return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
    }
    function colorDist(d1, d2) {
      // 計算兩個顏色資料的色差（SOLID 對 SOLID，漸層取第一色對比）
      const getHex = (d) => d ? (d.type === 'GRADIENT' ? d.hex1 : d.hex) : null;
      const rgb1 = hexToRgbExtract(getHex(d1));
      const rgb2 = hexToRgbExtract(getHex(d2));
      if (!rgb1 || !rgb2) return 999;
      return Math.sqrt(Math.pow(rgb1.r - rgb2.r, 2) + Math.pow(rgb1.g - rgb2.g, 2) + Math.pow(rgb1.b - rgb2.b, 2));
    }
    // 對 surface / surface2 / surface3，如果該層與上層色差 < 20，改取該角色統計中第二顧
    const layerPairs = [['bg', 'surface'], ['surface', 'surface2'], ['surface2', 'surface3']];
    for (const [upper, lower] of layerPairs) {
      if (!finalExtracted[upper] || !finalExtracted[lower]) continue;
      const dist = colorDist(finalExtracted[upper], finalExtracted[lower]);
      if (dist < 20) { // 顏色太接近，改用第二顧
        const sortedKeys = Object.keys(colorStats[lower]).sort((a, b) => colorStats[lower][b] - colorStats[lower][a]);
        for (const key of sortedKeys) {
          const candidate = JSON.parse(key);
          if (colorDist(finalExtracted[upper], candidate) >= 20) {
            finalExtracted[lower] = candidate;
            break;
          }
        }
      }
    }

      const formattedForUI = {};
      for (let [r, d] of Object.entries(finalExtracted)) {
        if (d.type === 'SOLID') formattedForUI[r] = { type: 'SOLID', color: d.hex, opacity: Math.round(d.opacity * 100) };
        else formattedForUI[r] = { type: 'GRADIENT', color1: d.hex1, opacity1: Math.round(d.opacity1 * 100), color2: d.hex2, opacity2: Math.round(d.opacity2 * 100), angle: d.angle };
      }
      figma.ui.postMessage({ type: 'EXTRACTED_COLORS', colors: formattedForUI });
    } catch (e) {
      figma.notify("❌ 萃取失敗：" + e.message);
      console.error(e);
    }
  }
  // ── 🎯 核心塗裝引擎 (自動 Styles & 陰影 & WCAG 防呆) ──
  if (msg.type === "APPLY_AI_STYLE" || msg.type === "FORCE_APPLY_COLOR") {
    if (msg.apiKey) figma.clientStorage.setAsync('gemini_api_key', msg.apiKey).catch(e => { });

    const selection = figma.currentPage.selection;
    if (selection.length === 0) return figma.notify("⚠️ 請選取範圍");

    const theme = msg.color || {};
    let changedCount = 0;

    // 🛡️ 安全 HEX 轉換 (避免舊版 JS 引擎報錯)
    const hexToRgb = (hex) => {
      if (!hex) return { r: 0, g: 0, b: 0 };
      let cleanHex = hex.trim().replace(/^#/, '');
      if (cleanHex.length === 3) cleanHex = cleanHex.split('').map(c => c + c).join('');
      return {
        r: parseInt(cleanHex.slice(0, 2), 16) / 255 || 0,
        g: parseInt(cleanHex.slice(2, 4), 16) / 255 || 0,
        b: parseInt(cleanHex.slice(4, 6), 16) / 255 || 0
      };
    };

    function createFigmaPaints(data) {
      if (!data) return [];
      try {
        if (data.type === 'GRADIENT') {
          const op1 = isNaN(data.opacity1) ? 1 : Math.max(0, Math.min(100, data.opacity1)) / 100;
          const op2 = isNaN(data.opacity2) ? 1 : Math.max(0, Math.min(100, data.opacity2)) / 100;
          const rgb1 = hexToRgb(data.color1 || data.color);
          const rgb2 = hexToRgb(data.color2 || data.color);
          return [{
            type: 'GRADIENT_LINEAR',
            gradientTransform: getTransformFromAngle(data.angle || 90),
            gradientStops: [
              { position: 0, color: { r: rgb1.r, g: rgb1.g, b: rgb1.b, a: op1 } },
              { position: 1, color: { r: rgb2.r, g: rgb2.g, b: rgb2.b, a: op2 } }
            ]
          }];
        } else {
          const op = isNaN(data.opacity) ? 1 : Math.max(0, Math.min(100, data.opacity)) / 100;
          const rgb = hexToRgb(data.color);
          return [{ type: 'SOLID', color: { r: rgb.r, g: rgb.g, b: rgb.b }, opacity: op }];
        }
      } catch (err) {
        console.error("Paint 建立失敗", err);
        return [];
      }
    }

    function getLuminance(rgb) {
      const a = [rgb.r, rgb.g, rgb.b].map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    }

    const styleMap = {};
    if (msg.type === "APPLY_AI_STYLE") {
      try {
        const localStyles = figma.getLocalPaintStyles();
        for (const [role, data] of Object.entries(theme)) {
          if (!data) continue;
          const styleName = `DSP Theme / ${role}`;
          let style = localStyles.find(s => s.name === styleName);
          if (!style) { style = figma.createPaintStyle(); style.name = styleName; }
          const validPaints = createFigmaPaints(data);
          if (validPaints.length > 0) { style.paints = validPaints; styleMap[role] = style.id; }
        }
      } catch (err) { }
    }

    const MAX_APPLY_DEPTH = 15;
    selection.forEach(function (selRoot) {
      (function applyToNode(node, depth, inheritedRole) {
        if (depth > MAX_APPLY_DEPTH) return;
        if (msg.type !== "FORCE_APPLY_COLOR" && isStrictlyProtected(node)) return;

        let role = determineRole(node, depth);
        
        // 🚀 強制繼承邏輯：若父層是按鈕等原子級件，強制覆蓋子層色彩
        if (inheritedRole) {
            if (node.type === 'TEXT') {
                role = 'textOnBtn'; // 按鈕內文字強制為按鈕文字色
            } else if (node.type === 'VECTOR' || node.type === 'BOOLEAN_OPERATION') {
                role = 'textOnBtn'; // 按鈕內圖示強制跟文字同色
            } else {
                role = inheritedRole; // 按鈕內形狀強制繼承按鈕底色
            }
        }

        let styleData = (msg.type === "FORCE_APPLY_COLOR") ? msg.color : theme[role];
        let targetProp = (msg.type === "FORCE_APPLY_COLOR") ? msg.target : 'fills';

        const atomicRoles = ['primary', 'primary2', 'secondary', 'secondary2', 'success', 'danger', 'info', 'accent'];
        let passDownRole = inheritedRole;
        if (!passDownRole && atomicRoles.includes(role)) {
            passDownRole = role; // 把按鈕屬性往下傳給子層 (如 Group 內的 Rectangle)
        }

        if (!styleData) {
          if ("children" in node && node.type !== "BOOLEAN_OPERATION") node.children.forEach(c => applyToNode(c, depth + 1, passDownRole));
          return;
        }
        let paints = createFigmaPaints(styleData);
        if (paints.length === 0) {
          if ("children" in node && node.type !== "BOOLEAN_OPERATION") node.children.forEach(c => applyToNode(c, depth + 1, passDownRole));
          return;
        }

        let applyFill = false, applyStroke = false;

        if (msg.type === "FORCE_APPLY_COLOR") {
          if (targetProp === 'fills') {
            if (node.type === 'TEXT') applyFill = true;
            else if ('fills' in node && Array.isArray(node.fills) && node.fills.some(f => f.visible !== false && f.type !== 'IMAGE')) applyFill = true;
          }
          if (targetProp === 'strokes') {
            if ('strokes' in node && Array.isArray(node.strokes) && node.strokes.some(s => s.visible !== false)) applyStroke = true;
          }
        } else {
          if (role === 'border' || role === 'divider') {
            if ('strokes' in node && Array.isArray(node.strokes) && node.strokes.some(s => s.visible !== false)) applyStroke = true;
          } else {
            if (node.type === 'TEXT') applyFill = true;
            else if ('fills' in node && Array.isArray(node.fills)) {
              const hasVisibleFill = node.fills.some(f => f.visible !== false && f.type !== 'IMAGE');
              if (hasVisibleFill) applyFill = true;
              else if (node.type === 'FRAME' && (!node.parent || node.parent.type === 'PAGE') && node.fills.length === 0) applyFill = true; // 僅當根節點「完全沒有」設定任何 fill 時才補上
            }
          }
        }

        let applied = false;
        function safeSet(n, prop, paintArr, styleId) {
          try {
            if (n.type === 'TEXT' && prop === 'fills' && n.fillStyleId && n.fillStyleId !== figma.mixed) n.fillStyleId = '';

            // WCAG 安全轉換 - 全層級遍歷，確保文字在任意容器內對比可用
            if (n.type === "TEXT" && prop === 'fills' && styleData.type === 'SOLID') {
              let currentBgNode = n.parent;
              let closestBgData = theme['surface'];

              // 往上找最近的有效背景色角色
              while (currentBgNode && currentBgNode.type !== 'PAGE') {
                let pRole = determineRole(currentBgNode, Math.max(0, depth - 1));
                if (['bg', 'surface', 'surface2', 'surface3', 'primary', 'secondary', 'accent', 'success'].includes(pRole)) {
                  if (theme[pRole] && theme[pRole].type === 'SOLID') {
                    closestBgData = theme[pRole];
                    break;
                  }
                }
                currentBgNode = currentBgNode.parent;
              }

              if (closestBgData && closestBgData.type === 'SOLID') {
                let txtL = getLuminance(hexToRgb(styleData.color));
                let bgL = getLuminance(hexToRgb(closestBgData.color));
                let contrast = (Math.max(txtL, bgL) + 0.05) / (Math.min(txtL, bgL) + 0.05);

                if (contrast < 3.5) { // 達不到 W3C AA 級可讀性標準
                  // 根據背景明度直接翻轉文字顏色
                  let safeRgb = bgL > 0.5 ? { r: 0.1, g: 0.1, b: 0.1 } : { r: 0.95, g: 0.95, b: 0.95 };
                  paintArr = [{ type: 'SOLID', color: safeRgb, opacity: 1 }];
                  styleId = null;
                }
              }
            }

            let finalPaintArr = paintArr;
            if (prop === 'fills' && 'fills' in n && Array.isArray(n.fills)) {
              const imageFills = n.fills.filter(f => f.type === 'IMAGE' || f.type === 'VIDEO');
              if (imageFills.length > 0) {
                if (n.fillStyleId && n.fillStyleId !== figma.mixed) n.fillStyleId = '';
                finalPaintArr = [...paintArr, ...imageFills];
                styleId = null;
              }
            }

            if (styleId && msg.type === "APPLY_AI_STYLE") {
              if (prop === 'fills') n.fillStyleId = styleId;
              if (prop === 'strokes') n.strokeStyleId = styleId;
            } else {
              n[prop] = finalPaintArr;
            }
            return true;
          } catch (e) {
            if (n.type === 'TEXT') { try { if (prop === 'fills') n.setRangeFills(0, n.characters.length, paintArr); return true; } catch (e2) { } }
          }
          return false;
        }

        if (applyFill && 'fills' in node) if (safeSet(node, 'fills', paints, styleMap[role])) applied = true;
        if (applyStroke && 'strokes' in node) if (safeSet(node, 'strokes', paints, styleMap[role])) applied = true;

        // 🛡️ 安全版：彩色環境陰影
        if (applied && node.effects && node.effects.length > 0 && styleData.type === 'SOLID') {
          const shadowRGB = hexToRgb(styleData.color);
          try {
            node.effects = node.effects.map(e => {
              if (e.type === 'DROP_SHADOW' || e.type === 'INNER_SHADOW') {
                let oldA = (e.color && e.color.a) ? e.color.a : 0.15;
                return {
                  type: e.type,
                  color: { r: shadowRGB.r * 0.6, g: shadowRGB.g * 0.6, b: shadowRGB.b * 0.6, a: Math.max(oldA, 0.15) },
                  offset: e.offset, radius: e.radius, spread: e.spread, visible: e.visible, blendMode: e.blendMode
                };
              }
              return e;
            });
          } catch (err) { }
        }

        if (applied) changedCount++;
        if ("children" in node && node.type !== "BOOLEAN_OPERATION") node.children.forEach(c => applyToNode(c, depth + 1, passDownRole));
      })(selRoot, 0, null);
    });

    if (msg.type === "FORCE_APPLY_COLOR") figma.notify(`✨ 強制覆蓋完成！(修改了 ${changedCount} 個圖層)`);
    else figma.ui.postMessage({ type: 'RENDER_COMPLETE', count: changedCount });
  }
  // ── 注入影像 ──
  if (msg.type === "INJECT_IMAGE") {
    const selection = figma.currentPage.selection;
    try {
      const bytes = figma.base64Decode(msg.base64);
      const image = figma.createImage(bytes);
      if (selection.length > 0) {
        selection.forEach(node => {
          if ('fills' in node && Array.isArray(node.fills)) {
            const newFills = JSON.parse(JSON.stringify(node.fills));
            let replaced = false;
            for (let i = 0; i < newFills.length; i++) {
              if (newFills[i].type === 'IMAGE' || newFills[i].type === 'SOLID') {
                newFills[i] = { type: 'IMAGE', scaleMode: 'FILL', imageHash: image.hash };
                replaced = true; break;
              }
            }
            if (!replaced) newFills.push({ type: 'IMAGE', scaleMode: 'FILL', imageHash: image.hash });
            node.fills = newFills;
          }
        });
        figma.notify("✨ 素材已精準替換！");
      } else {
        const rect = figma.createRectangle();
        rect.resize(512, 512);
        rect.fills = [{ type: 'IMAGE', scaleMode: 'FILL', imageHash: image.hash }];
        rect.x = figma.viewport.center.x - 256; rect.y = figma.viewport.center.y - 256;
        figma.currentPage.appendChild(rect); figma.currentPage.selection = [rect];
        figma.notify("✨ 素材已生成！");
      }
    } catch (e) { figma.notify("❌ 圖片寫入失敗"); }
  }

  if (msg.type === "SAVE_PALETTES") {
    figma.clientStorage.setAsync('saved_palettes', msg.palettes);
  }
};
