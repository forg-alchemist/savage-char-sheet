function buildDeck() {
  const deck = [];
  for (const suit of DECK_SUITS) {
    for (const rank of DECK_RANKS) {
      deck.push({ rank, suit: suit.key, sym: suit.sym, joker: false });
    }
  }
  deck.push({ rank: "JOKER", suit: "joker-black", sym: "✦", joker: true });
  deck.push({ rank: "JOKER", suit: "joker-red",   sym: "✦", joker: true });
  return deck;
}

function shuffleDeck(deck) {
  const arr = [...deck];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getCardDieValue(card) {
  if (card.joker) return "d12";
  if (["2", "3"].includes(card.rank)) return "d4";
  if (["4", "5", "6", "7", "8", "9"].includes(card.rank)) return "d6";
  if (["10", "J", "Q"].includes(card.rank)) return "d8";
  return "d10";
}

function getCardSkillPoints(card) {
  if (card.joker) return 20;
  if (["2", "3"].includes(card.rank)) return 13;
  if (["4", "5", "6", "7", "8", "9"].includes(card.rank)) return 15;
  if (["10", "J", "Q"].includes(card.rank)) return 16;
  return 18;
}

function updateDealButton() {
  const btn = document.querySelector('[data-action="dealCards"]');
  if (!btn) return;
  btn.disabled = !!state.dealDone;
  btn.textContent = state.dealDone ? "Расклад выполнен" : "Сделать расклад";
  btn.classList.toggle("deal-button--done", !!state.dealDone);
}

function updateJokerStatus() {
  const el = document.querySelector('[data-output="jokerStatus"]');
  if (!el) return;
  if (!state.dealDone) { el.textContent = ""; el.className = "jr-status"; return; }
  const jr = state.dealJoker;
  if (jr === "both") {
    el.innerHTML = "2×Jr";
    el.className = "jr-status jr-both";
  } else if (jr === "black") {
    el.innerHTML = "Jr";
    el.className = "jr-status jr-black";
  } else if (jr === "red") {
    el.innerHTML = "Jr";
    el.className = "jr-status jr-red";
  } else {
    el.innerHTML = "<s>No Jr</s>";
    el.className = "jr-status jr-none";
  }
}

function openDistributionPhase(scene, cards) {
  scene.replaceChildren();
  scene.classList.add("dist-phase");

  const assignment = {};
  const slotEls = {};
  let pool;
  let btnConfirm;

  function findCardSlot(card) {
    for (const [k, c] of Object.entries(assignment)) { if (c === card) return k; }
    return null;
  }

  function updateSlotHint(slotKey, card) {
    const hint = slotEls[slotKey].hint;
    if (!card) { hint.textContent = ""; return; }
    hint.textContent = slotKey === "skills"
      ? `${getCardSkillPoints(card)} очков`
      : getCardDieValue(card);
  }

  function updateConfirmBtn() {
    btnConfirm.disabled = Object.keys(assignment).length < DIST_SLOTS.length;
  }

  function dropInSlot(slotKey, card, sourceEl) {
    if (!slotKey) return;

    // Меченому Характер достаётся не ниже d6 — карту на d4 туда класть нельзя
    if (slotKey === "spirit" && state.harrowed && getCardDieValue(card) === "d4") {
      showToast("Слишком маленькая карта!");
      return;
    }

    const sourceSlot = findCardSlot(card);
    if (sourceSlot === slotKey) return;

    if (sourceSlot !== null) {
      delete assignment[sourceSlot];
      const ph = document.createElement("div");
      ph.className = "dist-slot-ph";
      slotEls[sourceSlot].area.replaceChildren(ph);
      updateSlotHint(sourceSlot, null);
    } else {
      sourceEl.remove();
    }

    const displaced = assignment[slotKey];
    if (displaced) pool.append(makeCardEl(displaced));

    assignment[slotKey] = card;
    const newEl = makeCardEl(card);
    newEl.classList.add("snap-in");
    slotEls[slotKey].area.replaceChildren(newEl);
    updateSlotHint(slotKey, card);
    updateConfirmBtn();
  }

  function makeCardEl(card) {
    const el = document.createElement("div");
    el.className = `dist-card suit-${card.suit}`;
    el.innerHTML = `
      <div class="dc-corner dc-tl"><b>${card.rank}</b><span>${card.sym}</span></div>
      <div class="dc-center"><span>${card.sym}</span></div>
      <div class="dc-corner dc-br"><b>${card.rank}</b><span>${card.sym}</span></div>
    `;

    el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const ox = e.clientX - rect.left;
      const oy = e.clientY - rect.top;

      const ringColor = state.harrowed ? "#cfd5dc" : "#d4af37";
      const clone = el.cloneNode(true);
      clone.style.cssText = `position:fixed;width:${rect.width}px;height:${rect.height}px;`
        + `left:${rect.left}px;top:${rect.top}px;pointer-events:none;z-index:800;`
        + `transition:none;transform:scale(1.07) rotate(-2deg);`
        + `box-shadow:0 16px 40px rgba(0,0,0,.8),0 0 0 2px ${ringColor};`;
      document.body.append(clone);
      el.classList.add("drag-ghost");

      let hovered = null;

      function onMove(ev) {
        clone.style.left = (ev.clientX - ox) + "px";
        clone.style.top  = (ev.clientY - oy) + "px";
        const under = document.elementFromPoint(ev.clientX, ev.clientY);
        const slot = under?.closest(".dist-slot[data-slot]");
        if (slot !== hovered) {
          hovered?.classList.remove("drag-over");
          slot?.classList.add("drag-over");
          hovered = slot;
        }
      }

      function onUp(ev) {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        clone.remove();
        el.classList.remove("drag-ghost");
        hovered?.classList.remove("drag-over");
        const under = document.elementFromPoint(ev.clientX, ev.clientY);
        const slot = under?.closest(".dist-slot[data-slot]");
        dropInSlot(slot?.dataset.slot, card, el);
      }

      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
    });

    return el;
  }

  const title = document.createElement("div");
  title.className = "dist-title";
  title.textContent = "Распредели карты";

  const slotsRow = document.createElement("div");
  slotsRow.className = "dist-slots-row";

  DIST_SLOTS.forEach(({ key, label, desc }) => {
    const slot = document.createElement("div");
    slot.className = "dist-slot";
    slot.dataset.slot = key;

    const lbl = document.createElement("div");
    lbl.className = "dist-slot-lbl";
    lbl.textContent = label;

    if (desc) {
      const dsc = document.createElement("div");
      dsc.className = "dist-slot-desc";
      dsc.textContent = desc;
      slot.append(lbl, dsc);
    } else {
      slot.append(lbl);
    }

    const area = document.createElement("div");
    area.className = "dist-slot-area";
    const ph = document.createElement("div");
    ph.className = "dist-slot-ph";
    area.append(ph);

    const hint = document.createElement("div");
    hint.className = "dist-slot-hint";

    slot.append(area, hint);
    slotsRow.append(slot);
    slotEls[key] = { area, hint };
  });

  pool = document.createElement("div");
  pool.className = "dist-pool";
  cards.forEach((card) => pool.append(makeCardEl(card)));

  btnConfirm = document.createElement("button");
  btnConfirm.type = "button";
  btnConfirm.className = "dist-btn-confirm";
  btnConfirm.textContent = "Подтвердить выбор";
  btnConfirm.disabled = true;

  btnConfirm.addEventListener("click", () => {
    const saved = {};
    let jokerCount = 0; let jokerFound = null;
    for (const [key, card] of Object.entries(assignment)) {
      if (card.joker) { jokerCount++; jokerFound = card.suit === "joker-red" ? "red" : "black"; }
      if (key === "skills") {
        state.skillBudgetMax = getCardSkillPoints(card);
        saved.skills = getCardSkillPoints(card);
      } else {
        state.attributes[key] = getCardDieValue(card);
        saved[key] = getCardDieValue(card);
      }
    }
    state.dealAssignment = saved;
    state.dealJoker = jokerCount >= 2 ? "both" : (jokerFound || "none");
    state.dealDone = true;
    state.attrPoolBase = Object.values(state.attributes).reduce((sum, die) => {
      const idx = DICE_VALUES.indexOf(parseTrait(die).die);
      return sum + (idx >= 0 ? idx : 0);
    }, 0);
    commitSheetUpdate({ updateDeal: true, updateJoker: true });
    document.getElementById("deal-modal").remove();
  });

  scene.append(title, slotsRow, pool, btnConfirm);
}

