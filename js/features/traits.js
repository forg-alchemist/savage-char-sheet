function makeDieSvg(die) {
  return `
    <svg viewBox="0 0 32 28" aria-hidden="true" focusable="false">
      <polygon class="die-shape" points="${DICE_SHAPES[die]}"></polygon>
      <text x="16" y="18" text-anchor="middle">${die}</text>
    </svg>
    <span class="sr-only">d${die}</span>
  `;
}

function renderDiceTrack(root, value, { lockedMin, locked, allowedSet, onChange, minDie }) {
  root.replaceChildren();
  let current = lockedMin && (!value || value === "-") ? "d4" : value;
  // Жёсткий минимум кубика (напр. Характер d6 у Меченного)
  if (minDie && (!current || current === "-" || parseTrait(current).die < minDie)) current = `d${minDie}`;
  if (allowedSet) root.classList.add("dice-track--upgrade");

  DICE_VALUES.forEach((die) => {
    const dieValue = `d${die}`;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "die-button";
    button.dataset.die = dieValue;
    button.innerHTML = makeDieSvg(die);
    button.classList.toggle("active", current === dieValue);

    let enabled = allowedSet ? allowedSet.has(dieValue) : !locked;
    if (minDie && die < minDie) enabled = false;
    button.disabled = !enabled;
    if (allowedSet && allowedSet.has(dieValue) && dieValue !== current) {
      button.classList.add("die-button--upgrade");
    }

    if (enabled) {
      button.addEventListener("click", () => {
        const canDeselect = !lockedMin && current === dieValue && (!allowedSet || allowedSet.has("-"));
        const next = canDeselect ? "-" : dieValue;
        const prev = current;
        current = next;
        updateDiceTrackSelection(root, next);
        const result = onChange ? onChange(next) : undefined;
        if (result === false) {
          current = prev;
          updateDiceTrackSelection(root, prev);
        }
      });
    }
    root.append(button);
  });
}

function updateDiceTrackSelection(root, value) {
  root.querySelectorAll(".die-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.die === value);
  });
}

// Returns null if not in skill-advance mode,
// { qualifies: false } if skill doesn't qualify (should be locked),
// { qualifies: true, allowedSet: Set } if skill qualifies and can advance.
function getSkillAdvanceMode(skillDieStr, attrDieNum) {
  const ap = state.advancePending;
  if (!ap || (ap.type !== 'skill1' && ap.type !== 'skill2') || (ap.count || 0) <= 0) return null;

  const curDieNum = parseTrait(skillDieStr).die; // 0 if unlearned
  const curIdx = curDieNum === 0 ? -1 : DICE_VALUES.indexOf(curDieNum);
  const nextDieVal = DICE_VALUES[curIdx + 1];
  if (nextDieVal === undefined) return { qualifies: false }; // already at max

  let qualifies;
  if (ap.type === 'skill1') {
    qualifies = curDieNum > 0 && curDieNum >= attrDieNum;
  } else {
    qualifies = nextDieVal <= attrDieNum;
  }

  if (!qualifies) return { qualifies: false };

  return { qualifies: true, allowedSet: new Set([`d${nextDieVal}`]) };
}

