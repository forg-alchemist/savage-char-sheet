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

  (state[targetKey] || []).forEach((item, index) => {
    if (item._auto) return;
    const card = document.createElement("article");
    card.className = "choice-card";

    if (type === "edges" && item.archetype && ARCHETYPE_COLORS[item.archetype]) {
      const c = ARCHETYPE_COLORS[item.archetype];
      card.style.background = c.tint;
      card.style.border = `2px solid ${c.border}`;
    }

    const title = document.createElement("strong");
    title.textContent = item.name;
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
    if (type === "powers" && state.powersDone && !state.marshalMode) remove.hidden = true;
    if (type === "powers" && item._arcaneGift) remove.hidden = true;
    remove.addEventListener("click", () => {
      const removedItem = state[targetKey][index];

      if (type === "edges" && (removedItem.count || 1) > 1) {
        const totalBefore = (state[targetKey] || []).reduce((s, e) => s + (e.count || 1), 0);
        if (totalBefore > 1) {
          state.extraPoints = (state.extraPoints || 0) + 2;
          setOutput("extraPoints", state.extraPoints);
        }
        removedItem.count--;
        renderChoiceList(type);
        recalculate();
        scheduleSave();
        return;
      }

      state[targetKey].splice(index, 1);
      if (type === "edges") {
        const totalAfter = (state[targetKey] || []).reduce((s, e) => s + (e.count || 1), 0);
        if (totalAfter >= 1) {
          state.extraPoints = (state.extraPoints || 0) + 2;
          setOutput("extraPoints", state.extraPoints);
        }
      }
      if (type === "powers" && removedItem) {
        const isParent = (removedItem.id && window.SUB_POWER_PARENT_IDS?.has(removedItem.id))
          || SUB_POWER_PARENTS.includes(removedItem.name);
        if (isParent) {
          const prefix = removedItem.name + ': ';
          state[targetKey] = state[targetKey].filter(p =>
            p.id ? !window.SUB_POWER_IDS?.has(p.id) || !p.name.startsWith(prefix)
                 : !p.name.startsWith(prefix)
          );
        }
      }
      if (type === "edges") {
        syncArcaneFreePoers();
        renderChoiceList("powers");
      }
      renderChoiceList(type);
      recalculate();
      scheduleSave();
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
        progBadge.innerHTML = reduceProgressSvg(item._reduceProgress, 2);
        progBadge.title = `Снижение: ${item._reduceProgress}/2`;
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

      const rangeLine = document.createElement("div");
      rangeLine.className = "picker-item-stat";
      rangeLine.textContent = `Дистанция: ${item.range}`;

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

function renderWeaponList(root, weapons) {
  if (!weapons.length) return;

  const header = document.createElement("div");
  header.className = "weapon-row weapon-row-header";
  ["Название", "Дистанция", "Урон", "ББ", "Обойма", "Режим", "МС", "Цена", "Вес", "Примечания", ""].forEach((label) => {
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

    [item.name, item.range, item.damage, item.ap, item.magazine, item.mode, item.mc, item.price, item.weight, item.notes].forEach((val, i) => {
      const cell = document.createElement("span");
      cell.className = i === 0 ? "weapon-cell-name" : "";
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

    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "×";
    btn.addEventListener("click", () => {
      state.weapons.splice(index, 1);
      renderChoiceList("weapons");
      recalculate();
      scheduleSave();
    });
    row.append(btn);

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
  ["Предмет", "Броня", "Мин. Сила", "Вес, кг", "Цена", "", "", ""].forEach((label) => {
    const cell = document.createElement("span");
    cell.textContent = label;
    header.append(cell);
  });
  root.append(header);

  armor.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "armor-row armor-row-data";
    if (item._equipped) row.classList.add("armor-row-data--worn");

    [item.name, `+${item.bonus}`, item.minStr, item.weight, item.price].forEach((val, i) => {
      const cell = document.createElement("span");
      cell.className = i === 0 ? "armor-cell-name" : "";
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
        renderChoiceList("armor");
        recalculate();
        scheduleSave();
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
        renderChoiceList("armor");
        recalculate();
        scheduleSave();
      });
      row.append(equipBtn);
    }

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "armor-remove-btn";
    btn.textContent = "×";
    btn.addEventListener("click", () => {
      state.selectedArmor.splice(index, 1);
      renderChoiceList("armor");
      recalculate();
      scheduleSave();
    });
    row.append(btn);

    root.append(row);
  });
}
