function createPickerEdgeRankBadge(item) {
  if (!item.rank) return null;

  const badge = document.createElement("span");
  badge.className = `edge-rank-badge ${rankBadgeClass(item.rank)}`;
  badge.textContent = item.rank;
  return badge;
}

function createPickerEdgeRequirementBadge(item) {
  let displayReq = (item.requirements && item.requirements !== "-" && item.requirements !== "—") ? item.requirements : "";
  displayReq = displayReq.split(",").map(s => s.trim()).filter(s => {
    if (/дикая\s+карта/i.test(s)) return false;
    if (/мистический\s+дар\s*\(/i.test(s)) return false;
    return true;
  }).join(", ");

  if (item.name.endsWith("++")) {
    const plusName = item.name.slice(0, -1);
    if (!displayReq.includes(plusName)) displayReq = displayReq ? `${plusName}, ${displayReq}` : plusName;
  } else if (item.name.endsWith("+")) {
    const baseName = item.name.slice(0, -1);
    if (!displayReq.includes(baseName)) displayReq = displayReq ? `${baseName}, ${displayReq}` : baseName;
  }

  if (!displayReq) return null;

  const req = document.createElement("div");
  req.className = "req-badge";
  req.textContent = `Требования: ${displayReq}`;
  return req;
}

function appendWeaponPickerStats(info, item) {
  const stats = document.createElement("div");
  stats.className = "picker-item-desc picker-weapon-stats";
  const dash = v => !v || v === "—";
  const parts = [
    ["range", "Дист", item.range],
    ["damage", "Урон", item.damage],
    ["ap", "ББ", item.ap],
    ["magazine", "Обойма", item.magazine],
    ["mode", "Режим", item.mode],
    ["strength", "МС", item.mc],
    ["price", "Цена", item.price],
    ["weight", "Вес", item.weight],
  ].filter(([, , value]) => !dash(value));

  parts.forEach(([mod, label, value]) => {
    const stat = document.createElement("span");
    stat.className = `picker-weapon-stat picker-weapon-stat--${mod}`;
    stat.textContent = `${label}: ${value}`;
    stats.append(stat);
  });

  if (item.notes) {
    const notes = document.createElement("span");
    notes.className = "picker-weapon-stat picker-weapon-stat--notes";
    notes.textContent = item.notes;
    stats.append(notes);
  }

  info.append(stats);
}

function appendArmorPickerStats(info, item) {
  const stats = document.createElement("div");
  stats.className = "picker-item-desc picker-armor-stats";
  [
    ["armor", "Броня", `+${item.bonus}`],
    ["sectors", "Секторы", formatArmorSectors(item)],
    ["strength", "МС", item.minStr],
    ["weight", "Вес", `${item.weight} кг`],
    ["price", "Цена", item.price],
  ].forEach(([mod, label, value]) => {
    const stat = document.createElement("span");
    stat.className = `picker-armor-stat picker-armor-stat--${mod}`;
    stat.textContent = `${label}: ${value}`;
    stats.append(stat);
  });
  info.append(stats);
}

function appendHindrancePickerContent({ row, info, item, name, desc }) {
  const harrowedHindrance = !!item.harrowedOnly;
  row.classList.add(item.degree === "Крупный" ? "picker-item--major" : "picker-item--minor");
  if (harrowedHindrance) row.classList.add("picker-item--harrowed");

  const degreeBadge = document.createElement("span");
  degreeBadge.className = "degree-badge " + (item.degree === "Крупный" ? "major" : "minor") + (harrowedHindrance ? " harrowed" : "");
  degreeBadge.textContent = item.degree;

  const nameRow = document.createElement("div");
  nameRow.className = "hindrance-name-row";
  nameRow.append(name, degreeBadge);
  desc.className = "picker-item-desc picker-item-desc--minor";
  info.append(nameRow);

  if (item.penalty && item.penalty !== "-") {
    const penaltyEl = document.createElement("div");
    penaltyEl.className = "picker-item-penalty";
    penaltyEl.textContent = `Штраф: ${item.penalty}`;
    info.append(penaltyEl);
  }
  if (item.bonus && item.bonus !== "-") {
    const bonusEl = document.createElement("div");
    bonusEl.className = "picker-item-bonus";
    bonusEl.textContent = `Бонус: ${item.bonus}`;
    info.append(bonusEl);
  }
  info.append(desc);
}

function appendEdgePickerContent({ row, info, item, name, meta, desc }) {
  const nameRow = document.createElement("div");
  nameRow.className = "hindrance-name-row";
  const rankBadge = createPickerEdgeRankBadge(item);
  if (rankBadge) nameRow.append(name, rankBadge);
  else nameRow.append(name);
  info.append(nameRow);

  const edgeReq = createPickerEdgeRequirementBadge(item);
  if (edgeReq) info.append(edgeReq);
  info.append(meta, desc);

  if (item.archetype && ARCHETYPE_COLORS[item.archetype]) {
    const color = ARCHETYPE_COLORS[item.archetype];
    row.style.background = color.tint;
    row.style.borderLeft = `3px solid ${color.border}`;
    name.style.color = color.accent;
  }
}

function appendPowerPickerContent({ info, item, name, desc }) {
  const nameRow = document.createElement("div");
  nameRow.className = "hindrance-name-row";
  const rankBadge = document.createElement("span");
  rankBadge.className = `edge-rank-badge ${rankBadgeClass(item.rank)}`;
  rankBadge.textContent = item.rank;
  nameRow.append(name, rankBadge);

  const psBadge = document.createElement("span");
  psBadge.className = "power-ps-badge";
  psBadge.textContent = `${getPowerPoints(item)} ПС`;

  const powerParts = getPowerDisplayParts(item);
  const rangeLine = document.createElement("div");
  rangeLine.className = "picker-item-stat";
  rangeLine.textContent = `Дистанция: ${powerParts.range}`;

  const durationLine = document.createElement("div");
  durationLine.className = "picker-item-stat";
  durationLine.textContent = `Длительность: ${item.duration}`;

  info.append(nameRow, psBadge, rangeLine, durationLine, desc);
  const extraHtml = POWER_EXTRA_HTML[item.name];
  if (extraHtml) {
    const extra = document.createElement("div");
    extra.className = "power-ext";
    extra.innerHTML = extraHtml;
    info.append(extra);
  }
}

function appendPickerRowContent({ type, item, row, info, name, meta }) {
  if (type === "weapons") appendWeaponPickerStats(info, item);
  if (type === "armor") appendArmorPickerStats(info, item);

  const desc = document.createElement("div");
  desc.className = "picker-item-desc";
  if (type !== "weapons" && type !== "armor") desc.innerHTML = getCatalogDescription(item, type);

  if (type === "hindrances") {
    appendHindrancePickerContent({ row, info, item, name, desc });
  } else if (type === "edges") {
    appendEdgePickerContent({ row, info, item, name, meta, desc });
  } else if (type === "powers") {
    appendPowerPickerContent({ info, item, name, desc });
  } else if (type === "weapons") {
    info.append(name);
  } else if (type === "armor") {
    info.append(name, meta);
  } else {
    info.append(name, meta, desc);
  }
}
