// ── Деньги — единый модуль ────────────────────────────────────────────────────
// Кошелёк персонажа в state.money (доллары) + state.moneyCents (центы).
// Вся логика денег живёт здесь: чтение остатка, списание, парсинг цены.
// Дисплей-форматтеры лошади (formatMountPrice/formatMountMoney) оставлены в
// mount/ — у них свой стиль «$ X / Бесплатно»; здесь — нейтральный formatCents.

// Текущий остаток в центах.
function getMoneyCents() {
  const dollars = parseInt(String(state.money || ""), 10) || 0;
  const cents   = parseInt(String(state.moneyCents || ""), 10) || 0;
  return dollars * 100 + cents;
}

// Списать amountCents со счёта (с «заёмом» центов из долларов). Обновляет
// и state, и поля ввода. Возвращает false, если не хватает средств.
function spendMoney(amountCents) {
  const total = getMoneyCents();
  if (total < amountCents) return false;
  const remaining  = total - amountCents;
  state.money      = String(Math.floor(remaining / 100));
  state.moneyCents = String(remaining % 100);
  const mEl = document.querySelector('[data-bind="money"]');
  const cEl = document.querySelector('[data-bind="moneyCents"]');
  if (mEl) mEl.value = state.money;
  if (cEl) cEl.value = state.moneyCents;
  return true;
}

// Добавить amountCents в кошелёк (с переносом центов в доллары). Обновляет
// state и поля ввода, сохраняет. Деньги-гранты (Богатство/расклад) считаются
// через дельту в syncMoneyGrants, поэтому ручное пополнение ими не затирается.
function addMoney(amountCents) {
  if (!amountCents || amountCents <= 0) return;
  const total = getMoneyCents() + amountCents;
  state.money      = String(Math.floor(total / 100));
  state.moneyCents = String(total % 100);
  const mEl = document.querySelector('[data-bind="money"]');
  const cEl = document.querySelector('[data-bind="moneyCents"]');
  if (mEl) mEl.value = state.money;
  if (cEl) cEl.value = state.moneyCents;
  scheduleSave();
}

// Модалка кошелька: вводим доллары/центы → «Добавить» (приход) или «Списать»
// (непредвиденные траты; не уходит в минус — при нехватке предупреждает).
function openMoneyModal() {
  document.querySelector(".addcash-modal")?.remove();

  const modal = document.createElement("div");
  modal.className = "addcash-modal";
  const close = () => modal.remove();

  const backdrop = document.createElement("div");
  backdrop.className = "addcash-backdrop";
  backdrop.addEventListener("click", close);

  const dialog = document.createElement("div");
  dialog.className = "addcash-dialog paper";
  dialog.innerHTML = `
    <div class="addcash-header">
      <div class="addcash-eyebrow">Кошелёк</div>
      <h3 class="addcash-title">Изменить наличность</h3>
      <button type="button" class="addcash-close">×</button>
    </div>
    <div class="addcash-fields">
      <div class="money-wrap"><span class="currency-sign">$</span><input type="number" min="0" step="1" class="addcash-dollars" placeholder="0"></div>
      <div class="money-wrap"><span class="currency-sign">¢</span><input type="number" min="0" max="99" step="1" class="addcash-cents" placeholder="0"></div>
    </div>
    <div class="addcash-actions">
      <button type="button" class="addcash-submit addcash-submit--add">＋ Добавить</button>
      <button type="button" class="addcash-submit addcash-submit--spend">－ Списать</button>
    </div>`;

  const dollarsEl = dialog.querySelector(".addcash-dollars");
  const centsEl   = dialog.querySelector(".addcash-cents");
  const readCents = () => (parseInt(dollarsEl.value, 10) || 0) * 100 + (parseInt(centsEl.value, 10) || 0);

  const doAdd = () => {
    const cents = readCents();
    if (cents <= 0) { close(); return; }
    addMoney(cents);
    showToast(`Добавлено ${formatCents(cents)}`);
    close();
  };
  const doSpend = () => {
    const cents = readCents();
    if (cents <= 0) { close(); return; }
    if (spendMoney(cents)) {
      scheduleSave();
      showToast(`Списано ${formatCents(cents)}`);
      close();
    } else {
      showToast("Не хватает средств!");
    }
  };

  dialog.querySelector(".addcash-close").addEventListener("click", close);
  dialog.querySelector(".addcash-submit--add").addEventListener("click", doAdd);
  dialog.querySelector(".addcash-submit--spend").addEventListener("click", doSpend);
  dialog.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); doAdd(); }
    if (e.key === "Escape") close();
  });

  modal.append(backdrop, dialog);
  document.body.append(modal);
  setTimeout(() => dollarsEl.focus(), 0);
}

// Парсит строку цены в центы: "$2"→200, "50¢"→50, "$1.25"→125.
// Возвращает null, если цена не указана ("—"/пусто/мусор).
function parsePriceCents(priceStr) {
  if (!priceStr || priceStr === "—") return null;
  const s = String(priceStr).trim();
  const num = parseFloat(s.replace(/[^0-9.]/g, ""));
  if (isNaN(num)) return null;
  // символ ¢ (или латинская c) — цена сразу в центах, иначе в долларах
  return /[¢c]/i.test(s) ? Math.round(num) : Math.round(num * 100);
}

// Форматирует центы для показа: null→"—", 0→"0¢", <100→"X¢", иначе "$D"/"$D.CC".
function formatCents(c) {
  if (c === null || c === undefined) return "—";
  if (c === 0) return "0¢";
  if (c < 100) return `${c}¢`;
  const d   = Math.floor(c / 100);
  const rem = c % 100;
  return rem ? `$${d}.${String(rem).padStart(2, "0")}` : `$${d}`;
}
