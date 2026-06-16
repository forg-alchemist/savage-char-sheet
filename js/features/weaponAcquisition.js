// ── Weapon Acquisition Modal ──────────────────────────────────────────────────

function updatePickerMoneyBadge() {
  const el = document.getElementById("picker-money-badge");
  if (!el || el.hidden) return;
  const dollars = parseInt(String(state.money || ""), 10) || 0;
  const cents   = parseInt(String(state.moneyCents || ""), 10) || 0;
  const parts   = [`$${dollars}`];
  if (cents > 0) parts.push(`${cents}¢`);
  el.textContent = "ОСТАТОК: " + parts.join(" ");
}

// Parses a price string into total cents: "$2"→200, "50¢"→50, "$1.25"→125
function _parseWeaponCostCents(priceStr) {
  if (!priceStr || priceStr === "—") return null;
  const s = String(priceStr).trim();
  if (/[¢c]/i.test(s)) {
    const num = parseFloat(s.replace(/[^0-9.]/g, ""));
    return isNaN(num) ? null : Math.round(num);
  }
  const num = parseFloat(s.replace(/[^0-9.]/g, ""));
  return isNaN(num) ? null : Math.round(num * 100);
}

function _formatCents(c) {
  if (c === null || c === undefined) return "—";
  if (c === 0) return "0¢";
  if (c < 100) return `${c}¢`;
  const d   = Math.floor(c / 100);
  const rem = c % 100;
  return rem ? `$${d}.${String(rem).padStart(2, "0")}` : `$${d}`;
}

function openWeaponAcquisitionModal(item, onAdd) {
  document.querySelector(".weapon-acq-modal")?.remove();

  const fullCost = _parseWeaponCostCents(item.price);
  const halfCost = fullCost !== null ? Math.ceil(fullCost / 2) : null;

  const _noHalf = item.group === "Взрывчатка" || item.group === "Боеприпасы";

  const OPTIONS = [
    {
      source:  "buy",
      label:   "Купить",
      variant: "buy",
      icon:    "💰",
      cost:    fullCost,
      note:    fullCost !== null ? `Списать ${_formatCents(fullCost)} со счёта` : "Цена не указана",
      price:   _formatCents(fullCost),
    },
    !_noHalf && {
      source:  "half",
      label:   "Купить за полцены",
      variant: "half",
      icon:    "🎲",
      cost:    halfCost,
      note:    halfCost !== null ? `Списать ${_formatCents(halfCost)} · Ветхое состояние` : "Цена не указана · Ветхое состояние",
      price:   _formatCents(halfCost),
    },
    {
      source:  "found",
      label:   "Найденное оружие",
      variant: "found",
      icon:    "🌾",
      cost:    0,
      note:    "Найдено, подарено или выиграно",
      price:   "Бесплатно",
    },
  ].filter(Boolean);

  const modal = document.createElement("div");
  modal.className = "weapon-acq-modal";

  const backdrop = document.createElement("div");
  backdrop.className = "weapon-acq-backdrop";
  backdrop.addEventListener("click", closeWeaponAcquisitionModal);

  const dialog = document.createElement("div");
  dialog.className = "weapon-acq-dialog";
  dialog.innerHTML = `
    <div class="weapon-acq-header">
      <div class="weapon-acq-titles">
        <div class="weapon-acq-eyebrow">Приобретение оружия</div>
        <h3 class="weapon-acq-name">${item.name}</h3>
      </div>
      <button type="button" class="weapon-acq-close">×</button>
    </div>
    <div class="weapon-acq-options">
      ${OPTIONS.map(o => `
        <button type="button" class="weapon-acq-option weapon-acq-option--${o.variant}" data-source="${o.source}">
          <span class="weapon-acq-icon">${o.icon}</span>
          <span class="weapon-acq-body">
            <span class="weapon-acq-label">${o.label}</span>
            <span class="weapon-acq-note">${o.note}</span>
          </span>
          <span class="weapon-acq-price">${o.price}</span>
        </button>`).join("")}
    </div>`;

  dialog.querySelector(".weapon-acq-close").addEventListener("click", closeWeaponAcquisitionModal);

  dialog.querySelectorAll("[data-source]").forEach(btn => {
    btn.addEventListener("click", () => {
      const opt = OPTIONS.find(o => o.source === btn.dataset.source);
      if (opt.cost > 0) {
        if (!spendMoney(opt.cost)) {
          showToast("Не хватает средств!");
          return;
        }
      }
      updatePickerMoneyBadge();
      const weaponToAdd = { ...item };
      if (opt.source === "half") weaponToAdd._worn = true;
      onAdd(weaponToAdd);
      closeWeaponAcquisitionModal();
    });
  });

  modal.append(backdrop, dialog);
  document.body.append(modal);
}

function openArmorAcquisitionModal(item, onAdd) {
  document.querySelector(".weapon-acq-modal")?.remove();

  const fullCost = _parseWeaponCostCents(item.price);

  const OPTIONS = [
    {
      source:  "buy",
      label:   "Купить",
      variant: "buy",
      icon:    "💰",
      cost:    fullCost,
      note:    fullCost !== null ? `Списать ${_formatCents(fullCost)} со счёта` : "Цена не указана",
      price:   _formatCents(fullCost),
    },
    {
      source:  "found",
      label:   "Найденная броня",
      variant: "found",
      icon:    "🌾",
      cost:    0,
      note:    "Найдена, подарена или получена по сюжету",
      price:   "Бесплатно",
    },
  ];

  const modal = document.createElement("div");
  modal.className = "weapon-acq-modal";

  const backdrop = document.createElement("div");
  backdrop.className = "weapon-acq-backdrop";
  backdrop.addEventListener("click", closeWeaponAcquisitionModal);

  const dialog = document.createElement("div");
  dialog.className = "weapon-acq-dialog";
  dialog.innerHTML = `
    <div class="weapon-acq-header">
      <div class="weapon-acq-titles">
        <div class="weapon-acq-eyebrow">Приобретение брони</div>
        <h3 class="weapon-acq-name">${item.name}</h3>
      </div>
      <button type="button" class="weapon-acq-close">×</button>
    </div>
    <div class="weapon-acq-options">
      ${OPTIONS.map(o => `
        <button type="button" class="weapon-acq-option weapon-acq-option--${o.variant}" data-source="${o.source}">
          <span class="weapon-acq-icon">${o.icon}</span>
          <span class="weapon-acq-body">
            <span class="weapon-acq-label">${o.label}</span>
            <span class="weapon-acq-note">${o.note}</span>
          </span>
          <span class="weapon-acq-price">${o.price}</span>
        </button>`).join("")}
    </div>`;

  dialog.querySelector(".weapon-acq-close").addEventListener("click", closeWeaponAcquisitionModal);

  dialog.querySelectorAll("[data-source]").forEach(btn => {
    btn.addEventListener("click", () => {
      const opt = OPTIONS.find(o => o.source === btn.dataset.source);
      if (opt.cost > 0) {
        if (!spendMoney(opt.cost)) {
          showToast("Не хватает средств!");
          return;
        }
      }
      updatePickerMoneyBadge();
      onAdd({ ...item });
      closeWeaponAcquisitionModal();
    });
  });

  modal.append(backdrop, dialog);
  document.body.append(modal);
}

function closeWeaponAcquisitionModal() {
  document.querySelector(".weapon-acq-modal")?.remove();
}
