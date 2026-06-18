function parseTrait(value) {
  if (!value || value === "-") return { die: 0, mod: 0 };
  const match = String(value).match(/d(\d+)([+-]\d+)?/i);
  return {
    die: match ? Number(match[1]) : 0,
    mod: match?.[2] ? Number(match[2]) : 0,
  };
}

function normalizeName(value) {
  return String(value || "").trim().toLowerCase();
}

// Разрешение элемента каталога по объекту-с-id. Если у item есть id и он найден
// в CATALOG_BY_ID[type] — возвращает полный каталожный объект; иначе fallback
// (по умолчанию сам item). Заменяет повторявшийся по коду паттерн
// `(item.id && window.CATALOG_BY_ID?.[type]?.[item.id]) || item` (#12).
function resolveCatalogItem(type, item, fallback = item) {
  return (item?.id && window.CATALOG_BY_ID?.[type]?.[item.id]) || fallback;
}

function trimNumber(value) {
  return Number.isInteger(value) ? value : value.toFixed(1);
}

function traitSteps(value) {
  if (!value || value === "-") return 0;
  const { die, mod } = parseTrait(value);
  if (!die) return 0;
  return Math.max(0, (die - 4) / 2) + Math.max(0, mod);
}

function rankValue(rank) {
  if (typeof rank === "number") return rank;
  const index = RANK_ORDER.indexOf(rank);
  return index === -1 ? 1 : index + 1;
}

function rankName(rankNum) {
  return RANK_ORDER[(rankNum || 1) - 1] || RANK_ORDER[0];
}

function setOutput(name, value) {
  const element = document.querySelector(`[data-output="${name}"]`);
  if (element) element.textContent = value;
}

function isLoadOverLimit(weight, loadLimit) {
  return (Number(weight) || 0) - (Number(loadLimit) || 0) > 0.0001;
}

function renderLoadMeter(element, weight, loadLimit) {
  if (!element) return;
  const used = Math.max(0, Number(weight) || 0);
  const limit = Math.max(0, Number(loadLimit) || 0);
  const remaining = limit - used;
  const isOverLimit = isLoadOverLimit(used, limit);
  const isAtLimit = Math.abs(remaining) <= 0.0001 && limit > 0;
  const fill = limit > 0 ? Math.min(100, Math.max(0, (used / limit) * 100)) : (used > 0 ? 100 : 0);
  const fillRounded = Math.round(fill * 10) / 10;
  const usedText = trimNumber(used);
  const remainingText = trimNumber(remaining);
  const limitText = trimNumber(limit);
  const usedLabel = used > 0.0001
    ? `<span class="load-meter-segment load-meter-segment--used">ВЕС ${usedText}</span>`
    : "";
  const overloadLabel = isOverLimit
    ? `<span class="load-overload-badge">ПЕРЕГРУЗ!</span>`
    : "";

  element.classList.add("load-meter");
  element.classList.toggle("is-empty", used <= 0.0001);
  element.classList.toggle("over-budget", isOverLimit);
  element.classList.toggle("at-limit", isAtLimit);
  element.style.setProperty("--load-fill", `${fillRounded}%`);
  element.dataset.tooltip = `Вес: ${usedText}. Остаток: ${remainingText}. Комфортная нагрузка: ${limitText}.`
    + (isOverLimit ? " Перегруз: Шаг -1, Бег -1 ступень." : "");
  element.innerHTML = `
    <span class="load-meter-fill" aria-hidden="true"></span>
    ${usedLabel}
    <span class="load-meter-segment load-meter-segment--free">ОСТАТОК ${remainingText}</span>
    ${overloadLabel}
  `;
}

