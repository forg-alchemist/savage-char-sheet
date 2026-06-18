// ── ПРИЗЫВ ДУХА (Шаман) ───────────────────────────────────────────────────────
// Две силы с собственными таблицами:
//   • «Призвать младшего духа» — один бросок d10 (10 = на выбор Маршала)
//   • «Призвать духа» (средний) — 2d6: первый d6 (1 = Священный народ → под-бросок
//     d6 на подвид, где 6 = на выбор Маршала; 2–6 — конкретные духи)

// ── Младший дух (d10) ──
const SPIRIT_SUMMON_TABLE = {
  1: "Связь с миром духов: Призвать духа предка",
  2: "Связь с миром духов: Призвать духа предка",
  3: "Связь с миром духов: Призвать духа предка",
  4: "Связь с миром духов: Призвать духа природы (волк)",
  5: "Связь с миром духов: Призвать духа природы (малый народец)",
  6: "Связь с миром духов: Призвать духа природы (орёл)",
  7: "Связь с миром духов: Призвать духа природы (медведь)",
  8: "Связь с миром духов: Призвать духа природы (паук)",
  9: "Связь с миром духов: Призвать духа природы (буйвол)",
};

const SPIRIT_SUMMON_ALL = [
  "Связь с миром духов: Призвать духа предка",
  "Связь с миром духов: Призвать духа природы (волк)",
  "Связь с миром духов: Призвать духа природы (малый народец)",
  "Связь с миром духов: Призвать духа природы (орёл)",
  "Связь с миром духов: Призвать духа природы (медведь)",
  "Связь с миром духов: Призвать духа природы (паук)",
  "Связь с миром духов: Призвать духа природы (буйвол)",
];

// ── Средний дух (2d6) ──
// Первый d6 = 1 → Священный народ, далее под-бросок d6 (6 = на выбор Маршала)
const MEDIUM_SACRED_SUBTABLE = {
  1: "Связь с миром духов: Призвать священный народ (народ грома)",
  2: "Связь с миром духов: Призвать священный народ (народ ветра)",
  3: "Связь с миром духов: Призвать священный народ (народ горбатой змеи)",
  4: "Связь с миром духов: Призвать священный народ (бессловесный народ)",
  5: "Связь с миром духов: Призвать священный народ (народ тьмы)",
  // 6 → на выбор Маршала среди подвидов выше
};
const MEDIUM_SACRED_ALL = Object.values(MEDIUM_SACRED_SUBTABLE);

// Первый d6 = 2–6
const MEDIUM_FIRST_TABLE = {
  2: "Связь с миром духов: Призвать духа природы (ган)",
  3: "Связь с миром духов: Призвать духа природы (шивана)",
  4: "Связь с миром духов: Призвать духа природы (уваннами)",
  5: "Связь с миром духов: Призвать духа природы (вакиньян)",
  6: "Связь с миром духов: Призвать громовую птицу",
};

const MEDIUM_SPIRIT_ALL = [...MEDIUM_SACRED_ALL, ...Object.values(MEDIUM_FIRST_TABLE)];

const _SPIRIT_PREFIX = "Связь с миром духов: Призвать ";

// ── Доступность (исключаем уже взятых духов) ──
function _getSpiritAvailable(allList) {
  const idMap  = window.SPIRIT_POWER_ID_BY_NAME || {};
  const takenIds   = new Set((state.selectedPowers || []).map(p => p.id).filter(Boolean));
  const takenNames = new Set((state.selectedPowers || []).map(p => p.name));
  return allList.filter(s => {
    const sid = idMap[s];
    return sid ? !takenIds.has(sid) : !takenNames.has(s);
  });
}

function getSpiritSummonAvailable() { return _getSpiritAvailable(SPIRIT_SUMMON_ALL); }
function allSpiritsTaken()       { return _getSpiritAvailable(SPIRIT_SUMMON_ALL).length === 0; }
function allMediumSpiritsTaken() { return _getSpiritAvailable(MEDIUM_SPIRIT_ALL).length === 0; }

function _spiritDisplayName(fullName) {
  return fullName.startsWith(_SPIRIT_PREFIX) ? fullName.slice(_SPIRIT_PREFIX.length) : fullName;
}

// Форматирует название для показа в модале
function _spiritDisplayHtml(fullName) {
  const short = _spiritDisplayName(fullName).toUpperCase();
  let m;
  if ((m = short.match(/^ДУХА ПРИРОДЫ \((.+)\)$/)))
    return `<span class="spirit-result-type">ДУХ ПРИРОДЫ</span><span class="spirit-result-sep"> — </span><span class="spirit-result-subname">${m[1]}</span>`;
  if ((m = short.match(/^СВЯЩЕННЫЙ НАРОД \((.+)\)$/)))
    return `<span class="spirit-result-type">СВЯЩЕННЫЙ НАРОД</span><span class="spirit-result-sep"> — </span><span class="spirit-result-subname">${m[1]}</span>`;
  if (short === "ГРОМОВУЮ ПТИЦУ")
    return `<span class="spirit-result-type">ГРОМОВАЯ ПТИЦА</span>`;
  // "ДУХА ПРЕДКА" → "ДУХ ПРЕДКА"
  return `<span class="spirit-result-type">${short.replace(/^ДУХА /, "ДУХ ")}</span>`;
}

