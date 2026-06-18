// Удаление выбранной черты/изъяна/силы. refund=true возвращает очки за черту
// (переобучение); refund=false снимает без компенсации (регресс по сюжету).
// Возврат очков касается только черт (по 2 очка), на изъяны/силы не влияет.
function removeChoiceItem(type, index, refund = true) {
  const targetKey = getCatalogStateKey(type);
  const removedItem = state[targetKey][index];
  if (!removedItem) return;

  if (type === "edges" && (removedItem.count || 1) > 1) {
    const totalBefore = (state[targetKey] || []).reduce((s, e) => s + (e.count || 1), 0);
    if (refund && totalBefore > 1) {
      state.extraPoints = (state.extraPoints || 0) + 2;
      setOutput("extraPoints", state.extraPoints);
    }
    removedItem.count--;
    commitSheetUpdate({ renderChoices: type });
    return;
  }

  state[targetKey].splice(index, 1);
  if (type === "edges") {
    const totalAfter = (state[targetKey] || []).reduce((s, e) => s + (e.count || 1), 0);
    if (refund && totalAfter >= 1) {
      state.extraPoints = (state.extraPoints || 0) + 2;
      setOutput("extraPoints", state.extraPoints);
    }
  }
  if (type === "powers" && removedItem) {
    const isParent = (removedItem.id && window.SUB_POWER_PARENT_IDS?.has(removedItem.id))
      || SUB_POWER_PARENTS.includes(removedItem.name);
    if (isParent) {
      const prefix = removedItem.name + ': ';
      state[targetKey] = state[targetKey].filter(p => {
        if (!p.name?.startsWith(prefix)) return true;
        if (!p.id) return false;
        if (window.SUB_POWER_IDS?.has(p.id)) return false;
        return !isSpiritSummonChildPower(p);
      });
    }
    if (isMinorSpiritSummonParent(removedItem)) {
      state[targetKey] = state[targetKey].filter(p => !isSpiritSummonChildPower(p));
    }
  }
  if (type === "edges") {
    syncArcaneFreePoers();
    commitSheetUpdate({ renderChoices: ["powers", type] });
  } else {
    commitSheetUpdate({ renderChoices: type });
  }
}

// Модалка «Условия удаления» для Маршала: вернуть очки (переобучение) или снять
// без возврата (регресс — напр. потерял руку → Маршал убирает «Два ствола» и
// даёт «Однорукий», очки при этом не трогаются).
function openEdgeRemovalModal(edgeName, { onRefund, onNoRefund }) {
  buildAcquisitionModal({
    theme: "weapon",
    eyebrow: "Условия удаления",
    title: edgeName,
    options: [
      {
        variants: ["found"], icon: "↩",
        label: "Вернуть очки",
        note: "Очки за черту вернутся — её можно купить заново (переобучение)",
        price: "+ очки",
        onPick: ({ close }) => { close(); onRefund(); },
      },
      {
        variants: ["buy"], icon: "✕",
        label: "Без возврата",
        note: "Черта снимается без компенсации (регресс / потеря по сюжету)",
        price: "0",
        onPick: ({ close }) => { close(); onNoRefund(); },
      },
    ],
  });
}

function getSpiritChoiceTitle(item) {
  if (!isSpiritSummonChildPower(item)) return item.name;
  return "Призыв " + item.name.slice(SPIRIT_SUMMON_CHILD_PREFIX.length);
}

function getPowerChoiceEntries(items) {
  const entries = [];
  const spiritChildren = items
    .map((item, index) => ({ item, index, isSpiritChild: true }))
    .filter(({ item }) => !item._auto && isSpiritSummonChildPower(item))
    .sort((a, b) => getSpiritChoiceTitle(a.item).localeCompare(getSpiritChoiceTitle(b.item), "ru"));

  let hasMinorParent = false;
  items.forEach((item, index) => {
    if (item._auto || isSpiritSummonChildPower(item)) return;
    entries.push({ item, index, isSpiritChild: false });
    if (isMinorSpiritSummonParent(item)) {
      hasMinorParent = true;
      entries.push(...spiritChildren);
    }
  });

  if (!hasMinorParent) entries.push(...spiritChildren);
  return entries;
}

