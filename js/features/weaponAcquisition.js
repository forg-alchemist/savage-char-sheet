// ── Weapon Acquisition Modal ──────────────────────────────────────────────────

function updatePickerMoneyBadge() {
  const el = document.getElementById("picker-money-badge");
  if (!el || el.hidden) return;
  const total   = getMoneyCents();
  const dollars = Math.floor(total / 100);
  const cents   = total % 100;
  const parts   = [`$${dollars}`];
  if (cents > 0) parts.push(`${cents}¢`);
  el.textContent = "ОСТАТОК: " + parts.join(" ");
}

// Парсинг/форматирование цены — в js/features/money.js (parsePriceCents / formatCents), #10

// Списать стоимость опции (если есть) и добавить предмет; общий обработчик
// клика для оружия/брони. Возвращает true, если предмет добавлен.
function _acqBuy(opt, item, onAdd, close, mutate) {
  if (opt.cost > 0 && !spendMoney(opt.cost)) {
    showToast("Не хватает средств!");
    return;
  }
  updatePickerMoneyBadge();
  const toAdd = { ...item };
  if (mutate) mutate(toAdd);
  onAdd(toAdd);
  close();
}

function openWeaponAcquisitionModal(item, onAdd) {
  const fullCost = parsePriceCents(item.price);
  const halfCost = fullCost !== null ? Math.ceil(fullCost / 2) : null;
  const noHalf   = item.group === "Взрывчатка" || item.group === "Боеприпасы";

  const options = [
    {
      variants: ["buy"], icon: "💰", label: "Купить",
      note:  fullCost !== null ? `Списать ${formatCents(fullCost)} со счёта` : "Цена не указана",
      price: formatCents(fullCost),
      onPick: ({ close }) => _acqBuy({ cost: fullCost }, item, onAdd, close),
    },
    !noHalf && {
      variants: ["half"], icon: "🎲", label: "Купить за полцены",
      note:  halfCost !== null ? `Списать ${formatCents(halfCost)} · Ветхое состояние` : "Цена не указана · Ветхое состояние",
      price: formatCents(halfCost),
      onPick: ({ close }) => _acqBuy({ cost: halfCost }, item, onAdd, close, w => { w._worn = true; }),
    },
    {
      variants: ["found"], icon: "🌾", label: "Найденное оружие",
      note: "Найдено, подарено или выиграно", price: "Бесплатно",
      onPick: ({ close }) => _acqBuy({ cost: 0 }, item, onAdd, close),
    },
  ].filter(Boolean);

  buildAcquisitionModal({
    theme: "weapon",
    eyebrow: "Приобретение оружия",
    title: item.name,
    options,
  });
}

function openArmorAcquisitionModal(item, onAdd) {
  const fullCost = parsePriceCents(item.price);

  const options = [
    {
      variants: ["buy"], icon: "💰", label: "Купить",
      note:  fullCost !== null ? `Списать ${formatCents(fullCost)} со счёта` : "Цена не указана",
      price: formatCents(fullCost),
      onPick: ({ close }) => _acqBuy({ cost: fullCost }, item, onAdd, close),
    },
    {
      variants: ["found"], icon: "🌾", label: "Найденная броня",
      note: "Найдена, подарена или получена по сюжету", price: "Бесплатно",
      onPick: ({ close }) => _acqBuy({ cost: 0 }, item, onAdd, close),
    },
  ];

  buildAcquisitionModal({
    theme: "weapon",
    eyebrow: "Приобретение брони",
    title: item.name,
    options,
  });
}

function closeWeaponAcquisitionModal() {
  document.querySelector(".weapon-acq-modal")?.remove();
}