function openDealModal() {
  if (state.dealDone) return;
  document.getElementById("deal-modal")?.remove();

  const hand = shuffleDeck(buildDeck()).slice(0, 7);
  const ROTS = [-12, -8, -4, 0, 4, 8, 12];
  const isProtected = (card) => card.rank === "2" || card.joker;

  const DEAL_STEP = 160;
  const FLIP_STEP = 180;
  const FLIP_DUR  = 550;
  const allFlippedAt = 150 + 7 * DEAL_STEP + 350 + 6 * FLIP_STEP + FLIP_DUR;

  const modal = document.createElement("div");
  modal.id = "deal-modal";
  if (state.harrowed) modal.classList.add("deal-harrowed");

  const backdrop = document.createElement("div");
  backdrop.className = "deal-backdrop";

  const scene = document.createElement("div");
  scene.className = "deal-scene";

  const pile = document.createElement("div");
  pile.className = "deal-pile";
  for (let k = 0; k < 4; k++) {
    const c = document.createElement("div");
    c.className = "deal-pile-card";
    pile.append(c);
  }

  const spread = document.createElement("div");
  spread.className = "deal-spread";

  const cardEls = hand.map((card, i) => {
    const wrap = document.createElement("div");
    wrap.className = "dcw";
    wrap.style.setProperty("--rot", `${ROTS[i]}deg`);

    const inner = document.createElement("div");
    inner.className = "dci";

    const back = document.createElement("div");
    back.className = "dcb";

    const front = document.createElement("div");
    front.className = `dcf suit-${card.suit}`;
    front.innerHTML = `
      <div class="dc-corner dc-tl"><b>${card.rank}</b><span>${card.sym}</span></div>
      <div class="dc-center"><span>${card.sym}</span></div>
      <div class="dc-corner dc-br"><b>${card.rank}</b><span>${card.sym}</span></div>
    `;

    inner.append(back, front);
    wrap.append(inner);
    spread.append(wrap);
    return wrap;
  });

  const instruction = document.createElement("div");
  instruction.className = "deal-instruction";
  instruction.textContent = "Убери ненужную карту";

  const actionRow = document.createElement("div");
  actionRow.className = "deal-action-row";

  const btnConfirm = document.createElement("button");
  btnConfirm.type = "button";
  btnConfirm.className = "deal-btn-confirm";
  btnConfirm.textContent = "Подтвердить выбор";

  const btnReselect = document.createElement("button");
  btnReselect.type = "button";
  btnReselect.className = "deal-btn-reselect";
  btnReselect.textContent = "Выбрать заново";

  actionRow.append(btnConfirm, btnReselect);

  scene.append(pile, spread, instruction, actionRow);
  modal.append(backdrop, scene);
  document.body.append(modal);

  let selectedIndex = null;

  function activateSelection() {
    instruction.classList.add("visible");
    cardEls.forEach((el, i) => {
      if (isProtected(hand[i])) {
        el.classList.add("protected");
        el.addEventListener("click", () => showToast("Запрещена к выбору"));
        return;
      }
      el.classList.add("selectable");
      el.addEventListener("click", () => {
        if (selectedIndex !== null) cardEls[selectedIndex].classList.remove("selected");
        selectedIndex = i;
        el.classList.add("selected");
        actionRow.classList.add("visible");
      });
    });
  }

  btnConfirm.addEventListener("click", () => {
    if (selectedIndex === null) return;
    const el = cardEls[selectedIndex];
    const remainingCards = hand.filter((_, i) => i !== selectedIndex);
    el.classList.add("discarded");
    actionRow.remove();
    instruction.textContent = "";
    setTimeout(() => openDistributionPhase(scene, remainingCards), 500);
  });

  btnReselect.addEventListener("click", () => {
    if (selectedIndex !== null) {
      cardEls[selectedIndex].classList.remove("selected");
      selectedIndex = null;
    }
    actionRow.classList.remove("visible");
  });

  requestAnimationFrame(() => {
    modal.classList.add("deal-open");
    cardEls.forEach((el, i) => {
      setTimeout(() => el.classList.add("dealt"), 150 + i * DEAL_STEP);
    });
    cardEls.forEach((el, i) => {
      setTimeout(() => el.classList.add("flipped"), 150 + 7 * DEAL_STEP + 350 + i * FLIP_STEP);
    });
    setTimeout(activateSelection, allFlippedAt + 150);
  });
}