function renderChoiceList(type) {
  const root = document.querySelector(`[data-choice-list="${type}"]`);
  const targetKey = getCatalogStateKey(type);
  if (!root) return;

  root.replaceChildren();
  if (type === "hindrances") updateHindranceCounter();

  if (type === "weapons") {
    renderWeaponList(root, state.weapons);
    return;
  }

  if (type === "armor") {
    renderArmorList(root, state.selectedArmor);
    return;
  }

  const items = state[targetKey] || [];
  const choiceEntries = type === "powers"
    ? getPowerChoiceEntries(items)
    : items.map((item, index) => ({ item, index, isSpiritChild: false }));

  choiceEntries.forEach(({ item, index, isSpiritChild }) => {
    if (item._auto) return;
    const card = document.createElement("article");
    card.className = "choice-card";
    if (isSpiritChild) card.classList.add("choice-card--spirit-child");

    if (type === "edges" && item.archetype && ARCHETYPE_COLORS[item.archetype]) {
      const c = ARCHETYPE_COLORS[item.archetype];
      card.style.background = c.tint;
      card.style.border = `2px solid ${c.border}`;
    }

    const title = document.createElement("strong");
    title.textContent = isSpiritChild ? getSpiritChoiceTitle(item) : item.name;
    if (type === "edges" && item.archetype && ARCHETYPE_COLORS[item.archetype]) {
      title.style.color = ARCHETYPE_COLORS[item.archetype].accent;
    }

    const meta = document.createElement("span");
    meta.textContent = getCatalogMeta(item, type);

    const description = document.createElement("p");
    description.innerHTML = getCatalogDescription(item, type);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "×";
    if (type === "hindrances" && state.hindrancesDone && !state.marshalMode) remove.hidden = true;
    if (type === "edges" && state.edgesDone && !state.marshalMode) remove.hidden = true;
    if (type === "powers" && arePowersLocked() && !isPowerLimitFree(item)) remove.hidden = true;
    if (type === "powers" && isSubPower(item)) remove.hidden = true;
    if (type === "powers" && !state.marshalMode && isSpiritSummonChildPower(item)) remove.hidden = true;
    if (type === "powers" && item._arcaneGift) remove.hidden = true;
    remove.addEventListener("click", () => {
      // Маршал удаляет черту → спросить условия (вернуть очки vs регресс).
      // Игрок (во время создания) удаляет как раньше — с возвратом очков.
      if (type === "edges" && state.marshalMode) {
        openEdgeRemovalModal(item.name, {
          onRefund:   () => removeChoiceItem(type, index, true),
          onNoRefund: () => removeChoiceItem(type, index, false),
        });
        return;
      }
      removeChoiceItem(type, index, true);
    });

    if (type === "hindrances") {
      const _harrowedHind = !!item.harrowedOnly;
      if (_harrowedHind) card.classList.add(item.degree === "Крупный" ? "choice-card--harrowed-major" : "choice-card--harrowed-minor");
      const degreeBadge = document.createElement("span");
      degreeBadge.className = "degree-badge " + (item.degree === "Крупный" ? "major" : "minor") + (_harrowedHind ? " harrowed" : "");
      degreeBadge.textContent = item.degree;
      card.append(title, degreeBadge);
      if (item._reduceProgress) {
        const progBadge = document.createElement("span");
        progBadge.className = "hindrance-progress-badge";
        const progRing = document.createElement("span");
        progRing.className = "hindrance-progress-ring";
        progRing.innerHTML = reduceProgressSvg(item._reduceProgress, 2);
        const progText = document.createElement("span");
        progText.className = "hindrance-progress-text";
        progText.textContent = `${item._reduceProgress}/2`;
        progBadge.title = `Снижение: ${item._reduceProgress}/2`;
        progRing.append(progText);
        progBadge.append(progRing);
        card.append(progBadge);
      }
      if (item.penalty && item.penalty !== "-") {
        const penaltyEl = document.createElement("div");
        penaltyEl.className = "picker-item-penalty";
        penaltyEl.textContent = `Штраф: ${item.penalty}`;
        card.append(penaltyEl);
      }
      if (item.bonus && item.bonus !== "-") {
        const bonusEl = document.createElement("div");
        bonusEl.className = "picker-item-bonus";
        bonusEl.textContent = `Бонус: ${item.bonus}`;
        card.append(bonusEl);
      }
      card.append(description, remove);
    } else if (type === "edges") {
      const rankBadge = document.createElement("span");
      rankBadge.className = `edge-rank-badge ${rankBadgeClass(item.rank)}`;
      rankBadge.textContent = item.rank;
      card.append(title, rankBadge);
      if ((item.count || 1) > 1) {
        const countBadge = document.createElement("span");
        countBadge.className = "edge-count-badge";
        countBadge.textContent = `×${item.count}`;
        card.append(countBadge);
      }
      card.append(meta, description, remove);
    } else if (type === "powers") {
      const titleRow = document.createElement("div");
      titleRow.className = "hindrance-name-row";
      const rankBadge = document.createElement("span");
      rankBadge.className = `edge-rank-badge ${rankBadgeClass(item.rank)}`;
      rankBadge.textContent = item.rank;
      titleRow.append(title, rankBadge);

      const psBadge = document.createElement("span");
      psBadge.className = "power-ps-badge";
      psBadge.textContent = `${getPowerPoints(item)} ПС`;

      const powerParts = getPowerDisplayParts(item);
      const rangeLine = document.createElement("div");
      rangeLine.className = "picker-item-stat";
      rangeLine.textContent = `Дистанция: ${powerParts.range}`;

      const durationLine = document.createElement("div");
      durationLine.className = "picker-item-stat";
      durationLine.textContent = `Длительность: ${item.duration}`;

      const extraHtml = POWER_EXTRA_HTML[item.name];
      if (extraHtml) {
        const extra = document.createElement("div");
        extra.className = "power-ext";
        extra.innerHTML = extraHtml;
        const curRankName = rankName(state.rank);
        extra.querySelectorAll("table.pdet-table tr").forEach(tr => {
          const tds = tr.querySelectorAll("td");
          if ([...tds].some(td => td.textContent.trim() === curRankName)) {
            tr.classList.add("pdet-current");
          }
        });
        const isPrivyzSoyuznika = item.id
          ? item.id === window.WK_POWERS?.PRIZYV
          : item.name === "Призыв союзника";
        if (isPrivyzSoyuznika) {
          const rankIdx = Math.min(state.rank - 1, 3);
          extra.querySelectorAll(".pdet-card").forEach((c, i) => {
            c.classList.toggle("pdet-card--current", i === rankIdx);
          });
        }
        card.append(titleRow, psBadge, rangeLine, durationLine, description, extra, remove);
      } else {
        card.append(titleRow, psBadge, rangeLine, durationLine, description, remove);
      }
      const isSvyazMladshy = item.id
        ? item.id === window.WK_POWERS?.SVYAZ_ML
        : item.name === "Связь с миром духов: Призвать младшего духа";
      if (isSvyazMladshy && !allSpiritsTaken()) {
        const summonBtn = document.createElement("button");
        summonBtn.type = "button";
        summonBtn.className = "spirit-summon-btn";
        summonBtn.textContent = "ПРИЗВАТЬ ДУХА";
        const psCost = parseInt(getPowerPoints(item)) || 3;
        summonBtn.addEventListener("click", () => openSpiritSummonerModal(psCost));
        card.append(summonBtn);
      }
    } else {
      card.append(title, meta, description, remove);
    }
    root.append(card);
  });
}

