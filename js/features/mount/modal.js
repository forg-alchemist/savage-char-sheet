function openMountModal() {
  const { dialog } = buildAcquisitionModal({
    theme: "mount",
    dialogClass: "mount-dialog mount-dialog--variant paper",
    optionsModifier: "mount-options--variants",
    leadImage: "assets/Horse/Horse.png",
    moneyBadge: true,
    eyebrow: "Покупка",
    title: "Вариант лошади",
    options: Object.values(MOUNT_VARIANTS).map(v => ({
      variants: ["variant", v.kind],
      iconImageSrc: v.icon,
      label: v.label,
      note: v.summary,
      price: formatMountPrice(v.priceCents),
      onPick: () => openMountAcquisitionModal(v.kind),
    })),
  });
  updateMountMoneyBadges(dialog);
}

function openMountAcquisitionModal(kind) {
  const definition = getMountDefinition(kind);
  const { dialog } = buildAcquisitionModal({
    theme: "mount",
    dialogClass: "mount-dialog paper",
    leadImage: "assets/Horse/Horse.png",
    moneyBadge: true,
    eyebrow: "Снаряжение",
    title: definition.label,
    options: MOUNT_ACQUISITION_OPTIONS.map(o => ({
      variants: [o.variant],
      icon: o.icon,
      label: o.label,
      note: o.note,
      price: formatMountPrice(getMountOptionPriceCents(kind, o)),
      onPick: () => activateMount(kind, o),
    })),
  });
  updateMountMoneyBadges(dialog);
}

function closeMountModal() {
  document.querySelector(".mount-modal")?.remove();
}

function updateMountMoneyBadges(root = document) {
  root.querySelectorAll("[data-mount-money]").forEach(badge => {
    badge.textContent = `ДЕНЬГИ: ${formatMountMoney(getMoneyCents())}`;
  });
}

function openMountEquipmentModal() {
  if (!state.horseActive || !state.mount) {
    showToast("Сначала нужна лошадь");
    return;
  }
  document.querySelector(".mount-modal")?.remove();
  ensureMountEquipment();
  let groupIndex = 0;

  const modal = document.createElement("div");
  modal.className = "mount-modal";

  const backdrop = document.createElement("div");
  backdrop.className = "mount-backdrop";
  backdrop.addEventListener("click", closeMountModal);

  const dialog = document.createElement("div");
  dialog.className = "mount-dialog mount-dialog--equipment paper";
  dialog.innerHTML = `
    <div class="mount-dialog-header">
      <img src="assets/Horse/Horse.png" class="mount-dialog-horse" alt="">
      <div class="mount-dialog-titles">
        <div class="mount-dialog-eyebrow">Покупка</div>
        <h3 class="mount-title">Снаряжение лошади</h3>
      </div>
      <span class="mount-money-badge" data-mount-money></span>
      <button type="button" class="mount-dialog-close">×</button>
    </div>
    <div class="mount-equipment-pager">
      <button type="button" class="mount-equipment-page-btn" data-mount-equipment-page="prev" aria-label="Предыдущая категория">‹</button>
      <div class="mount-equipment-page-label" data-mount-equipment-category></div>
      <button type="button" class="mount-equipment-page-btn" data-mount-equipment-page="next" aria-label="Следующая категория">›</button>
    </div>
    <div class="mount-options mount-options--equipment" data-mount-equipment-options>
    </div>`;

  dialog.querySelector(".mount-dialog-close").addEventListener("click", closeMountModal);

  const optionsRoot = dialog.querySelector("[data-mount-equipment-options]");
  const categoryLabel = dialog.querySelector("[data-mount-equipment-category]");
  const prevBtn = dialog.querySelector('[data-mount-equipment-page="prev"]');
  const nextBtn = dialog.querySelector('[data-mount-equipment-page="next"]');

  const renderGroup = () => {
    const options = getMountEquipmentPurchaseOptions();
    const optionsByKey = new Map(options.map(option => [option.key, option]));
    const groups = MOUNT_EQUIPMENT_GROUPS.map(group => ({
      ...group,
      options: options.filter(option => option.variant === group.key),
    }));
    groupIndex = Math.max(0, Math.min(groupIndex, groups.length - 1));
    const group = groups[groupIndex];
    updateMountMoneyBadges(dialog);
    categoryLabel.className = `mount-equipment-page-label mount-equipment-page-label--${group.key}`;
    categoryLabel.innerHTML = `
      <span class="mount-equipment-page-icon mount-equipment-page-icon--${group.key}">${group.icon}</span>
      <span class="mount-equipment-page-text">${group.label}</span>`;
    prevBtn.disabled = groupIndex === 0;
    nextBtn.disabled = groupIndex === groups.length - 1;
    optionsRoot.innerHTML = group.options.length
      ? group.options.map(renderMountEquipmentPurchaseOption).join("")
      : `<div class="mount-option-empty">Нет предметов в категории</div>`;
    optionsRoot.querySelectorAll("[data-mount-equipment]").forEach(btn => {
      btn.addEventListener("click", () => {
        const option = optionsByKey.get(btn.dataset.mountEquipment);
        if (!option || option.locked) return;
        if (buyMountEquipment(option)) renderGroup();
      });
    });
  };

  prevBtn.addEventListener("click", () => {
    if (groupIndex <= 0) return;
    groupIndex -= 1;
    renderGroup();
  });
  nextBtn.addEventListener("click", () => {
    if (groupIndex >= MOUNT_EQUIPMENT_GROUPS.length - 1) return;
    groupIndex += 1;
    renderGroup();
  });

  renderGroup();

  modal.append(backdrop, dialog);
  document.body.append(modal);
}

function renderMountEquipmentPurchaseOption(o) {
  return `
    <button type="button" class="mount-option mount-option--${o.variant}${o.locked ? " mount-option--locked" : ""}" data-mount-equipment="${o.key}" ${o.locked ? "disabled" : ""}>
      <span class="mount-option-icon">${o.icon}</span>
      <span class="mount-option-body">
        <span class="mount-option-label">${o.label}</span>
        <span class="mount-option-note">${o.note}</span>
      </span>
      <span class="mount-option-price">${o.locked ? o.lockedLabel : formatMountPrice(o.priceCents)}</span>
    </button>`;
}
