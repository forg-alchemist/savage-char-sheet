let _powerFilterMode = "normal";

function updateFilterBtnLabel() {
  const btn = document.getElementById("picker-filter-btn");
  if (!btn) return;
  const labels = {
    "normal":           "ФИЛЬТР ВЫБОРА",
    "all":              "ФИЛЬТР: ВСЕ",
    "rank:Новичок":     "ФИЛЬТР: НОВИЧОК",
    "rank:Закалённый":  "ФИЛЬТР: ЗАКАЛЁННЫЙ",
    "rank:Ветеран":     "ФИЛЬТР: ВЕТЕРАН",
    "rank:Герой":       "ФИЛЬТР: ГЕРОЙ",
    "rank:Легенда":     "ФИЛЬТР: ЛЕГЕНДА",
  };
  btn.textContent = labels[_edgeFilterMode] || "ФИЛЬТР ВЫБОРА";
  btn.classList.toggle("picker-filter-btn--active", _edgeFilterMode !== "normal");
}

function updatePowerFilterBtnLabel() {
  const btn = document.getElementById("picker-filter-btn");
  if (!btn) return;
  const labels = {
    "normal":           "ФИЛЬТР ВЫБОРА",
    "all":              "ФИЛЬТР: ВСЕ",
    "rank:Новичок":     "ФИЛЬТР: НОВИЧОК",
    "rank:Закалённый":  "ФИЛЬТР: ЗАКАЛЁННЫЙ",
    "rank:Ветеран":     "ФИЛЬТР: ВЕТЕРАН",
    "rank:Герой":       "ФИЛЬТР: ГЕРОЙ",
    "rank:Легенда":     "ФИЛЬТР: ЛЕГЕНДА",
  };
  btn.textContent = labels[_powerFilterMode] || "ФИЛЬТР ВЫБОРА";
  btn.classList.toggle("picker-filter-btn--active", _powerFilterMode !== "normal");
}

function openPowerFilterPopup(anchorBtn) {
  const existing = document.getElementById("power-filter-popup");
  if (existing) { existing.remove(); return; }

  const popup = document.createElement("div");
  popup.id = "power-filter-popup";
  popup.className = "picker-filter-popup";

  const RANKS = ["Новичок", "Закалённый", "Ветеран", "Герой", "Легенда"];
  const options = [
    { label: "ПОКАЗАТЬ ВСЕ",  mode: "all" },
    ...RANKS.map(r => ({ label: r.toUpperCase(), mode: `rank:${r}` })),
    { label: "ОБЫЧНЫЙ РЕЖИМ", mode: "normal" },
  ];

  options.forEach((opt, i) => {
    if (i === options.length - 1) {
      const sep = document.createElement("div");
      sep.className = "picker-filter-sep";
      popup.append(sep);
    }
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "picker-filter-option" + (_powerFilterMode === opt.mode ? " active" : "");
    btn.textContent = opt.label;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      _powerFilterMode = opt.mode;
      popup.remove();
      updatePowerFilterBtnLabel();
      const search = document.querySelector(".picker-search");
      renderPickerList("powers", search ? search.value : "");
    });
    popup.append(btn);
  });

  const footer = anchorBtn.closest(".picker-footer");
  footer.style.position = "relative";
  footer.append(popup);

  setTimeout(() => {
    document.addEventListener("click", () => {
      const p = document.getElementById("power-filter-popup");
      if (p) p.remove();
    }, { once: true });
  }, 0);
}

function openEdgeFilterPopup(anchorBtn) {
  const existing = document.getElementById("edge-filter-popup");
  if (existing) { existing.remove(); return; }

  const popup = document.createElement("div");
  popup.id = "edge-filter-popup";
  popup.className = "picker-filter-popup";

  const RANKS = ["Новичок", "Закалённый", "Ветеран", "Герой", "Легенда"];
  const options = [
    { label: "ПОКАЗАТЬ ВСЕ",  mode: "all" },
    ...RANKS.map(r => ({ label: r.toUpperCase(), mode: `rank:${r}` })),
    { label: "ОБЫЧНЫЙ РЕЖИМ", mode: "normal" },
  ];

  options.forEach((opt, i) => {
    if (i === options.length - 1) {
      const sep = document.createElement("div");
      sep.className = "picker-filter-sep";
      popup.append(sep);
    }
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "picker-filter-option" + (_edgeFilterMode === opt.mode ? " active" : "");
    btn.textContent = opt.label;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      _edgeFilterMode = opt.mode;
      popup.remove();
      updateFilterBtnLabel();
      const search = document.querySelector(".picker-search");
      renderPickerList("edges", search ? search.value : "");
    });
    popup.append(btn);
  });

  const footer = anchorBtn.closest(".picker-footer");
  footer.style.position = "relative";
  footer.append(popup);

  setTimeout(() => {
    document.addEventListener("click", () => {
      const p = document.getElementById("edge-filter-popup");
      if (p) p.remove();
    }, { once: true });
  }, 0);
}