function showToast(message, { html = false } = {}) {
  const existing = document.getElementById("app-toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.id = "app-toast";
  toast.className = "toast-notification";
  // html: true — только для доверенных строк из кода (не пользовательский ввод)
  if (html) toast.innerHTML = message;
  else toast.textContent = message;
  document.body.append(toast);
  requestAnimationFrame(() => {
    toast.classList.add("toast-show");
    setTimeout(() => {
      toast.classList.remove("toast-show");
      setTimeout(() => toast.remove(), 250);
    }, 2000);
  });
}

function isStarredSkill(skill) {
  return Boolean(skill?.starred) || FREE_STARTING_SKILLS.has(normalizeName(skill?.name));
}

function getSkillAttributeKey(skillName) {
  const norm = normalizeName(skillName);
  for (const group of TRAIT_GROUPS) {
    for (const [sName] of group.skills) {
      if (normalizeName(sName) === norm) return group.key;
    }
  }
  return null;
}

function skillCost(skill, attrDieVal) {
  if (!skill.die || skill.die === "-") return 0;
  const d = parseTrait(skill.die).die;
  const cap = attrDieVal || Infinity;
  const within = Math.max(0, Math.floor((Math.min(d, cap) - 4) / 2));
  const above  = Math.max(0, Math.floor((d - Math.max(4, cap)) / 2));
  return (isStarredSkill(skill) ? 0 : 1) + within + above * 2;
}

function getHindrancePoints() {
  return (state.selectedHindrances || []).reduce((sum, item) => {
    if (item._auto) return sum;
    return sum + (item.degree === "Крупный" ? 2 : 1);
  }, 0);
}

function hindranceAvailable() {
  return Math.max(0, getHindrancePoints() - (state.hindranceSpent || 0));
}

function getSkill(name) {
  return state.skills.find((skill) => normalizeName(skill.name) === normalizeName(name));
}

function getSkillDie(name) {
  const skill = getSkill(name);
  return skill ? parseTrait(skill.die).die : 0;
}

// Стоимость кастомного навыка по текущей характеристике (база 1 + ступени;
// 1 очко за ступень ≤ характеристики, 2 за ступень выше). Невзятый навык = 0.
function customSkillCost(slot, attrDie) {
  if (!slot.die || slot.die === "-") return 0;
  const d = parseTrait(slot.die).die;
  const cap = attrDie || Infinity;
  const within = Math.max(0, Math.floor((Math.min(d, cap) - 4) / 2));
  const above  = Math.max(0, Math.floor((d - Math.max(4, cap)) / 2));
  return 1 + within + above * 2;
}

// Повышения начались, если ранг выше Новичка или взято хотя бы одно повышение
// в текущем ранге. С этого момента стоимость уже потраченных очков навыков
// замораживается — поднятие характеристик её не пересчитывает (не возвращает очки).
function isSkillCostCemented() {
  return (state.rank || 1) > 1 || (state.advanceChoices || []).some(Boolean);
}

function getCustomSkillSpendEntries() {
  const allArcaneSkillNames = new Set([
    ...(ARCANE_SKILLS.smarts || []),
    ...(ARCANE_SKILLS.spirit || []),
  ]);
  const activeArcaneSkills = new Set(
    computeArchetypes().map(arch => ARCHETYPE_ARCANE_SKILL[arch]).filter(Boolean)
  );

  return Object.entries(state.customSkills || {})
    .flatMap(([key, slots]) => slots
      .filter(s => s.die && s.die !== "-")
      .filter(s => !allArcaneSkillNames.has(s.name) || activeArcaneSkills.has(s.name))
      .map(s => ({ s, key }))
    );
}

function cementSkillStartSpend({ refresh = false } = {}) {
  (state.skills || []).forEach((skill) => {
    const key = getSkillAttributeKey(skill.name);
    const attrDie = key ? parseTrait(state.attributes[key]).die : undefined;
    if (refresh || skill._startSpend == null) skill._startSpend = skillCost(skill, attrDie);
  });

  getCustomSkillSpendEntries().forEach(({ s, key }) => {
    const attrDie = parseTrait(state.attributes[key]).die;
    if (refresh || s._startSpend == null) s._startSpend = customSkillCost(s, attrDie);
  });
}

function reconcileSkillStartSpend() {
  if (isSkillCostCemented()) cementSkillStartSpend();
}

function getTotalSkillSpend() {
  const cemented = isSkillCostCemented();

  const skillSteps = (state.skills || []).reduce((sum, skill) => {
    const key = getSkillAttributeKey(skill.name);
    const attrDie = key ? parseTrait(state.attributes[key]).die : undefined;
    const cost = cemented && skill._startSpend != null
      ? skill._startSpend
      : skillCost(skill, attrDie);
    return sum + cost;
  }, 0);

  const customSteps = getCustomSkillSpendEntries().reduce((sum, { s, key }) => {
    const attrDie = parseTrait(state.attributes[key]).die;
    const cost = cemented && s._startSpend != null
      ? s._startSpend
      : customSkillCost(s, attrDie);
    return sum + cost;
  }, 0);

  return skillSteps + customSteps;
}
