let _weaponPage = 0;

const WEAPON_GROUP_ICONS = {
  "Винтовки":       "assets/Weapon/Rifle.png",
  "Карабины":       "assets/Weapon/Carbine.png",
  "Ружья":          "assets/Weapon/Gun.png",
  "Дерринджеры и пеппербоксы": "assets/Weapon/Derringer.png",
  "Оружие Гатлинга": "assets/Weapon/Gatling.png",
  "Прочее":          "assets/Weapon/Other.png",
  "Взрывчатка":      "assets/Weapon/Dynamite.png",
  "Холодное оружие": "assets/Weapon/Melee.png",
  "Боеприпасы":      "assets/Weapon/Ammunition.png",
  "Револьверы ОД":  "assets/Weapon/Revolver.png",
  "Револьверы ДД":  "assets/Weapon/Revolver.png",
};

// Display order of weapon groups in the picker (pages + search-grouped list).
// Groups not listed here fall to the end, keeping catalog order among themselves.
const WEAPON_GROUP_ORDER = [
  "Винтовки", "Карабины", "Ружья", "Дерринджеры и пеппербоксы",
  "Револьверы ОД", "Револьверы ДД", "Оружие Гатлинга",
  "Холодное оружие", "Прочее", "Взрывчатка", "Боеприпасы",
];

function _sortWeaponGroups(arr) {
  return arr.sort((a, b) => {
    const ia = WEAPON_GROUP_ORDER.indexOf(a);
    const ib = WEAPON_GROUP_ORDER.indexOf(b);
    return (ia === -1 ? Infinity : ia) - (ib === -1 ? Infinity : ib);
  });
}

function _showWeaponPageNav(groups, page) {
  const nav = document.getElementById("picker-group-nav");
  if (!nav) return;
  nav.hidden = false;
  const label = document.getElementById("picker-nav-label");
  const _icon = WEAPON_GROUP_ICONS[groups[page]];
  const _iconL = _icon ? `<img src="${_icon}" class="picker-nav-icon picker-nav-icon--flip" alt="">` : "";
  const _iconR = _icon ? `<img src="${_icon}" class="picker-nav-icon" alt="">` : "";
  label.innerHTML = `${_iconL}<span class="picker-nav-text">${groups[page]}<span class="picker-nav-counter">${page + 1} / ${groups.length}</span></span>${_iconR}`;
  const prev = document.getElementById("picker-nav-prev");
  const next = document.getElementById("picker-nav-next");
  prev.disabled = page === 0;
  next.disabled = page === groups.length - 1;
  prev.onclick = () => {
    _weaponPage = Math.max(0, _weaponPage - 1);
    const s = document.querySelector("#picker-modal .picker-search");
    renderPickerList("weapons", s ? s.value : "");
  };
  next.onclick = () => {
    _weaponPage = Math.min(groups.length - 1, _weaponPage + 1);
    const s = document.querySelector("#picker-modal .picker-search");
    renderPickerList("weapons", s ? s.value : "");
  };
}

function _hideWeaponNav() {
  const el = document.getElementById("picker-group-nav");
  if (el) el.hidden = true;
}

