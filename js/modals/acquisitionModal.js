// ── Acquisition modal — общий конструктор (техдолг #11) ───────────────────────
// Один шаблон «приобретения» (оружие/броня/лошадь/способ покупки) вместо ~5
// скопированных каркасов. Визуальные различия двух семейств (оружейный и
// лошадиный) инкапсулированы в ACQ_THEMES — карте имён CSS-классов; разметка и
// проводка (backdrop/закрытие/клик по опции) общие. CSS не меняется.

const ACQ_THEMES = {
  weapon: {
    modal:    "weapon-acq-modal",
    backdrop: "weapon-acq-backdrop",
    dialog:   "weapon-acq-dialog",
    header:   "weapon-acq-header",
    titles:   "weapon-acq-titles",
    eyebrow:  "weapon-acq-eyebrow",
    title:    "weapon-acq-name",
    close:    "weapon-acq-close",
    options:  "weapon-acq-options",
    option:   "weapon-acq-option",
    icon:     "weapon-acq-icon",
    body:     "weapon-acq-body",
    label:    "weapon-acq-label",
    note:     "weapon-acq-note",
    price:    "weapon-acq-price",
  },
  mount: {
    modal:    "mount-modal",
    backdrop: "mount-backdrop",
    dialog:   "mount-dialog",
    header:   "mount-dialog-header",
    titles:   "mount-dialog-titles",
    eyebrow:  "mount-dialog-eyebrow",
    title:    "mount-title",
    close:    "mount-dialog-close",
    options:  "mount-options",
    option:   "mount-option",
    icon:     "mount-option-icon",
    body:     "mount-option-body",
    label:    "mount-option-label",
    note:     "mount-option-note",
    price:    "mount-option-price",
  },
};

function _renderAcqOption(t, o, index) {
  const variants = (o.variants || []).map(v => ` ${t.option}--${v}`).join("");
  const locked   = o.disabled ? ` ${t.option}--locked` : "";
  const icon = o.iconImageSrc
    ? `<span class="${t.icon} ${t.icon}--image"><img src="${o.iconImageSrc}" alt=""></span>`
    : `<span class="${t.icon}">${o.icon}</span>`;
  return `
    <button type="button" class="${t.option}${variants}${locked}" data-acq-index="${index}"${o.disabled ? " disabled" : ""}>
      ${icon}
      <span class="${t.body}">
        <span class="${t.label}">${o.label}</span>
        <span class="${t.note}">${o.note}</span>
      </span>
      <span class="${t.price}">${o.price}</span>
    </button>`;
}

// config: {
//   theme: "weapon" | "mount",
//   eyebrow, title,
//   dialogClass?: string,        // переопределяет класс диалога (модификаторы/paper)
//   optionsModifier?: string,    // доп. класс к контейнеру опций
//   leadImage?: string,          // src картинки-лошади в шапке (mount)
//   moneyBadge?: bool,           // показать [data-mount-money] бейдж (mount)
//   options: [{ variants?, icon?, iconImageSrc?, label, note, price, disabled?, onPick(ctx) }],
//   onClose?: fn
// }
// onPick получает { close, dialog }. Возвращает { modal, dialog, close }.
function buildAcquisitionModal(config) {
  const t = ACQ_THEMES[config.theme];
  document.querySelector(`.${t.modal}`)?.remove();

  const modal = document.createElement("div");
  modal.className = t.modal;

  const close = () => {
    modal.remove();
    config.onClose?.();
  };

  const backdrop = document.createElement("div");
  backdrop.className = t.backdrop;
  backdrop.addEventListener("click", close);

  const dialog = document.createElement("div");
  dialog.className = config.dialogClass || t.dialog;

  const leadImageHtml = config.leadImage
    ? `<img src="${config.leadImage}" class="mount-dialog-horse" alt="">` : "";
  const moneyBadgeHtml = config.moneyBadge
    ? `<span class="mount-money-badge" data-mount-money></span>` : "";
  const optionsClass = config.optionsModifier
    ? `${t.options} ${config.optionsModifier}` : t.options;

  dialog.innerHTML = `
    <div class="${t.header}">
      ${leadImageHtml}
      <div class="${t.titles}">
        <div class="${t.eyebrow}">${config.eyebrow}</div>
        <h3 class="${t.title}">${config.title}</h3>
      </div>
      ${moneyBadgeHtml}
      <button type="button" class="${t.close}">×</button>
    </div>
    <div class="${optionsClass}">
      ${config.options.map((o, i) => _renderAcqOption(t, o, i)).join("")}
    </div>`;

  dialog.querySelector(`.${t.close}`).addEventListener("click", close);

  dialog.querySelectorAll("[data-acq-index]").forEach(btn => {
    btn.addEventListener("click", () => {
      const opt = config.options[Number(btn.dataset.acqIndex)];
      if (!opt || opt.disabled) return;
      opt.onPick?.({ close, dialog });
    });
  });

  modal.append(backdrop, dialog);
  document.body.append(modal);
  return { modal, dialog, close };
}
