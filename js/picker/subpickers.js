function openPrimetaSubPicker() {
  const existing = document.getElementById("primeta-sub-picker-overlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "primeta-sub-picker-overlay";
  overlay.className = "primeta-sub-picker-overlay";

  const dialog = document.createElement("div");
  dialog.className = "primeta-sub-picker-dialog paper";

  const header = document.createElement("div");
  header.className = "picker-header";

  const title = document.createElement("h3");
  title.className = "picker-title";
  title.textContent = "ВЫБЕРИ ПРИМЕТУ";

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "picker-close";
  closeBtn.textContent = "×";
  closeBtn.addEventListener("click", () => overlay.remove());

  header.append(title, closeBtn);

  const listEl = document.createElement("div");
  listEl.className = "picker-list";

  const subs = (CATALOGS.edges || []).filter(e => e.requirements === PRIMETA_NAME);

  subs.forEach(subItem => {
    const row = document.createElement("div");
    row.className = "picker-item";

    const info = document.createElement("div");

    const nameEl = document.createElement("div");
    nameEl.className = "picker-item-name";
    nameEl.textContent = subItem.name;

    const descEl = document.createElement("div");
    descEl.className = "picker-item-desc";
    descEl.innerHTML = subItem.effect;

    info.append(nameEl, descEl);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "picker-item-add picker-item-add--primeta";
    btn.textContent = "▶";

    btn.addEventListener("click", () => {
      const targetKey = "selectedEdges";
      const currentCount = (state[targetKey] || []).length;

      const addSubEdge = () => {
        state[targetKey] = state[targetKey] || [];
        state[targetKey].push(subItem);
        pruneInvalidEdges();
        commitSheetUpdate({ renderChoices: "edges", updateEdgeCost: true });
        overlay.remove();
        const searchEl = document.querySelector("#picker-modal .picker-search");
        if (searchEl && !document.getElementById("picker-modal").hidden) {
          renderPickerList("edges", searchEl.value);
        }
      };

      if (currentCount >= 1) {
        if ((state.extraPoints || 0) < 2) {
          showToast("Недостаточно доп. очков (нужно 2)");
          return;
        }
        showConfirm(
          `Добавление черты «${subItem.name}» потратит 2 доп. очка. Подтвердить?`,
          () => {
            state.extraPoints -= 2;
            setOutput("extraPoints", state.extraPoints);
            addSubEdge();
          }
        );
      } else {
        addSubEdge();
      }
    });

    row.append(info, btn);
    listEl.append(row);
  });

  dialog.append(header, listEl);
  overlay.append(dialog);
  document.body.append(overlay);
}

function openKungfuSubPicker(parentName) {
  const existing = document.getElementById("kungfu-sub-picker-overlay");
  if (existing) existing.remove();

  const avail = availableKungfuSubStyles(parentName);
  if (!avail.length) { showToast("Все стили уже выбраны"); return; }

  const overlay = document.createElement("div");
  overlay.id = "kungfu-sub-picker-overlay";
  overlay.className = "primeta-sub-picker-overlay";

  const dialog = document.createElement("div");
  dialog.className = "primeta-sub-picker-dialog paper";

  const header = document.createElement("div");
  header.className = "picker-header";
  const title = document.createElement("h3");
  title.className = "picker-title";
  title.textContent = "Выбор стиля: " + parentName;
  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "picker-close";
  closeBtn.textContent = "×";
  closeBtn.addEventListener("click", () => overlay.remove());
  header.append(title, closeBtn);

  const listEl = document.createElement("div");
  listEl.className = "picker-list";

  avail.forEach(subItem => {
    const row = document.createElement("div");
    row.className = "picker-item";
    const info = document.createElement("div");
    const nameEl = document.createElement("div");
    nameEl.className = "picker-item-name";
    nameEl.textContent = subItem.name;
    if (subItem.archetype && ARCHETYPE_COLORS[subItem.archetype]) {
      nameEl.style.color = ARCHETYPE_COLORS[subItem.archetype].accent;
    }
    const descEl = document.createElement("div");
    descEl.className = "picker-item-desc";
    descEl.innerHTML = subItem.effect || "";
    info.append(nameEl, descEl);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "picker-item-add picker-item-add--primeta";
    btn.textContent = "▶";

    btn.addEventListener("click", () => {
      const targetKey = "selectedEdges";
      const totalEdgeCount = (state[targetKey] || []).reduce((s, e) => s + (e.count || 1), 0);
      const addSubEdge = () => {
        state[targetKey] = state[targetKey] || [];
        state[targetKey].push({ ...subItem });
        pruneInvalidEdges();
        commitSheetUpdate({ renderChoices: "edges", updateEdgeCost: true });
        overlay.remove();
        const searchEl = document.querySelector("#picker-modal .picker-search");
        if (searchEl && !document.getElementById("picker-modal").hidden) {
          renderPickerList("edges", searchEl.value);
        }
      };
      if (totalEdgeCount >= 1) {
        if ((state.extraPoints || 0) < 2) { showToast("Недостаточно доп. очков (нужно 2)"); return; }
        showConfirm(`Добавить стиль «${subItem.name}»? Стоимость: 2 доп. очка.`, () => {
          state.extraPoints -= 2;
          setOutput("extraPoints", state.extraPoints);
          addSubEdge();
        });
      } else {
        addSubEdge();
      }
    });

    row.append(info, btn);
    listEl.append(row);
  });

  dialog.append(header, listEl);
  overlay.append(dialog);
  document.body.append(overlay);
}