function renderPickerList(type, query) {
  const list = document.querySelector(".picker-list");
  const targetKey = getCatalogStateKey(type);
  const selectedKeys = new Set((state[targetKey] || []).map((item) => catalogKey(item, type)));

  let items = getAvailableCatalogItems(type);
  if (type === "edges") {
    const hasHeavenly = (state.selectedEdges || []).some(e => e.subOf === HEAVENLY_KUNGFU);
    items = items.filter(i =>
      i.requirements !== PRIMETA_NAME &&
      !i.subOf &&
      !(hasHeavenly && i.name === KUNGFU_PARENT)
    );
    items = items.sort((a, b) => {
      const aA = !!a.archetype, bA = !!b.archetype;
      if (aA !== bA) return aA ? -1 : 1;
      return a.name.localeCompare(b.name, "ru");
    });
  }
  if (type === "powers") {
    items = items.filter(i => !isSubPower(i));

    // Скрытые силы: только маршал + ПОКАЗАТЬ ВСЕ
    const marshalAll = state.marshalMode && _powerFilterMode === "all";
    if (!marshalAll) {
      items = items.filter(i => !i.hidden);
    }
    // Арканный фильтр (по ID): только для обычного игрока
    if (!state.marshalMode) {
      const arcaneEdge = (state.selectedEdges || []).find(e =>
        e.id ? window.ARCANE_POWERS_BY_ID?.[e.id] : ARCANE_POWERS[e.name]
      );
      if (arcaneEdge) {
        const allowedIds  = arcaneEdge.id ? window.ARCANE_POWERS_BY_ID?.[arcaneEdge.id] : null;
        const freeIds     = arcaneEdge.id ? window.ARCANE_FREE_POWERS_BY_ID?.[arcaneEdge.id] : null;
        if (allowedIds) {
          items = items.filter(i => i.id && allowedIds.has(i.id));
        } else {
          // Fallback: name-based filter (no ID)
          items = items.filter(i => ARCANE_POWERS[arcaneEdge.name]?.has(i.name));
        }
        if (freeIds) {
          items = items.filter(i => !i.id || !freeIds.has(i.id));
        } else {
          const freeNames = new Set(ARCANE_FREE_POWERS[arcaneEdge.name] || []);
          items = items.filter(i => !freeNames.has(i.name));
        }
      }
    }

    // Ранговый фильтр
    if (_powerFilterMode === "normal") {
      items = items.filter(i => rankValue(i.rank) <= state.rank);
    } else if (_powerFilterMode.startsWith("rank:")) {
      const targetRank = _powerFilterMode.slice(5);
      items = items.filter(i => i.rank === targetRank);
    }
    // "all" = все ранги

    items = items.sort((a, b) => a.name.localeCompare(b.name, "ru"));
  }
  if (query.trim()) {
    const q = query.toLowerCase();
    items = items.filter((item) => item.name.toLowerCase().includes(q));
  }

  // Weapon display: pages when no search, flat grouped list when search active
  let isWeaponSearch = false;
  if (type === "weapons") {
    if (!query.trim()) {
      const wGroups = [];
      const wGrouped = new Map();
      for (const item of items) {
        const g = item.group ?? "Прочее";
        if (!wGrouped.has(g)) { wGrouped.set(g, []); wGroups.push(g); }
        wGrouped.get(g).push(item);
      }
      _sortWeaponGroups(wGroups);
      _weaponPage = Math.max(0, Math.min(_weaponPage, wGroups.length - 1));
      items = wGrouped.get(wGroups[_weaponPage]) || [];
      _showWeaponPageNav(wGroups, _weaponPage);
    } else {
      isWeaponSearch = true;
      _hideWeaponNav();
    }
  } else {
    _hideWeaponNav();
  }

  list.replaceChildren();

  if (!items.length) {
    const empty = document.createElement("div");
    empty.style.cssText = "padding:16px;text-align:center;color:var(--muted)";
    empty.textContent = "Ничего не найдено";
    list.append(empty);
    return;
  }

  const WKE = window.WK_EDGES || {};
  const WKH = window.WK_HINDRANCES || {};

  // Weapon group buckets: only in search mode — page mode renders one group at a time
  const weaponGroupRows = isWeaponSearch ? new Map() : null;
  const weaponGroupOrder = [];
  const hasBugai   = (state.selectedEdges || []).some(e => WKE.BUGAI    ? e.id === WKE.BUGAI    : e.name === "Бугай");
  const hasPolnota = (state.selectedHindrances || []).some(h => WKH.POLNOTA?.size ? WKH.POLNOTA.has(h.id) : h.name === "Полнота");

  function getBlockingHindrance(edgeId, edgeName) {
    const blockMap = window.EDGE_BLOCKED_BY_HINDRANCE;
    if (blockMap && edgeId && blockMap[edgeId]) {
      const selectedHIds = new Set((state.selectedHindrances || []).map(h => h.id).filter(Boolean));
      return [...blockMap[edgeId]].some(hid => selectedHIds.has(hid)) ? true : null;
    }
    // Fallback: name-based check
    const BLOCK_DEF = {
      "Медлительность": ["Стремительность", "Хладнокровие"],
      "Невезение":      ["Везение"],
      "Полнота":        ["Бугай"],
      "Хромота":        ["Быстроногость"],
    };
    for (const [hName, blocked] of Object.entries(BLOCK_DEF)) {
      if (blocked.includes(edgeName) && (state.selectedHindrances || []).some(h => h.name === hName))
        return hName;
    }
    return null;
  }

  items.forEach((item) => {
    const isPrimataMainEdge = type === "edges" && item.name === PRIMETA_NAME;
    const isMultiPickEdge = type === "edges" && !!item.multiPick;
    const isKungfuSub = type === "edges" && KUNGFU_SUB_PARENTS.has(item.name);
    const kungfuSubCount = isKungfuSub ? selectedKungfuSubEdges(item.name).length : 0;
    const isSelected = type !== "weapons" && type !== "armor" && (
      selectedKeys.has(catalogKey(item, type)) ||
      (isPrimataMainEdge && !!selectedPrimataSubEdge()) ||
      (isKungfuSub && kungfuSubCount > 0)
    );
    const isAdded = isSelected && !isMultiPickEdge;
    const row = document.createElement("div");
    row.className = "picker-item" + (isAdded ? " added" : "");

    const info = document.createElement("div");

    const name = document.createElement("div");
    name.className = "picker-item-name";
    name.textContent = item.name;

    const meta = document.createElement("div");
    meta.className = "picker-item-meta";
    if (type === "weapons" || type === "armor") {
      meta.textContent = item.group ?? item.category;
    } else if (type !== "hindrances") {
      meta.textContent = getCatalogMeta(item, type);
    }

    let edgeRankBadge = null;
    let edgeReq = null;
    if (type === "edges") {
      edgeRankBadge = document.createElement("span");
      edgeRankBadge.className = `edge-rank-badge ${rankBadgeClass(item.rank)}`;
      edgeRankBadge.textContent = item.rank;

      let displayReq = (item.requirements && item.requirements !== "-" && item.requirements !== "—") ? item.requirements : "";
      displayReq = displayReq.split(",").map(s => s.trim()).filter(s => {
        if (/дикая\s+карта/i.test(s)) return false;
        if (/мистический\s+дар\s*\(/i.test(s)) return false;
        return true;
      }).join(", ");
      if (item.name.endsWith("++")) {
        const plusName = item.name.slice(0, -1);
        if (!displayReq.includes(plusName)) displayReq = displayReq ? `${plusName}, ${displayReq}` : plusName;
      } else if (item.name.endsWith("+")) {
        const baseName = item.name.slice(0, -1);
        if (!displayReq.includes(baseName)) displayReq = displayReq ? `${baseName}, ${displayReq}` : baseName;
      }
      if (displayReq) {
        edgeReq = document.createElement("div");
        edgeReq.className = "req-badge";
        edgeReq.textContent = `Требования: ${displayReq}`;
      }
    }

    if (type !== "edges" && type !== "hindrances" && type !== "powers" && type !== "armor" && type !== "weapons") {
      info.append(meta);
    }

    if (type === "weapons") {
      const stats = document.createElement("div");
      stats.className = "picker-item-desc";
      const _sp = [];
      const _dash = v => !v || v === "—";
      if (!_dash(item.range))    _sp.push(`Дист: ${item.range}`);
      if (!_dash(item.damage))   _sp.push(`Урон: ${item.damage}`);
      if (!_dash(item.ap))       _sp.push(`ББ: ${item.ap}`);
      if (!_dash(item.magazine)) _sp.push(`Обойма: ${item.magazine}`);
      if (!_dash(item.mode))     _sp.push(`Режим: ${item.mode}`);
      if (!_dash(item.mc))       _sp.push(`МС: ${item.mc}`);
      _sp.push(`Цена: ${item.price}`);
      _sp.push(`Вес: ${item.weight}`);
      if (item.notes) _sp.push(item.notes);
      stats.textContent = _sp.join(" · ");
      info.append(stats);
    }

    if (type === "armor") {
      const stats = document.createElement("div");
      stats.className = "picker-item-desc";
      stats.textContent = `Броня: +${item.bonus} · Мин. сила: ${item.minStr} · Вес: ${item.weight} кг · Цена: ${item.price}`;
      info.append(stats);
    }

    const desc = document.createElement("div");
    desc.className = "picker-item-desc";
    if (type !== "weapons" && type !== "armor") desc.innerHTML = getCatalogDescription(item, type);

    if (type === "hindrances") {
      const _harrowedHind = !!item.harrowedOnly;
      row.classList.add(item.degree === "Крупный" ? "picker-item--major" : "picker-item--minor");
      if (_harrowedHind) row.classList.add("picker-item--harrowed");
      const degreeBadge = document.createElement("span");
      degreeBadge.className = "degree-badge " + (item.degree === "Крупный" ? "major" : "minor") + (_harrowedHind ? " harrowed" : "");
      degreeBadge.textContent = item.degree;
      const nameRow = document.createElement("div");
      nameRow.className = "hindrance-name-row";
      nameRow.append(name, degreeBadge);
      desc.className = "picker-item-desc picker-item-desc--minor";
      info.append(nameRow);
      if (item.penalty && item.penalty !== "-") {
        const penaltyEl = document.createElement("div");
        penaltyEl.className = "picker-item-penalty";
        penaltyEl.textContent = `Штраф: ${item.penalty}`;
        info.append(penaltyEl);
      }
      if (item.bonus && item.bonus !== "-") {
        const bonusEl = document.createElement("div");
        bonusEl.className = "picker-item-bonus";
        bonusEl.textContent = `Бонус: ${item.bonus}`;
        info.append(bonusEl);
      }
      info.append(desc);
    } else if (type === "edges") {
      const nameRow = document.createElement("div");
      nameRow.className = "hindrance-name-row";
      nameRow.append(name, edgeRankBadge);
      info.append(nameRow);
      if (edgeReq) info.append(edgeReq);
      info.append(meta, desc);
      if (item.archetype && ARCHETYPE_COLORS[item.archetype]) {
        const c = ARCHETYPE_COLORS[item.archetype];
        row.style.background = c.tint;
        row.style.borderLeft = `3px solid ${c.border}`;
        name.style.color = c.accent;
      }
    } else if (type === "powers") {
      const nameRow = document.createElement("div");
      nameRow.className = "hindrance-name-row";
      const rankBadge = document.createElement("span");
      rankBadge.className = `edge-rank-badge ${rankBadgeClass(item.rank)}`;
      rankBadge.textContent = item.rank;
      nameRow.append(name, rankBadge);

      const psBadge = document.createElement("span");
      psBadge.className = "power-ps-badge";
      psBadge.textContent = `${getPowerPoints(item)} ПС`;

      const rangeLine = document.createElement("div");
      rangeLine.className = "picker-item-stat";
      rangeLine.textContent = `Дистанция: ${item.range}`;

      const durationLine = document.createElement("div");
      durationLine.className = "picker-item-stat";
      durationLine.textContent = `Длительность: ${item.duration}`;

      info.append(nameRow, psBadge, rangeLine, durationLine, desc);
      const extraHtml = POWER_EXTRA_HTML[item.name];
      if (extraHtml) {
        const extra = document.createElement("div");
        extra.className = "power-ext";
        extra.innerHTML = extraHtml;
        info.append(extra);
      }
    } else if (type === "weapons") {
      info.append(name);
    } else if (type === "armor") {
      info.append(name, meta);
    } else {
      info.append(name, meta, desc);
    }

    const isReqMet = type !== "edges" || state.marshalMode || isAdded || checkEdgeRequirements(item);
    const isStrengthOk = (type !== "weapons" && type !== "armor") || state.marshalMode ||
      (type === "weapons" ? checkWeaponStrength(item, hasBugai, hasPolnota) : checkArmorStrength(item, hasBugai, hasPolnota));
    // Брони силы может не хватать — это предупреждение, а не запрет: купить можно,
    // надеть нельзя (проверка при надевании). Оружие же используется по умолчанию,
    // поэтому при нехватке силы оно остаётся заблокированным (см. ниже).
    let strengthWarnEl = null;
    if (!isStrengthOk && type === "armor") {
      strengthWarnEl = document.createElement("div");
      strengthWarnEl.className = "picker-item-strength-warn";
      strengthWarnEl.textContent = "✕ Силы недостаточно";
    }
    const isArcaneItem = type === "edges" && (
      (item.id && window.ARCANE_GIFT_IDS?.has(item.id)) || item.name.startsWith("Мистический дар (")
    );
    const arcaneAlreadyTaken = isArcaneItem && !isAdded && !state.marshalMode &&
      (state.selectedEdges || []).some(e =>
        e.id ? window.ARCANE_GIFT_IDS?.has(e.id) : e.name.startsWith("Мистический дар (")
      );
    const hasArcaneSelected = (state.selectedEdges || []).some(e =>
      e.id ? window.ARCANE_GIFT_IDS?.has(e.id) : e.name.startsWith("Мистический дар (")
    );
    const noArcaneLocked = type === "edges" && !state.marshalMode && !isAdded &&
      item.requirements && item.requirements.includes("Мистический дар (любой)") && !hasArcaneSelected;
    const blockingHindrance = type === "edges" && !isAdded && !state.marshalMode
      ? getBlockingHindrance(item.id, item.name) : null;

    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "picker-item-add";

    const multiPickCount = isMultiPickEdge
      ? ((state.selectedEdges || []).find(e => item.id ? e.id === item.id : e.name === item.name)?.count || (isSelected ? 1 : 0))
      : 0;
    const rankLimitReached = isMultiPickEdge && item.multiPick === "ranked"
      && multiPickCount >= state.rank;

    if (rankLimitReached) {
      addBtn.textContent = "✕  ЛИМИТ РАНГА";
      addBtn.classList.add("picker-item-add--locked");
      row.classList.add("picker-item--req-locked");
    } else if (isMultiPickEdge && multiPickCount > 0) {
      addBtn.textContent = `+ ×${multiPickCount}`;
    } else if (isAdded) {
      addBtn.textContent = "✓";
    } else if (blockingHindrance) {
      addBtn.textContent = "✕  ЗАБЛОКИРОВАНО ИЗЪЯНОМ";
      addBtn.classList.add("picker-item-add--locked");
      row.classList.add("picker-item--req-locked");
    } else if (arcaneAlreadyTaken) {
      addBtn.textContent = "✕  МИСТИЧЕСКАЯ СИЛА УЖЕ ВЫБРАНА";
      addBtn.classList.add("picker-item-add--locked");
      row.classList.add("picker-item--req-locked");
    } else if (noArcaneLocked) {
      addBtn.textContent = "✕  НЕ ВЫБРАН МИСТИЧЕСКИЙ ДАР";
      addBtn.classList.add("picker-item-add--locked");
      row.classList.add("picker-item--req-locked");
    } else if (!isReqMet) {
      addBtn.textContent = "✕  ТРЕБОВАНИЯ НЕ ВЫПОЛНЕНЫ";
      addBtn.classList.add("picker-item-add--locked");
      row.classList.add("picker-item--req-locked");
    } else if (!isStrengthOk && type === "weapons") {
      addBtn.textContent = "✕  СИЛЫ НЕДОСТАТОЧНО";
      addBtn.classList.add("picker-item-add--locked");
      row.classList.add("picker-item--req-locked");
    } else if (isKungfuSub) {
      const avail = availableKungfuSubStyles(item.name);
      if (avail.length === 0) {
        addBtn.textContent = "✕  ВСЕ СТИЛИ";
        addBtn.classList.add("picker-item-add--locked");
        row.classList.add("picker-item--req-locked");
      } else if (kungfuSubCount > 0) {
        addBtn.textContent = `+ ×${kungfuSubCount}`;
      } else {
        addBtn.textContent = "+";
      }
    } else {
      addBtn.textContent = "+";
    }

    addBtn.addEventListener("click", () => {
      if (addBtn.classList.contains("picker-item-add--locked")) return;
      const key = catalogKey(item, type);

      // Kung-fu sub-parent — sub-style chosen via separate modal
      if (type === "edges" && isKungfuSub) {
        const avail = availableKungfuSubStyles(item.name);
        if (avail.length === 0) { showToast("Все стили уже выбраны"); return; }
        if (item.name === HEAVENLY_KUNGFU && kungfuSubCount === 0) {
          const doFirstHeavenly = () => {
            upgradeKungfuToHeavenly();
            renderChoiceList("edges");
            recalculate();
            scheduleSave();
            updateEdgeCostBadge();
            openKungfuSubPicker(HEAVENLY_KUNGFU);
            const searchEl = document.querySelector("#picker-modal .picker-search");
            if (searchEl && !document.getElementById("picker-modal").hidden) {
              renderPickerList("edges", searchEl.value);
            }
          };
          const totalEdgeCount = (state.selectedEdges || []).reduce((s, e) => s + (e.count || 1), 0);
          if (totalEdgeCount >= 1) {
            if ((state.extraPoints || 0) < 2) { showToast("Недостаточно доп. очков (нужно 2)"); return; }
            showConfirm(`Взять «Небесное кунг-фу»? Все стили «Совершенного кунг-фу» будут улучшены. Стоимость: 2 доп. очка.`, () => {
              state.extraPoints -= 2;
              setOutput("extraPoints", state.extraPoints);
              doFirstHeavenly();
            });
          } else {
            doFirstHeavenly();
          }
        } else {
          openKungfuSubPicker(item.name);
        }
        return;
      }

      // "Примета" main edge — sub-edge chosen via separate modal
      if (type === "edges" && isPrimataMainEdge) {
        if (selectedPrimataSubEdge()) {
          const subIdx = state[targetKey].findIndex(e => e.requirements === PRIMETA_NAME);
          if (subIdx !== -1) {
            state[targetKey].splice(subIdx, 1);
            if ((state[targetKey] || []).length >= 1) {
              state.extraPoints = (state.extraPoints || 0) + 2;
              setOutput("extraPoints", state.extraPoints);
            }
          }
          renderChoiceList("edges");
          recalculate();
          scheduleSave();
          updateEdgeCostBadge();
          row.classList.remove("added");
          addBtn.textContent = "+";
        } else {
          openPrimetaSubPicker();
        }
        return;
      }

      // Multi-pick edge: always add (increment count) within rank limit
      if (type === "edges" && isMultiPickEdge) {
        const rankLimit = item.multiPick === "ranked" ? state.rank : Infinity;
        const existingEdge = (state.selectedEdges || []).find(e => item.id ? e.id === item.id : e.name === item.name);
        const currentCount = existingEdge ? (existingEdge.count || 1) : 0;
        if (currentCount >= rankLimit) { showToast("Достигнут лимит для текущего ранга"); return; }

        const totalEdgeCount = (state.selectedEdges || []).reduce((s, e) => s + (e.count || 1), 0);

        const doMultiPickAdd = () => {
          if (existingEdge) {
            existingEdge.count = (existingEdge.count || 1) + 1;
          } else {
            state[targetKey].push({ ...item, count: 1 });
            pruneInvalidEdges();
            syncArcaneFreePoers();
            renderChoiceList("powers");
          }
          renderChoiceList("edges");
          recalculate();
          scheduleSave();
          updateEdgeCostBadge();
          rerenderPickerIfOpen("edges");
        };

        if (state.advancePending?.type === "edge" && !existingEdge) {
          state.advancePending = null;
          scheduleSave();
          updateEdgeCostBadge();
          doMultiPickAdd();
          return;
        }
        if (totalEdgeCount >= 1) {
          if ((state.extraPoints || 0) < 2) { showToast("Недостаточно доп. очков (нужно 2)"); return; }
          showConfirm(`Добавление черты «${item.name}» потратит 2 доп. очка. Подтвердить?`, () => {
            state.extraPoints -= 2;
            setOutput("extraPoints", state.extraPoints);
            doMultiPickAdd();
          });
          return;
        }
        doMultiPickAdd();
        return;
      }

      if (type !== "weapons" && selectedKeys.has(key)) {
        const idx = state[targetKey].findIndex((s) => catalogKey(s, type) === key);
        if (idx !== -1) state[targetKey].splice(idx, 1);
        if (type === "powers" && SUB_POWER_PARENTS.includes(item.name)) {
          const prefix = item.name + ": ";
          state[targetKey] = (state[targetKey] || []).filter(p => !p.name.startsWith(prefix));
        }
        const remainingCount = (state[targetKey] || []).length;
        if (type === "edges" && remainingCount >= 1) {
          state.extraPoints = (state.extraPoints || 0) + 2;
          setOutput("extraPoints", state.extraPoints);
        }
        selectedKeys.delete(key);
        row.classList.remove("added");
        addBtn.textContent = "+";
        if (type === "edges") { syncArcaneFreePoers(); renderChoiceList("powers"); }
        renderChoiceList(type);
        recalculate();
        scheduleSave();
        if (type === "edges") { updateEdgeCostBadge(); rerenderPickerIfOpen("edges"); }
        return;
      }
      if (type === "edges" && !state.marshalMode && item.name.startsWith("Мистический дар (") &&
          (state.selectedEdges || []).some(e => e.name.startsWith("Мистический дар ("))) {
        showToast("Мистическая сила уже выбрана");
        return;
      }
      if (type === "edges" && !state.marshalMode &&
          item.requirements && item.requirements.includes("Мистический дар (любой)") &&
          !(state.selectedEdges || []).some(e => e.name.startsWith("Мистический дар ("))) {
        showToast("Сначала выберите Мистический дар");
        return;
      }
      if (type === "edges" && !state.marshalMode && !checkEdgeRequirements(item)) {
        showToast("Требования не выполнены");
        return;
      }
      if (type === "edges" && !state.marshalMode && getBlockingHindrance(item.id, item.name)) {
        showToast("Заблокировано изъяном");
        return;
      }
      if (type === "hindrances") {
        const cost = item.degree === "Крупный" ? 2 : 1;
        if (getHindrancePoints() + cost > 4) {
          showToast("Изъяны максимальны");
          return;
        }
      }
      if (type === "powers" && !state.marshalMode) {
        let silyMax = 0;
        (state.selectedEdges || []).forEach(e => {
          const stats = (e.id && window.ARCANE_GIFT_STATS_BY_ID?.[e.id]) ?? ARCANE_GIFT_STATS?.[e.name];
          if (stats) silyMax += stats.sily;
          if (e.id === window.WK_EDGES?.SILY || e.name === "Новые силы") silyMax += 2 * (e.count || 1);
        });
        const nonSubCount = (state.selectedPowers || []).filter(p => !isSubPower(p) && !p._arcaneGift).length;
        if (nonSubCount >= silyMax) {
          showToast("Достигнут максимум сил");
          return;
        }
      }
      if (type === "edges" && !state.marshalMode && state.advancePending?.type === "edge") {
        state.advancePending = null;
        if ((state[targetKey] || []).length >= 1) {
          state[targetKey].push(item);
          pruneInvalidEdges();
          syncArcaneFreePoers();
          renderChoiceList("powers");
          renderChoiceList(type);
          recalculate();
          scheduleSave();
          updateEdgeCostBadge();
          rerenderPickerIfOpen("edges");
          return;
        }
        scheduleSave();
        updateEdgeCostBadge();
      }
      if (type === "edges" && (state[targetKey] || []).length >= 1) {
        if ((state.extraPoints || 0) < 2) {
          showToast("Недостаточно доп. очков (нужно 2)");
          return;
        }
        showConfirm(
          `Добавление черты «${item.name}» потратит 2 доп. очка. Подтвердить?`,
          () => {
            state.extraPoints -= 2;
            setOutput("extraPoints", state.extraPoints);
            state[targetKey].push(item);
            pruneInvalidEdges();
            syncArcaneFreePoers();
            renderChoiceList("powers");
            renderChoiceList(type);
            recalculate();
            scheduleSave();
            updateEdgeCostBadge();
            rerenderPickerIfOpen("edges");
          }
        );
        return;
      }
      if (type === "weapons") {
        openWeaponAcquisitionModal(item, (weaponToAdd) => {
          state[targetKey].push(weaponToAdd);
          renderChoiceList("weapons");
          recalculate();
          scheduleSave();
        });
        return;
      }
      if (type === "armor") {
        openArmorAcquisitionModal(item, (armorToAdd) => {
          state[targetKey].push(armorToAdd);
          renderChoiceList("armor");
          recalculate();
          scheduleSave();
        });
        return;
      }
      state[targetKey].push(item);
      if (type === "edges") { pruneInvalidEdges(); syncArcaneFreePoers(); renderChoiceList("powers"); }
      if (type === "powers") { pruneInvalidPowers(); syncSubPowers(); }
      renderChoiceList(type);
      recalculate();
      scheduleSave();
      if (type === "edges") {
        rerenderPickerIfOpen("edges");
      } else if (type !== "weapons" && type !== "armor") {
        selectedKeys.add(key);
        row.classList.add("added");
        addBtn.textContent = "✓";
      }
    });

    if (strengthWarnEl) {
      row.classList.add("picker-item--has-strength-warn");
      row.append(info, strengthWarnEl, addBtn);
    } else {
      row.append(info, addBtn);
    }

    if (weaponGroupRows !== null) {
      const g = item.group ?? item.category ?? "Прочее";
      if (!weaponGroupRows.has(g)) { weaponGroupRows.set(g, []); weaponGroupOrder.push(g); }
      weaponGroupRows.get(g).push(row);
    } else {
      list.append(row);
    }
  });

  if (weaponGroupRows) {
    _sortWeaponGroups(weaponGroupOrder);
    for (const g of weaponGroupOrder) {
      const hdr = document.createElement("div");
      hdr.className = "picker-group-header";
      hdr.textContent = g;
      list.append(hdr);
      for (const r of weaponGroupRows.get(g)) list.append(r);
    }
  }
}