// ── Броски ──
function _rollSpiritD10(available) {
  for (let i = 0; i < 100; i++) {
    const roll = Math.floor(Math.random() * 10) + 1;
    if (roll === 10) return 10;
    if (available.includes(SPIRIT_SUMMON_TABLE[roll])) return roll;
  }
  return 10;
}

// Первый d6 среднего призыва: возвращает грань с доступным исходом
function _rollMediumFirst(available) {
  const sacredAvail = MEDIUM_SACRED_ALL.some(n => available.includes(n));
  for (let i = 0; i < 100; i++) {
    const f = Math.floor(Math.random() * 6) + 1;
    if (f === 1) { if (sacredAvail) return 1; }
    else if (available.includes(MEDIUM_FIRST_TABLE[f])) return f;
  }
  if (sacredAvail) return 1;
  for (const f of [2, 3, 4, 5, 6]) if (available.includes(MEDIUM_FIRST_TABLE[f])) return f;
  return 1;
}

// Под-бросок d6 (Священный народ): 1–5 — подвид, 6 — на выбор Маршала
function _rollMediumSub(available) {
  for (let i = 0; i < 100; i++) {
    const s = Math.floor(Math.random() * 6) + 1;
    if (s === 6) return 6;
    if (available.includes(MEDIUM_SACRED_SUBTABLE[s])) return s;
  }
  return 6;
}

function _addSpiritPower(spiritName) {
  const spiritId = window.SPIRIT_POWER_ID_BY_NAME?.[spiritName];
  if (spiritId) {
    if ((state.selectedPowers || []).some(p => p.id === spiritId)) return;
  } else {
    if ((state.selectedPowers || []).some(p => p.name === spiritName)) return;
  }
  const cat = spiritId
    ? window.CATALOG_BY_ID?.powers?.[spiritId]
    : (CATALOGS.powers || []).find(p => p.name === spiritName);
  if (!cat) { showToast("Нет карточки этого духа"); return; }
  if (!state.marshalMode && !isPowerLimitFree(cat) && isPowersAtMax()) {
    showToast("ДОСТИГНУТ ЛИМИТ СИЛ");
    return;
  }
  (state.selectedPowers = state.selectedPowers || []).push({ ...cat });
  commitSheetUpdate({ renderChoices: "powers" });
}

// Анимация одного кубика, затем callback
function _animateSpiritDie(diceEl, dieMax, finalFace, onDone) {
  let frame = 0;
  const TOTAL_FRAMES = 20;
  diceEl.classList.add("spirit-dice--rolling");
  const anim = setInterval(() => {
    diceEl.textContent = Math.floor(Math.random() * dieMax) + 1;
    frame++;
    if (frame >= TOTAL_FRAMES) {
      clearInterval(anim);
      diceEl.classList.remove("spirit-dice--rolling");
      diceEl.classList.add("spirit-dice--final");
      diceEl.textContent = finalFace;
      setTimeout(onDone, 400);
    }
  }, 65);
}

// Второй кубик (под-бросок Священного народа)
function _appendSubDie(modal) {
  const diceCol = modal.querySelector(".spirit-dice-col");
  const resultEl = diceCol.querySelector(".spirit-result-name");
  const wrap = document.createElement("div");
  wrap.className = "spirit-dice-wrap spirit-dice-wrap--sub";
  const label = document.createElement("div");
  label.className = "spirit-subroll-label";
  label.textContent = "Подвид";
  const die = document.createElement("div");
  die.className = "spirit-dice";
  die.textContent = "?";
  wrap.append(label, die);
  diceCol.insertBefore(wrap, resultEl);
  return die;
}

// Показывает pdet-карточку слева; переключает модал в split-режим
function _showSpiritCard(modal, spiritName) {
  const existing = modal.querySelector(".spirit-power-card");
  if (existing) existing.remove();
  const extraHtml = POWER_EXTRA_HTML[spiritName];
  if (!extraHtml) return;

  const wrap = document.createElement("div");
  wrap.className = "spirit-power-card";
  wrap.innerHTML = extraHtml;

  let bodyRow = modal.querySelector(".spirit-modal-body");
  if (!bodyRow) {
    bodyRow = document.createElement("div");
    bodyRow.className = "spirit-modal-body";
    const diceCol = modal.querySelector(".spirit-dice-col");
    modal.insertBefore(bodyRow, diceCol);
    bodyRow.append(diceCol);
  }
  bodyRow.insertBefore(wrap, bodyRow.firstChild);
  modal.classList.add("spirit-modal--split");
}