function renderTraitBoard() {
  const root = document.querySelector("[data-trait-board]");
  root.replaceChildren();

  // Advance pending banner (placed in the parent .trait-board section)
  const traitSection = root.closest('.trait-board') || root.parentElement;
  const existingBanner = traitSection.querySelector('.adv-pending-banner');
  if (existingBanner) existingBanner.remove();

  const ap = state.advancePending;
  const isSupNatPending = !state.marshalMode && state.dealDone &&
    (state.selectedEdges || []).some(e => window.WK_EDGES?.SVERHNAT ? e.id === window.WK_EDGES.SVERHNAT : e.name === "Сверхъестественная характеристика") &&
    ((state.supNatAttr == null) || (state.supNatAttr.used || 0) < 2);
  const showBanner = (!state.marshalMode && ap && (ap.type === 'skill1' || ap.type === 'skill2' || ap.type === 'attribute'))
    || isSupNatPending;
  if (showBanner) {
    const banner = document.createElement('div');
    banner.className = 'adv-pending-banner';
    if (ap && ap.type === 'skill1') {
      banner.textContent = 'ПОВЫШЕНИЕ: выберите навык ≥ характеристики для подъёма на 1 ступень';
    } else if (ap && ap.type === 'skill2') {
      banner.textContent = `ПОВЫШЕНИЕ: выберите ${ap.count} навыка для подъёма на 1 ступень, не выше связанной характеристики (осталось: ${ap.count})`;
    } else if (ap && ap.type === 'attribute') {
      banner.textContent = 'ПОВЫШЕНИЕ: выберите характеристику для подъёма на 1 ступень';
    } else if (isSupNatPending) {
      const used = (state.supNatAttr || {}).used || 0;
      const remaining = 2 - used;
      const chosen = (state.supNatAttr || {}).chosen;
      if (chosen) {
        const chosenGroup = TRAIT_GROUPS.find(g => g.key === chosen);
        banner.textContent = `СВЕРХЪЕСТЕСТВЕННАЯ ХАРАКТЕРИСТИКА: поднимите «${chosenGroup?.title ?? chosen}» ещё раз (осталось: ${remaining})`;
      } else {
        banner.textContent = `СВЕРХЪЕСТЕСТВЕННАЯ ХАРАКТЕРИСТИКА: выберите характеристику для бесплатного подъёма (осталось: ${remaining})`;
      }
    }
    traitSection.insertBefore(banner, root);
  }

  const columns = [
    [TRAIT_GROUPS[0]],
    [TRAIT_GROUPS[1]],
    [TRAIT_GROUPS[2], TRAIT_GROUPS[4], TRAIT_GROUPS[3]],
  ];

  columns.forEach((groups) => {
    const column = document.createElement("section");
    column.className = "trait-column";
    groups.forEach((group) => column.append(renderTraitGroup(group)));
    root.append(column);
  });
}

function renderTraitGroup(group) {
  const section = document.createElement("section");
  section.className = "trait-group";
  section.append(renderAttributeRow(group));

  group.skills.forEach(([skillName, , description]) => {
    const skill = getSkill(skillName);
    if (skill && description && !skill.description) skill.description = description;
    section.append(renderSkillRow(skill));
  });

  const arcaneOptions = ARCANE_SKILLS[group.key];
  if (arcaneOptions) {
    if (!state.customSkills[group.key]) state.customSkills[group.key] = [];
    const activeSkillNames = [...new Set(
      computeArchetypes()
        .map(arch => ARCHETYPE_ARCANE_SKILL[arch])
        .filter(sk => sk && arcaneOptions.includes(sk))
    )];
    if (activeSkillNames.length > 0) {
      const activeSlots = activeSkillNames.map(skillName =>
        state.customSkills[group.key].find(s => s.name === skillName)
        || { name: skillName, die: "-" }
      );
      const inactiveSlots = state.customSkills[group.key].filter(
        s => arcaneOptions.includes(s.name) && !activeSkillNames.includes(s.name)
      );
      state.customSkills[group.key] = [...inactiveSlots, ...activeSlots];
      activeSlots.forEach((slot, i) =>
        section.append(renderArcaneSkillRow(slot, group.key, inactiveSlots.length + i, true))
      );
    }
    // else: no active arcane skills — keep state untouched so die values survive
  } else {
    (state.customSkills?.[group.key] || []).forEach((slot) => {
      section.append(renderCustomSkillRow(slot, group.key));
    });
  }

  return section;
}