function getWeaponAmmoCapacity(item) {
  const def = resolveCatalogItem("weapons", item, {});
  const raw = item.ammoCapacity ?? def.ammoCapacity;
  const cap = Number(raw);
  return Number.isFinite(cap) && cap > 0 ? Math.floor(cap) : 0;
}

function getWeaponAmmoState(item) {
  const cap = getWeaponAmmoCapacity(item);
  if (!cap) return [];

  const prev = Array.isArray(item._ammo) ? item._ammo : [];
  if (!Array.isArray(item._ammo) || item._ammo.length !== cap) {
    item._ammo = Array.from({ length: cap }, (_, i) => prev[i] !== false && prev[i] !== 0);
  }
  return item._ammo;
}

function toggleWeaponAmmo(item, ammoIndex) {
  const ammo = getWeaponAmmoState(item);
  if (!ammo[ammoIndex] && ammo[ammoIndex] !== false) return;
  ammo[ammoIndex] = !ammo[ammoIndex];
  commitSheetUpdate({ recalc: false, renderChoices: "weapons" });
}

function createWeaponAmmoCell(item) {
  const cell = document.createElement("span");
  cell.className = "weapon-ammo-cell";

  const cap = getWeaponAmmoCapacity(item);
  if (!cap) {
    cell.classList.add("weapon-ammo-cell--empty");
    cell.textContent = "—";
    return cell;
  }

  const ammo = getWeaponAmmoState(item);
  const activeCount = ammo.filter(Boolean).length;

  const count = document.createElement("span");
  count.className = "weapon-ammo-count";
  count.textContent = `${activeCount}/${cap}`;
  cell.append(count);

  const grid = document.createElement("span");
  grid.className = "weapon-ammo-grid";
  if (cap > 20) grid.classList.add("weapon-ammo-grid--dense");
  if (cap > 50) grid.classList.add("weapon-ammo-grid--micro");

  ammo.forEach((active, ammoIndex) => {
    const bullet = document.createElement("button");
    bullet.type = "button";
    bullet.className = "weapon-ammo-bullet";
    bullet.classList.toggle("weapon-ammo-bullet--empty", !active);
    bullet.title = active ? "Патрон заряжен" : "Патрон потрачен";
    bullet.setAttribute("aria-label", `${item.name}: патрон ${ammoIndex + 1} из ${cap}`);
    bullet.addEventListener("click", () => toggleWeaponAmmo(item, ammoIndex));
    grid.append(bullet);
  });

  cell.append(grid);
  return cell;
}