// ── "БЫЛ ПОДЪЁМ?" ──
function _showRaiseDialog(mainOverlay, spiritName, onDecline) {
  const raiseOverlay = document.createElement("div");
  raiseOverlay.className = "spirit-confirm-overlay";

  const box = document.createElement("div");
  box.className = "spirit-confirm-box spirit-raise-box";

  const q = document.createElement("div");
  q.className = "spirit-raise-q";
  q.style.fontSize = "1rem";
  q.textContent = "БЫЛ ПОДЪЁМ?";

  const btns = document.createElement("div");
  btns.className = "spirit-raise-btns";

  const btnYes = document.createElement("button");
  btnYes.type = "button";
  btnYes.className = "spirit-btn spirit-btn--yes";
  btnYes.textContent = "ДА";

  const btnNo = document.createElement("button");
  btnNo.type = "button";
  btnNo.className = "spirit-btn spirit-btn--no";
  btnNo.textContent = "НЕТ";

  btns.append(btnYes, btnNo);
  box.append(q, btns);
  raiseOverlay.append(box);
  document.body.append(raiseOverlay);

  btnYes.addEventListener("click", () => {
    _addSpiritPower(spiritName);
    raiseOverlay.remove();
    mainOverlay.remove();
  });

  btnNo.addEventListener("click", () => {
    raiseOverlay.remove();
    onDecline();
  });
}

// ── Подтверждение закрытия ──
function _showSpiritConfirmClose(onConfirm) {
  const overlay = document.createElement("div");
  overlay.className = "spirit-confirm-overlay";

  const box = document.createElement("div");
  box.className = "spirit-confirm-box";

  const msg = document.createElement("div");
  msg.className = "spirit-confirm-msg";
  msg.textContent = "ВЫ УВЕРЕНЫ? ПРИ ЗАКРЫТИИ СИЛА ПРОПАДЁТ!";

  const btns = document.createElement("div");
  btns.className = "spirit-raise-btns";

  const btnYes = document.createElement("button");
  btnYes.type = "button";
  btnYes.className = "spirit-btn spirit-btn--yes";
  btnYes.textContent = "ДА, УВЕРЕН";

  const btnBack = document.createElement("button");
  btnBack.type = "button";
  btnBack.className = "spirit-btn spirit-btn--no";
  btnBack.textContent = "ВЕРНУТЬСЯ";

  btns.append(btnYes, btnBack);
  box.append(msg, btns);
  overlay.append(box);
  document.body.append(overlay);

  btnYes.addEventListener("click", () => { overlay.remove(); onConfirm(); });
  btnBack.addEventListener("click", () => overlay.remove());
}

// ── Список выбора для Маршала ──
function _showMarshalSpiritList(modal, mainOverlay, options, onDecline) {
  const wrap = document.createElement("div");
  wrap.className = "spirit-marshal-list";

  const label = document.createElement("div");
  label.className = "spirit-marshal-label";
  label.textContent = "Выберите духа:";
  wrap.append(label);

  options.forEach(spiritName => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "spirit-marshal-item";
    btn.textContent = _spiritDisplayName(spiritName);
    btn.addEventListener("click", () => {
      wrap.remove();
      const resultEl = modal.querySelector(".spirit-result-name");
      if (resultEl) resultEl.innerHTML = _spiritDisplayHtml(spiritName);
      _showSpiritCard(modal, spiritName);
      _showRaiseDialog(mainOverlay, spiritName, onDecline);
    });
    wrap.append(btn);
  });

  const diceCol = modal.querySelector(".spirit-dice-col");
  diceCol.append(wrap);
}

// ── Алерт "НЕДОСТАТОЧНО ПС" ──
function _showInsufficientPS(cost) {
  const overlay = document.createElement("div");
  overlay.className = "spirit-confirm-overlay";

  const box = document.createElement("div");
  box.className = "spirit-confirm-box";
  box.style.borderColor = "#3a6fc7";
  box.style.boxShadow = "0 4px 28px rgba(30,80,200,0.45)";

  const msg = document.createElement("div");
  msg.className = "spirit-confirm-msg";
  msg.style.color = "#7eb8ff";
  msg.textContent = `НЕДОСТАТОЧНО ПС (нужно ${cost})`;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "spirit-btn spirit-btn--no";
  btn.style.borderColor = "#3a6fc7";
  btn.style.background = "#0d1f5c";
  btn.style.color = "#7eb8ff";
  btn.textContent = "ПОНЯТНО";
  btn.addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", e => { if (e.target === overlay) overlay.remove(); });

  box.append(msg, btn);
  overlay.append(box);
  document.body.append(overlay);
}