function renderAttributeRow(group) {
  const row = document.createElement("article");
  row.className = "trait-line attribute-line";
  const track = document.createElement("div");
  track.className = "dice-track";
  const label = document.createElement("span");
  label.className = "trait-label";

  const canUpgrade = !!state.dealDone && (state.extraPoints || 0) >= 2;
  const currentDie = state.attributes[group.key] || "d4";
  const currentIdx = DICE_VALUES.indexOf(parseTrait(currentDie).die);
  const atMax = currentIdx === DICE_VALUES.length - 1;
  const bonus = (state.attrBonuses || {})[group.key] || 0;

  const hasSupNat = !state.marshalMode && state.dealDone &&
    (state.selectedEdges || []).some(e => window.WK_EDGES?.SVERHNAT ? e.id === window.WK_EDGES.SVERHNAT : e.name === "Сверхъестественная характеристика");
  const supNat = hasSupNat ? (state.supNatAttr || { chosen: null, used: 0 }) : null;
  const supNatActive = supNat && (supNat.used || 0) < 2;
  const supNatAvailHere = supNatActive && !atMax &&
    (supNat.chosen === null || supNat.chosen === group.key);

  label.textContent = bonus > 0 ? `${group.title} +${bonus}` : group.title;

  const slot = DIST_SLOTS.find(s => s.key === group.key);
  if (slot?.desc) label.dataset.tooltip = slot.desc;

  const ap = state.advancePending;
  const isAttrAdv = !state.marshalMode && ap && ap.type === 'attribute' && (ap.count || 0) > 0;

  let allowedSet = null;
  let fullyLocked;
  let attrOnChange;

  if (state.marshalMode) {
    fullyLocked = false;
    attrOnChange = (value) => { state.attributes[group.key] = value; commitSheetUpdate(); };
  } else if (!state.dealDone) {
    fullyLocked = false;
    attrOnChange = (value) => { state.attributes[group.key] = value; commitSheetUpdate(); };
  } else if (isAttrAdv) {
    if (atMax) {
      fullyLocked = true;
      attrOnChange = null;
    } else {
      fullyLocked = false;
      allowedSet = new Set([`d${DICE_VALUES[currentIdx + 1]}`]);
      attrOnChange = (value) => {
        state.attributes[group.key] = value;
        ap.count--;
        if (ap.count <= 0) state.advancePending = null;
        commitSheetUpdate();
      };
    }
  } else {
    if (supNatAvailHere) {
      fullyLocked = false;
      allowedSet = new Set([currentDie, `d${DICE_VALUES[currentIdx + 1]}`]);
      attrOnChange = (value) => {
        const prev = parseTrait(state.attributes[group.key]).die;
        state.attributes[group.key] = value;
        if (parseTrait(value).die > prev) {
          if (!state.supNatAttr) state.supNatAttr = { chosen: null, used: 0 };
          state.supNatAttr.chosen = group.key;
          state.supNatAttr.used = (state.supNatAttr.used || 0) + 1;
        }
        commitSheetUpdate();
      };
    } else if (canUpgrade && !atMax) {
      allowedSet = new Set([currentDie, `d${DICE_VALUES[currentIdx + 1]}`]);
      attrOnChange = (value) => {
        const prev = parseTrait(state.attributes[group.key]).die;
        state.attributes[group.key] = value;
        if (parseTrait(value).die > prev) {
          state.extraPoints = Math.max(0, (state.extraPoints || 0) - 2);
          setOutput("extraPoints", state.extraPoints);
          updateSkillBuyBtn();
        }
        commitSheetUpdate();
      };
      fullyLocked = false;
    } else {
      fullyLocked = true;
      attrOnChange = null;
    }
  }

  renderDiceTrack(track, currentDie, {
    lockedMin: true,
    locked: fullyLocked,
    allowedSet: state.marshalMode ? null : allowedSet,
    onChange: attrOnChange,
    minDie: (state.harrowed && group.key === "spirit") ? HARROWED_MIN_SPIRIT_NUM : undefined,
  });

  if (fullyLocked && !state.marshalMode) row.classList.add("attribute-locked");
  row.append(track, label);

  // +bonus button — only in normal post-deal mode, not in advance mode
  if (!state.marshalMode && !isAttrAdv && state.dealDone && canUpgrade && atMax) {
    const plusBtn = document.createElement("button");
    plusBtn.type = "button";
    plusBtn.className = "attr-plus-btn";
    plusBtn.textContent = "+";
    plusBtn.title = "Потратить 2 доп. очка (+1 к броску)";
    plusBtn.addEventListener("click", () => {
      if (!state.attrBonuses) state.attrBonuses = {};
      state.attrBonuses[group.key] = (state.attrBonuses[group.key] || 0) + 1;
      state.extraPoints = Math.max(0, (state.extraPoints || 0) - 2);
      setOutput("extraPoints", state.extraPoints);
      updateSkillBuyBtn();
      commitSheetUpdate();
    });
    row.append(plusBtn);
  }

  return row;
}

