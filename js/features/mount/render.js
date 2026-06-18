function renderMountIndicators(definition, defects) {
  const calculated = getMountIndicators(definition, defects);
  const labels = {
    pace: "Шаг",
    runDie: "Бег",
    parry: "Защита",
    toughness: "Стойкость",
  };
  const outputs = {
    pace: "mountPace",
    runDie: "mountRunDie",
    parry: "mountParry",
    toughness: "mountToughness",
  };

  Object.keys(labels).forEach(key => {
    const tile = document.querySelector(`[data-mount-indicator="${key}"]`);
    const output = document.querySelector(`[data-output="${outputs[key]}"]`);
    const value = calculated.values[key];
    const base = calculated.base[key];
    const modified = value !== base;
    if (output) output.textContent = value;
    if (tile) {
      tile.classList.toggle("horse-indicator--modified", modified);
      const suffix = calculated.notes[key].length
        ? ` Модификаторы: ${calculated.notes[key].join("; ")}.`
        : " Модификаторов нет.";
      tile.dataset.tooltip = `${labels[key]}: ${value}. База: ${base}.${suffix}`;
    }
  });
}

function renderMountEquipment(defects) {
  const root = document.querySelector('[data-output="mountEquipmentList"]');
  if (!root) return;
  root.replaceChildren();
  const equipment = ensureMountEquipment();
  const items = getMountEquipmentItems();
  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "mount-equipment-empty";
    empty.textContent = "Нет снаряжения";
    root.append(empty);
    return;
  }

  items.forEach(item => {
    const row = document.createElement("div");
    row.className = "mount-equipment-row";
    row.classList.add(`mount-equipment-row--${getMountEquipmentGroup(item)}`);

    const main = document.createElement("div");
    main.className = "mount-equipment-main";
    const nameRow = document.createElement("div");
    nameRow.className = "mount-equipment-name-row";
    const name = document.createElement("strong");
    name.textContent = item.name;
    nameRow.append(name);
    // Пометка происхождения (купленные/найденные). Для винтовок в чехле — нет.
    if (item.kind !== "stash") {
      const src = equipment._source?.[item.kind === "armor" ? "armor" : item.key] || "bought";
      const badge = document.createElement("span");
      badge.className = "mount-eq-source mount-eq-source--" + (src === "mixed" ? "mixed" : src);
      badge.textContent = src === "found" ? "Найдено" : src === "mixed" ? "Куплено / Найдено" : "Куплено";
      nameRow.append(badge);
    }
    const meta = document.createElement("span");
    if (item.kind === "armor") {
      meta.innerHTML = mountArmorEquipmentNote(item);
    } else {
      meta.innerHTML = mountEquipmentStat(`Вес ${formatMountNumber(Number(item.weight) || 0)}`);
    }
    main.append(nameRow, meta);

    const note = item.note || item.notes;
    if (note && note !== "—") {
      const desc = document.createElement("p");
      desc.className = "mount-equipment-desc";
      desc.textContent = note;
      main.append(desc);
    }

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "×";
    remove.addEventListener("click", () => removeMountEquipment(item.key));

    row.append(main, remove);
    root.append(row);
  });
}

function formatMountNumber(value) {
  return trimNumber(value);
}

function getMountFeatureTexts(definition, defects = getMountDefectItems()) {
  const features = [...(definition.features || [])];
  if (!(state.horseActive && state.mount)) return features;
  const spurs = MOUNT_GEAR_ITEMS["horseSpurs"];
  const hasSpurs = spurs && getMountGearOwnedCount(ensureMountEquipment(), spurs) > 0;
  const hasHeavyweight = hasMountEdge("e089", defects);
  const hoofDie = hasHeavyweight ? (hasSpurs ? "d8" : "d6") : (hasSpurs ? "d6" : "d4");
  return features.map(text => String(text).replace(/Сила\+d[468]/g, `Сила+${hoofDie}`));
}

function getMountTraitText(definition, defects) {
  let text = definition.traits || "";
  defects.forEach(defect => {
    const effect = getMountHindranceEffect(defect);
    const replacements = effect?.traitReplacements?.[definition.kind] || [];
    replacements.forEach(([from, to]) => {
      text = text.replace(from, to);
    });
  });
  return text;
}

function getMountHindrancePenalty(defect) {
  return defect.penaltyMount || defect.penalty;
}

function getMountHindranceBonus(defect) {
  return defect.bonusMount || defect.bonus;
}

function getMountEdgeText(definition, defects) {
  const edgeNames = getMountEdgeItems(defects).map(edge => edge.name);
  return [definition.edges, ...edgeNames].filter(Boolean).join(", ");
}

function getMountHindranceDescription(defect) {
  return defect.descriptionMount || defect.description || "";
}

function _pickRandomUnique(items, count) {
  const pool = [...items];
  const picked = [];
  while (picked.length < count && pool.length > 0) {
    const i = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(i, 1)[0]);
  }
  return picked;
}