// ── Точка входа ──
// kind: "lesser" (d10) | "medium" (2d6)
function openSpiritSummonerModal(cost = 3, kind = "lesser") {
  const currentPS = state.powerCurrent || 0;
  if (currentPS < cost) {
    _showInsufficientPS(cost);
    return;
  }

  const allList = kind === "medium" ? MEDIUM_SPIRIT_ALL : SPIRIT_SUMMON_ALL;
  const available = _getSpiritAvailable(allList);
  if (!available.length) return;

  // Списываем ПС
  state.powerCurrent = currentPS - cost;
  const psInput = document.querySelector('[data-bind="powerCurrent"]');
  if (psInput) psInput.value = state.powerCurrent;
  commitSheetUpdate();

  const overlay = document.createElement("div");
  overlay.className = "spirit-overlay";

  const modal = document.createElement("div");
  modal.className = "spirit-modal";

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "spirit-modal-close";
  closeBtn.textContent = "×";

  const titleEl = document.createElement("div");
  titleEl.className = "spirit-modal-title";
  titleEl.textContent = "ПРИЗЫВ ДУХА";

  const diceCol = document.createElement("div");
  diceCol.className = "spirit-dice-col";

  const diceWrap = document.createElement("div");
  diceWrap.className = "spirit-dice-wrap";
  const diceEl = document.createElement("div");
  diceEl.className = "spirit-dice";
  diceEl.textContent = "?";
  diceWrap.append(diceEl);

  const resultEl = document.createElement("div");
  resultEl.className = "spirit-result-name";

  diceCol.append(diceWrap, resultEl);
  modal.append(closeBtn, titleEl, diceCol);
  overlay.append(modal);
  document.body.append(overlay);

  let needsConfirm = false; // true только после "НЕТ" на "БЫЛ ПОДЪЁМ?"
  const markConfirm = () => { needsConfirm = true; };

  function tryClose() {
    if (needsConfirm) _showSpiritConfirmClose(() => overlay.remove());
    else overlay.remove();
  }

  closeBtn.addEventListener("click", tryClose);
  overlay.addEventListener("click", e => { if (e.target === overlay) tryClose(); });

  if (kind === "medium") _runMediumRoll(modal, overlay, diceEl, resultEl, available, markConfirm);
  else _runLesserRoll(modal, overlay, diceEl, resultEl, available, markConfirm);
}

function _runLesserRoll(modal, overlay, diceEl, resultEl, available, markConfirm) {
  const roll = _rollSpiritD10(available);
  _animateSpiritDie(diceEl, 10, roll, () => {
    if (roll === 10) {
      resultEl.textContent = "НА ВЫБОР МАРШАЛА";
      _showMarshalSpiritList(modal, overlay, available, markConfirm);
    } else {
      const spirit = SPIRIT_SUMMON_TABLE[roll];
      resultEl.innerHTML = _spiritDisplayHtml(spirit);
      _showSpiritCard(modal, spirit);
      _showRaiseDialog(overlay, spirit, markConfirm);
    }
  });
}

function _runMediumRoll(modal, overlay, diceEl, resultEl, available, markConfirm) {
  const first = _rollMediumFirst(available);
  _animateSpiritDie(diceEl, 6, first, () => {
    if (first !== 1) {
      const spirit = MEDIUM_FIRST_TABLE[first];
      resultEl.innerHTML = _spiritDisplayHtml(spirit);
      _showSpiritCard(modal, spirit);
      _showRaiseDialog(overlay, spirit, markConfirm);
      return;
    }
    // Священный народ → под-бросок d6
    resultEl.innerHTML = `<span class="spirit-result-type">СВЯЩЕННЫЙ НАРОД</span>`;
    const sub = _rollMediumSub(available);
    const subDie = _appendSubDie(modal);
    _animateSpiritDie(subDie, 6, sub, () => {
      if (sub === 6) {
        const sacredAvail = MEDIUM_SACRED_ALL.filter(n => available.includes(n));
        resultEl.innerHTML = `<span class="spirit-result-type">СВЯЩЕННЫЙ НАРОД</span><span class="spirit-result-sep"> — </span><span class="spirit-result-subname">НА ВЫБОР МАРШАЛА</span>`;
        _showMarshalSpiritList(modal, overlay, sacredAvail, markConfirm);
      } else {
        const spirit = MEDIUM_SACRED_SUBTABLE[sub];
        resultEl.innerHTML = _spiritDisplayHtml(spirit);
        _showSpiritCard(modal, spirit);
        _showRaiseDialog(overlay, spirit, markConfirm);
      }
    });
  });
}