function renderSkillRow(skill) {
  const row = document.querySelector("#trait-row-template").content.firstElementChild.cloneNode(true);
  const input = row.querySelector(".trait-name-input");
  const track = row.querySelector("[data-dice-track]");

  const starred = isStarredSkill(skill);
  input.value = starred ? `★${skill.name}` : skill.name;
  input.readOnly = true;
  row.classList.toggle("starred", starred);
  if (skill.description) row.dataset.tooltip = skill.description;

  if (!state.marshalMode) {
    const attrKey = getSkillAttributeKey(skill.name);
    const attrDieNum = attrKey ? parseTrait(state.attributes[attrKey]).die : 4;
    const advMode = getSkillAdvanceMode(skill.die, attrDieNum);

    if (advMode !== null) {
      if (advMode.qualifies) {
        renderDiceTrack(track, skill.die, {
          lockedMin: starred,
          locked: false,
          allowedSet: advMode.allowedSet,
          onChange: (value) => {
            skill.die = value;
            const ap = state.advancePending;
            if (ap) {
              ap.count--;
              if (ap.count <= 0) state.advancePending = null;
            }
            commitSheetUpdate();
          },
        });
      } else {
        row.classList.add("skill-locked");
        renderDiceTrack(track, skill.die, {
          lockedMin: starred,
          locked: true,
        });
      }
      return row;
    }
  }

  const skillsLocked = !state.marshalMode && (isSkillCostCemented() || getTotalSkillSpend() >= (state.skillBudgetMax ?? 12));
  const canBuySkillDop = skillsLocked && !state.marshalMode && !!state.dealDone && (state.extraPoints || 0) >= 1;
  if (skillsLocked && !canBuySkillDop) row.classList.add("skill-locked");

  renderDiceTrack(track, skill.die, {
    lockedMin: !state.marshalMode && starred,
    locked: skillsLocked && !canBuySkillDop,
    onChange: (skillsLocked && !canBuySkillDop) ? null : (value) => {
      const attrKey = getSkillAttributeKey(skill.name);
      const attrDie = attrKey ? parseTrait(state.attributes[attrKey]).die : undefined;
      const delta = skillCost({ ...skill, die: value }, attrDie) - skillCost(skill, attrDie);
      if (!state.marshalMode && delta > 0) {
        if (skillsLocked) {
          if ((state.extraPoints || 0) < delta) { showToast("Недостаточно доп. очков"); return false; }
          state.extraPoints = Math.max(0, (state.extraPoints || 0) - delta);
          setOutput("extraPoints", state.extraPoints);
          updateSkillBuyBtn();
        } else if (getTotalSkillSpend() + delta > (state.skillBudgetMax ?? 12)) {
          showToast("Недостаточно очков навыков");
          return false;
        }
      }
      skill.die = value;
      if (!state.marshalMode && starred && skill.die === "-") skill.die = "d4";
      commitSheetUpdate();
    },
  });

  return row;
}

function renderCustomSkillRow(slot, groupKey) {
  const row = document.querySelector("#trait-row-template").content.firstElementChild.cloneNode(true);
  const input = row.querySelector(".trait-name-input");
  const track = row.querySelector("[data-dice-track]");

  row.classList.add("custom-skill");
  input.value = slot.name || "";
  input.readOnly = false;
  input.placeholder = "Навык…";
  input.addEventListener("input", () => {
    slot.name = input.value;
    commitSheetUpdate();
  });

  if (!state.marshalMode && groupKey) {
    const attrDieNum = parseTrait(state.attributes[groupKey]).die;
    const advMode = getSkillAdvanceMode(slot.die, attrDieNum);

    if (advMode !== null) {
      if (advMode.qualifies) {
        renderDiceTrack(track, slot.die, {
          lockedMin: false,
          locked: false,
          allowedSet: advMode.allowedSet,
          onChange: (value) => {
            slot.die = value;
            const ap = state.advancePending;
            if (ap) {
              ap.count--;
              if (ap.count <= 0) state.advancePending = null;
            }
            commitSheetUpdate();
          },
        });
      } else {
        row.classList.add("skill-locked");
        renderDiceTrack(track, slot.die, { lockedMin: false, locked: true });
      }
      return row;
    }
  }

  const skillsLocked = !state.marshalMode && (isSkillCostCemented() || getTotalSkillSpend() >= (state.skillBudgetMax ?? 12));
  const canBuyCustomDop = skillsLocked && !state.marshalMode && !!state.dealDone && (state.extraPoints || 0) >= 1;
  if (skillsLocked && !canBuyCustomDop) row.classList.add("skill-locked");

  renderDiceTrack(track, slot.die, {
    lockedMin: false,
    locked: skillsLocked && !canBuyCustomDop,
    onChange: (skillsLocked && !canBuyCustomDop) ? null : (value) => {
      const attrDie = parseTrait(state.attributes[groupKey]).die;
      const delta = customSkillCost({ die: value }, attrDie) - customSkillCost(slot, attrDie);
      if (!state.marshalMode && delta > 0) {
        if (skillsLocked) {
          if ((state.extraPoints || 0) < delta) { showToast("Недостаточно доп. очков"); return false; }
          state.extraPoints = Math.max(0, (state.extraPoints || 0) - delta);
          setOutput("extraPoints", state.extraPoints);
          updateSkillBuyBtn();
        } else if (getTotalSkillSpend() + delta > (state.skillBudgetMax ?? 12)) {
          showToast("Недостаточно очков навыков");
          return false;
        }
      }
      slot.die = value;
      commitSheetUpdate();
    },
  });

  return row;
}