function renderMount() {
  if (state.horseActive && !state.mount) {
    state.mount = { type: "horse", kind: "regular", source: "found", defectIds: [] };
  } else if (state.mount && !state.mount.kind) {
    state.mount.kind = "regular";
  }

  const active = !!state.horseActive;
  const definition = getMountDefinition(state.mount?.kind);
  document.querySelectorAll(".horse-token").forEach(token => {
    token.classList.toggle("active", active);
  });

  const panel = document.querySelector(".horse-panel");
  panel?.classList.toggle("horse-panel--active", active);
  panel?.classList.toggle("horse-panel--inactive", !active);

  const actionLabel = document.querySelector('[data-output="mountActionLabel"]');
  if (actionLabel) actionLabel.textContent = active ? "Убрать лошадь" : "Купить лошадь";

  const mountTitle = document.querySelector('[data-output="mountTitle"]');
  if (mountTitle) mountTitle.textContent = active ? definition.title : MOUNT_VARIANTS.regular.title;

  const lead = document.querySelector('[data-output="mountLead"]');
  if (lead) lead.textContent = active ? definition.lead : MOUNT_VARIANTS.regular.lead;

  const defects = getMountDefectItems();

  const traits = document.querySelector('[data-output="mountTraits"]');
  if (traits) traits.textContent = getMountTraitText(definition, defects);

  const skills = document.querySelector('[data-output="mountSkills"]');
  if (skills) skills.textContent = definition.skills;

  renderMountIndicators(definition, defects);
  renderMountEquipment(defects);

  const edges = document.querySelector('[data-output="mountEdges"]');
  if (edges) edges.textContent = getMountEdgeText(definition, defects);

  const features = document.querySelector('[data-output="mountFeatures"]');
  if (features) {
    features.replaceChildren();
    getMountFeatureTexts(definition, defects).forEach(text => {
      const li = document.createElement("li");
      li.innerHTML = text;
      features.append(li);
    });
  }

  const stateLabel = document.querySelector('[data-output="mountState"]');
  if (stateLabel) {
    const sourceLabels = {
      buy: "Куплена",
      half: "Куплена за полцены",
      found: "Найдена",
    };
    stateLabel.textContent = active ? (sourceLabels[state.mount?.source] || "Лошадь есть") : "Нет лошади";
  }

  const loadStats = getMountLoadStats(definition, defects);
  const currentLoad = getMountCurrentLoad();
  const weightTotalEl = document.querySelector('[data-output="mountWeightTotal"]');
  if (weightTotalEl) {
    renderLoadMeter(weightTotalEl, currentLoad, loadStats.value);
    weightTotalEl.dataset.tooltip = loadStats.notes.length
      ? `${weightTotalEl.dataset.tooltip} База: ${formatMountNumber(loadStats.base)}. ${loadStats.notes.join("; ")}.`
      : `${weightTotalEl.dataset.tooltip} Модификаторов комфортной нагрузки нет.`;
  }

  const card = document.querySelector('[data-output="mountStatus"]');
  if (!card) return;

  card.hidden = !active || defects.length === 0;
  card.replaceChildren();
  if (card.hidden) return;

  const title = document.createElement("div");
  title.className = "mount-card-title";
  title.textContent = "Изъяны";

  const list = document.createElement("div");
  list.className = "mount-hindrance-list";
  defects.forEach(defect => {
    const item = document.createElement("article");
    item.className = "choice-card mount-hindrance-card";

    const row = document.createElement("div");
    row.className = "hindrance-name-row";
    const name = document.createElement("strong");
    name.textContent = defect.name;
    const badge = document.createElement("span");
    badge.className = "degree-badge " + (defect.degree === "Крупный" ? "major" : "minor");
    badge.textContent = defect.degree;
    row.append(name, badge);
    item.append(row);

    const penalty = getMountHindrancePenalty(defect);
    if (penalty && penalty !== "-") {
      const penaltyEl = document.createElement("div");
      penaltyEl.className = "picker-item-penalty";
      penaltyEl.textContent = `Штраф: ${penalty}`;
      item.append(penaltyEl);
    }
    const bonus = getMountHindranceBonus(defect);
    if (bonus && bonus !== "-") {
      const bonusEl = document.createElement("div");
      bonusEl.className = "picker-item-bonus";
      bonusEl.textContent = `Бонус: ${bonus}`;
      item.append(bonusEl);
    }

    const description = document.createElement("p");
    description.innerHTML = getMountHindranceDescription(defect);
    item.append(description);
    list.append(item);
  });
  card.append(title, list);

  const bonusEdges = hasMountBlindness(defects) ? getMountEdgeItems(defects) : [];
  if (bonusEdges.length > 0) {
    const edgeTitle = document.createElement("div");
    edgeTitle.className = "mount-card-title";
    edgeTitle.textContent = "Черта";

    const edgeList = document.createElement("div");
    edgeList.className = "mount-hindrance-list";
    bonusEdges.forEach(edge => {
      const item = document.createElement("article");
      item.className = "choice-card mount-edge-card";

      const row = document.createElement("div");
      row.className = "hindrance-name-row";
      const name = document.createElement("strong");
      name.textContent = edge.name;
      const badge = document.createElement("span");
      badge.className = "edge-rank-badge";
      badge.textContent = edge.rank || "Черта";
      row.append(name, badge);
      item.append(row);

      const description = document.createElement("p");
      description.innerHTML = edge.effect || "";
      item.append(description);
      edgeList.append(item);
    });

    card.append(edgeTitle, edgeList);
  }
}