function isBundledWeapon(item) {
  return !!item?.bundledParentId;
}

function createWeaponBundleKey(parent) {
  const id = parent?.id || "weapon";
  return `${id}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
}

function getBundledWeaponDefinitions(parent) {
  const ids = Array.isArray(parent?.bundleWith) ? parent.bundleWith : [];
  return ids
    .map(id => window.CATALOG_BY_ID?.weapons?.[id])
    .filter(Boolean);
}

function addWeaponWithBundle(weaponToAdd) {
  const parent = { ...weaponToAdd };
  const children = getBundledWeaponDefinitions(parent);

  if (!children.length) {
    state.weapons.push(parent);
    return;
  }

  const bundleKey = createWeaponBundleKey(parent);
  parent._bundleKey = bundleKey;
  state.weapons.push(parent);

  children.forEach(def => {
    const child = { ...def, _bundleKey: bundleKey };
    if (parent._worn) child._worn = true;
    state.weapons.push(child);
  });
}

function removeWeaponAt(index) {
  const item = state.weapons[index];
  if (!item || isBundledWeapon(item)) return;

  const bundleKey = item._bundleKey;
  const bundledIds = new Set(Array.isArray(item.bundleWith) ? item.bundleWith : []);

  state.weapons = state.weapons.filter((weapon, weaponIndex) => {
    if (weaponIndex === index) return false;
    if (bundleKey && weapon._bundleKey === bundleKey && weapon.bundledParentId === item.id) return false;
    if (!bundleKey && weapon.bundledParentId === item.id && bundledIds.has(weapon.id)) return false;
    return true;
  });
}

function renderWeaponList(root, weapons) {
  if (!weapons.length) return;

  const header = document.createElement("div");
  header.className = "weapon-row weapon-row-header";
  ["Название", "Дистанция", "Урон", "ББ", "Обойма", "Режим", "МС", "Цена", "Вес", "Примечания", "Патроны", "", ""].forEach((label) => {
    const cell = document.createElement("span");
    cell.textContent = label;
    header.append(cell);
  });
  root.append(header);

  const WKE = window.WK_EDGES || {};
  const WKH = window.WK_HINDRANCES || {};
  const hasBugai   = (state.selectedEdges || []).some(e => WKE.BUGAI ? e.id === WKE.BUGAI : e.name === "Бугай");
  const hasPolnota = (state.selectedHindrances || []).some(h => WKH.POLNOTA?.size ? WKH.POLNOTA.has(h.id) : h.name === "Полнота");

  weapons.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "weapon-row weapon-row-data";
    if (item._stashed) row.classList.add("weapon-row-data--stashed");

    [item.name, item.range, item.damage, item.ap, item.magazine, item.mode, item.mc, item.price, item.weight, item.notes].forEach((val, i) => {
      const cell = document.createElement("span");
      cell.className = [
        i === 0 ? "weapon-cell-name" : "",
        i === 9 ? "weapon-cell-notes" : "",
      ].filter(Boolean).join(" ");
      cell.textContent = val ?? "—";
      if (i === 0 && item._worn) {
        const wornImg = document.createElement("img");
        wornImg.src = "assets/Weapon/Broken.png";
        wornImg.className = "weapon-worn-icon";
        wornImg.alt = "Ветхое";
        wornImg.title = "Ветхое оружие";
        cell.append(wornImg);
      }
      row.append(cell);
    });

    row.append(createWeaponAmmoCell(item));

    // Чехол для винтовки: убрать/вытащить (только для винтовок при наличии чехла);
    // иначе — пустая ячейка для выравнивания грида
    const rifleSlots = getRifleSlotCount();
    const canScabbard = !isBundledWeapon(item) && isRifleWeapon(item) && rifleSlots > 0;
    if (canScabbard && item._stashed) {
      const stashBtn = document.createElement("button");
      stashBtn.type = "button";
      stashBtn.className = "weapon-stash-btn weapon-stash-btn--on";
      stashBtn.textContent = "Вытащить";
      stashBtn.title = "Вытащить винтовку из чехла";
      stashBtn.addEventListener("click", () => unstashRifle(item));
      row.append(stashBtn);
    } else if (canScabbard && canStashRifle()) {
      const stashBtn = document.createElement("button");
      stashBtn.type = "button";
      stashBtn.className = "weapon-stash-btn";
      stashBtn.textContent = "В чехол";
      stashBtn.title = "Убрать винтовку в чехол на лошади";
      stashBtn.addEventListener("click", () => stashRifle(item));
      row.append(stashBtn);
    } else {
      row.append(document.createElement("span"));
    }

    if (isBundledWeapon(item)) {
      row.append(document.createElement("span"));
    } else {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "weapon-remove-btn";
      btn.textContent = "×";
      btn.addEventListener("click", () => {
        removeWeaponAt(index);
        commitSheetUpdate();
      });
      row.append(btn);
    }

    if (!checkWeaponStrength(item, hasBugai, hasPolnota)) {
      const warning = document.createElement("div");
      warning.className = "weapon-mc-warning";
      warning.textContent = "× СИЛЫ НЕДОСТАТОЧНО ДЛЯ ИСПОЛЬЗОВАНИЯ";
      row.append(warning);
    }

    root.append(row);
  });
}

function renderArmorList(root, armor) {
  if (!armor.length) return;

  const header = document.createElement("div");
  header.className = "armor-row armor-row-header";
  ["Предмет", "Секторы", "Броня", "МС", "Вес, кг", "Цена", "", "", ""].forEach((label) => {
    const cell = document.createElement("span");
    cell.textContent = label;
    header.append(cell);
  });
  root.append(header);

  armor.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "armor-row armor-row-data";
    if (item._equipped) row.classList.add("armor-row-data--worn");

    [item.name, formatArmorSectors(item), `+${item.bonus}`, item.minStr, item.weight, item.price].forEach((val, i) => {
      const cell = document.createElement("span");
      cell.className = [
        i === 0 ? "armor-cell-name" : "",
        i === 1 ? "armor-cell-sectors" : "",
        i === 2 ? "armor-cell-bonus" : "",
        i === 3 ? "armor-cell-strength" : "",
      ].filter(Boolean).join(" ");
      cell.textContent = val ?? "—";
      row.append(cell);
    });

    // Распорка — толкает кнопки вправо, значения остаются у названия
    row.append(document.createElement("span"));

    // Управляющий элемент: Снять (если надето) / Надеть / неактивная плашка
    // «Силы недостаточно» (если не хватает силы надеть, с учётом слоёв и Бугай/Полнота)
    if (item._equipped) {
      const equipBtn = document.createElement("button");
      equipBtn.type = "button";
      equipBtn.className = "armor-equip-btn armor-equip-btn--on";
      equipBtn.textContent = "Снять";
      equipBtn.addEventListener("click", () => {
        item._equipped = false;
        commitSheetUpdate();
      });
      row.append(equipBtn);
    } else if (!armorEquipStrengthOk(item, index)) {
      const locked = document.createElement("span");
      locked.className = "armor-equip-locked";
      locked.textContent = "✕ Силы недостаточно";
      row.append(locked);
    } else {
      const equipBtn = document.createElement("button");
      equipBtn.type = "button";
      equipBtn.className = "armor-equip-btn";
      equipBtn.textContent = "Надеть";
      equipBtn.addEventListener("click", () => {
        const err = equipArmor(index);
        if (err) { showToast(err, { html: true }); return; }
        commitSheetUpdate();
      });
      row.append(equipBtn);
    }

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "armor-remove-btn";
    btn.textContent = "×";
    btn.addEventListener("click", () => {
      state.selectedArmor.splice(index, 1);
      commitSheetUpdate();
    });
    row.append(btn);

    root.append(row);
  });
}