function renderArcaneSkillRow(slot, groupKey, index, autoAssigned = false) {
  const row = document.querySelector("#trait-row-template").content.firstElementChild.cloneNode(true);
  const input = row.querySelector(".trait-name-input");
  const track = row.querySelector("[data-dice-track]");

  row.classList.add("arcane-skill");
  input.value = slot.name;
  input.readOnly = true;
  if (ARCANE_SKILL_DESCRIPTIONS[slot.name]) row.dataset.tooltip = ARCANE_SKILL_DESCRIPTIONS[slot.name];

  if (!state.marshalMode) {
    const attrDieNum = parseTrait(state.attributes[groupKey]).die;
    const advMode = getSkillAdvanceMode(slot.die, attrDieNum);

    if (advMode !== null) {
      if (advMode.qualifies) {
        renderDiceTrack(track, slot.die, {
          lockedMin: false,
          locked: false,
          allowedSet: advMode.allowedSet,
          onChange: (value) => {
            slot.die = value;
            const ap = state.advancePending;
            if (ap) {
              ap.count--;
              if (ap.count <= 0) state.advancePending = null;
            }
            commitSheetUpdate();
          },
        });
      } else {
        row.classList.add("skill-locked");
        renderDiceTrack(track, slot.die, { lockedMin: false, locked: true });
      }
      if (!autoAssigned) {
        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "arcane-remove";
        removeBtn.textContent = "×";
        removeBtn.addEventListener("click", () => {
          state.customSkills[groupKey].splice(index, 1);
          commitSheetUpdate();
        });
        row.append(removeBtn);
      }
      return row;
    }
  }

  const arcSkillsLocked = !state.marshalMode && (isSkillCostCemented() || getTotalSkillSpend() >= (state.skillBudgetMax ?? 12));
  const canBuyArcDop = arcSkillsLocked && !state.marshalMode && !!state.dealDone && (state.extraPoints || 0) >= 1;
  if (arcSkillsLocked && !canBuyArcDop) row.classList.add("skill-locked");

  renderDiceTrack(track, slot.die, {
    lockedMin: false,
    locked: arcSkillsLocked && !canBuyArcDop,
    onChange: (arcSkillsLocked && !canBuyArcDop) ? null : (value) => {
      const attrDie = parseTrait(state.attributes[groupKey]).die;
      const delta = customSkillCost({ die: value }, attrDie) - customSkillCost(slot, attrDie);
      if (!state.marshalMode && delta > 0) {
        if (arcSkillsLocked) {
          if ((state.extraPoints || 0) < delta) { showToast("Недостаточно доп. очков"); return false; }
          state.extraPoints = Math.max(0, (state.extraPoints || 0) - delta);
          setOutput("extraPoints", state.extraPoints);
          updateSkillBuyBtn();
        } else if (getTotalSkillSpend() + delta > (state.skillBudgetMax ?? 12)) {
          showToast("Недостаточно очков навыков");
          return false;
        }
      }
      slot.die = value;
      commitSheetUpdate();
    },
  });

  if (!autoAssigned) {
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "arcane-remove";
    removeBtn.textContent = "×";
    removeBtn.addEventListener("click", () => {
      state.customSkills[groupKey].splice(index, 1);
      commitSheetUpdate();
    });
    row.append(removeBtn);
  }

  return row;
}

// renderArcaneAddSelect removed — arcane skills are now auto-assigned by archetype
function renderArcaneAddSelect(remaining, groupKey) {
  const wrapper = document.createElement("div");
  wrapper.className = "arcane-add-row";

  const select = document.createElement("select");
  select.className = "arcane-select";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "— мистический навык —";
  select.append(placeholder);

  remaining.forEach((name) => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    select.append(opt);
  });

  select.addEventListener("change", () => {
    if (!select.value) return;
    if (!state.customSkills[groupKey]) state.customSkills[groupKey] = [];
    state.customSkills[groupKey].push({ name: select.value, die: "-" });
    commitSheetUpdate();
  });

  wrapper.append(select);
  return wrapper;
}
