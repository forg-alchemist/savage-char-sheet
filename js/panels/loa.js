const LOA_PANEL_COLOR = ARCHETYPE_COLORS["Вудуист"].accent;

const LOA_DATA = [
  {
    name: "Агве",
    type: "Рада лоа",
    art: "assets/Loa/Agve.png",
    description: "Владыка морей, океанов и покровитель всех мореходов. Агве обожает огнестрельное оружие и всё, что с ним связано. Он или одержимый им шуаль никогда не станет пренебрегать возможностью выстрелить из револьвера или ружья. Даже если выстрел будет сделан в воздух, Агве всё равно обрадуется самому его звуку.",
    ritual: "Наличие источника солёной воды или хотя бы сосуда с ней; Выстрелы из огнестрельного оружия; Шампанское.",
    chips: {
      white: "Шуаль начинает чувствовать себя как рыба в воде — все проверки атлетики для плавания считаются успешными, а шаг в воде увеличивается на 1.",
      red: "Агве помогает своему шуалю в морском путешествии — все проверки судовождения получают преимущество +4, кроме того шуаль может пройти проверку смекалки, чтобы заметить опасности в воде и своевременно их обойти.",
      blue: "Агве дарует своему шуалю возможность дышать под водой, также он получает +2 ко всем проверкам урона, пока находится в морской воде или на плывущем по морю корабле (этот эффект длится на протяжении одних суток)."
    }
  },
  {
    name: "Барон Самди",
    type: "Рада лоа",
    art: "assets/Loa/Samdi.png",
    description: "Покровитель кладбищ, мертвецов, похоти и большой любитель всевозможных утех. Барон много пьёт (обычно ром), курит сигары и любит общество красивых женщин. Самди — обладатель чёрного чувства юмора, безумного аппетита и задиристого характера. Барон способен защитить человека от смерти, не пропустив его душу на тот свет.",
    ritual: "Обилие алкоголя и тлеющего огня — например, от горящих сигар; Кладбище или кладбищенская земля; Крест.",
    chips: {
      white: "Шуаль способен излечить одно любое ранение (даже у персонажа-меченого).",
      red: "Вудуист способен поднять мертвеца и задать ему один любой вопрос, ответ на который должен быть односложным (да/нет).",
      blue: "В ближайшие 24 часа мертвецы не способны заметить шуаля и, соответственно, нанести ему вред (эта способность не действует на злых духов, принявших обличье умерших, например, суссет или меняющих кожу)."
    }
  },
  {
    name: "Босу Кубламин",
    type: "Петро лоа",
    art: "assets/Loa/BosuKublamin.png",
    description: "Жестокий лоа войны и победы над врагом. Босу Кубламин защищает своих приверженцев в ночное время, обычно его представляют в виде человека с тремя рогами, которые символизируют силу, дикость и жестокость. Вместе с тем, он и один из самых ненадёжных лоа, чьему слову рискуют доверять лишь в самом крайнем случае.",
    ritual: "Убийство свиньи; Ночь; Цепи.",
    chips: {
      white: "Пока шуаль одержим Босу Кубламином, он получает +2 при использовании навыков драки, метания или стрельбы.",
      red: "Шуаль получает три боевые черты по своему выбору (в соответствии со своим рангом) до тех пор, пока одержимость не проходит.",
      blue: "Любое ранение, нанесённое шуалем или шуалю в течение 2 дней после одержимости, вызывает кровотечение, персонаж в таком случае считается истекающим кровью, кроме того, сам шуаль получает модификатор +2 ко всем проверкам урона вне зависимости от типа оружия."
    }
  },
  {
    name: "Барон Семетьер",
    type: "Петро лоа",
    art: "assets/Loa/Cimetiere.png",
    description: "Одна из персонификаций смерти, страж перекрёстков загробного мира и родственник Барона Самди. Знает всё о произошедших в мире событиях, поскольку может расспросить любого из их непосредственных участников. Он охотно делится своими знаниями, не забывая отпускать жестокие шутки в сторону как своих «информаторов», так и собеседников. Опекает маленьких детей и помогает в случае их болезней. Вудуисты обращаются к нему за разрешением при создании зомби.",
    ritual: "Вещь, принадлежащая покойнику — остаётся в дар; Кофе или приготовленный с его использованием алкоголь; Кладбище или кладбищенская земля.",
    chips: {
      white: "Если его уговорить, Барон расскажет в подробностях правду об одном из событий прошлого (с большей вероятностью он согласится рассказать о каком-то масштабном событии).",
      red: "Недавно умерший (или находящийся при смерти) персонаж получает возможность вернуться с того света — он должен вытянуть две карты из колоды, если одна из них окажется старше 10 — он вернётся через d6 дней после смерти меченым, если джокером — обычным человеком, однако получает случайно выбранное помешательство.",
      blue: "Барон Семетьер насылает проклятье на одного из недругов своего шуаля — несчастный персонаж оказывается под воздействием силы Проклятье, при этом Барон автоматически проходит встречную проверку характера при сотворении заклинания, однако рассказывает жертве о том, кто её проклял."
    }
  },
  {
    name: "Дамбалла-Ведо",
    type: "Рада лоа",
    art: "assets/Loa/DamballaVedo.png",
    description: "Змеиный бог, древнейший из предков, хранящий мир от разрушения, отец всего и носитель мудрости, которую невозможно выразить словами. Вудуист, принявший в себя Дамбалла-Ведо, не может говорить, он способен лишь шипеть, повадками своими напоминая змею. Вместе с тем, Дамбалла-Ведо распространяет вокруг себя ауру уверенности и оптимизма. Сам он с трудом идёт на контакт с людьми и предпочитает в тишине наблюдать за происходящим.",
    ritual: "Белое яйцо; Живые змеи; Предметы из белого металла (серебра).",
    chips: {
      white: "Дамбалла-Ведо открывает своему шуалю тайну спрятанного неподалёку сокровища.",
      red: "На ближайшие 6 часов шуаль становится невосприимчивым к любым ядам вне зависимости от их происхождения (естественного, искусственного или магического). Если вудуист уже был отравлен, то действие яда только приостанавливается на эти 6 часов.",
      blue: "Вудуист становится гибким подобно змее — он автоматически проходит все проверки лазания, не получает урона при падении с высоты до 30 метров, а также способен протискиваться сквозь щели диаметром около 30 см."
    }
  },
  {
    name: "Мэтр Каррефур",
    type: "Петро лоа",
    art: "assets/Loa/MaitreCarrefour.png",
    description: "Владыка перекрёстков, покровитель колдунов и злых духов. Брат Папы Легба, Мэтр Каррефур является одним из самых опасных и могущественных лоа. В его присутствии никто не смеет говорить, пока он не разрешит. Он иногда помогает людям решить их проблемы, однако делает это так, как захочет сам, и редко когда находятся желающие узнать, как именно это произошло. Мэтр Каррефур является духом-трикстером и, будучи владыкой перекрёстков, знает сплетни обо всём, что происходит в мире.",
    ritual: "Перекрёсток; Листья деревьев; Тайна или информация, которую Мэтр Каррефур может не знать.",
    chips: {
      white: "Мэтр Каррефур рассказывает слухи о любом прошедшем недавно событии, однако в процессе или после этого оглашает самые сокровенные тайны собеседников.",
      red: "Мэтр Каррефур мгновенно изгоняет злого духа из тела, как если бы использовал силу экзорцизм — если в это тело ещё может вернуться дух предыдущего владельца, он возвращается через 3d6 дней. В случае, если это невозможно, в тело вселяется любой дух на усмотрение Маршала.",
      blue: "На протяжении следующих 7 дней у шуаля есть возможность использовать модификатор +2 ко всем проверкам вуду, однако в этом случае при любом осложнении (1) вудуист получает одно ранение от внезапно проявившегося злого духа, даже если потом он проходит проверку заново, потратив фишку."
    }
  },
  {
    name: "Огу",
    type: "Рада лоа",
    art: "assets/Loa/Ogou.png",
    description: "Дух-воин, покровитель огня, защитников и кузнечного дела. Огу — могущественен и силён, однако даже у него есть слабость — будучи покровителем огня, он не переносит воду. Впрочем, Огу с огромной радостью употребляет алкоголь, особенно — горящий. Шуаль, принявший в себя Огу, будет быстро и экспрессивно говорить (естественно, не заботясь о том, насколько внятно у него это получается), зачастую сквернословя и размахивая при этом руками или зажатым в руках оружием. Хоть он и не делает разницы между людьми, его почитающими, но скорее выберет себе в шуали кого-то похожего по характеру: вспыльчивого, яркого и экспрессивного персонажа, занимающегося кузнечным или военным делом.",
    ritual: "Открытый огонь; Холодное оружие; Обилие алкоголя (желательно горящий ром).",
    chips: {
      white: "Шуаль получает возможность игнорировать модификаторы от 1 ранения на протяжении всего времени одержимости.",
      red: "Огу показывает своё мастерство владения оружием, увеличивая один из боевых навыков: драка, метание или стрельба до d12+2 (эта способность действует только в течение одного боевого столкновения по выбору игрока).",
      blue: "Вудуист может игнорировать эффекты от двух ранений, а его стойкость повышается на 2 до тех пор, пока Огу не покинет тело."
    }
  },
  {
    name: "Локо",
    type: "Рада лоа",
    art: "assets/Loa/Loko.png",
    description: "Хранитель деревьев, природы и учитель всех, кто практикует лечение травами. Локо предпочитает излечивать раны, а не наносить их, поэтому каждый, принявший его в своё тело, получает изъян пацифизм (крупный) до тех пор, пока лоа не покинет его. Кроме того, человек, одержимый этим лоа, всегда будет курить трубку и носить с собой трость (даже если она не нужна ему для опоры). Локо — защитник справедливости, и он не терпит нечестных людей, поэтому часто его призывают в качестве судьи для разрешения споров или конфликтов.",
    ritual: "Живые растения; Мясо скота, завёрнутое в соломенные мешки; Трость.",
    chips: {
      white: "Шуаль может пройти через любую дикую местность, не оставив после себя ни единого следа.",
      red: "Вудуист может автоматически излечить любое количество ранений, тратя на каждое из них по одной фишке, у одного человека. Подъём при проверке навыка вуду, пройденной при ритуале призыва лоа, позволяет излечить ещё одного человека.",
      blue: "То же, что и при использовании красной фишки, однако теперь колдун может излечивать даже увечья, в том числе пришить и оторванную конечность, а также снимать помешательства."
    }
  },
  {
    name: "Симба",
    type: "Петро лоа",
    art: "assets/Loa/Simba.png",
    description: "Хранитель болот, рек и ручьёв, также оберегает морские побережья. Он весьма жесток, особенно по отношению к семейству рада лоа, представители которого изгнали его и морили голодом. Известны случаи, когда Симба крал играющих в воде детей и заставлял несколько лет служить себе, наделяя их в обмен даром предвидения опасности. Он постоянно изучает сверхъестественные болезни и способы их излечения.",
    ritual: "Источник пресной воды; Обильная еда; Оружие или медицинская литература.",
    chips: {
      white: "Симба может излечить одно любое заболевание, не связанное с изъяном немочь — ступени характеристик, потерянные в результате заболевания, восстановятся только естественным путём. Уровни усталости тоже снимаются естественным путём.",
      red: "Шуаль получает +4 к урону против любых людей, вставших на его пути, однако правило о невинных жертвах срабатывает при осложнении (1,2), а для дробовиков и автоматического оружия — при осложнении (1,2,3), этот результат нельзя отменить, даже потратив фишку.",
      blue: "В бою вудуист всегда действует раньше, чем его противники, однако он не может пропускать ход, в том числе для манёвров, например, прицеливания или глухой обороны."
    }
  },
  {
    name: "Эзили-Фреда-Дагомей",
    type: "Рада лоа",
    art: "assets/Loa/EziliFredaDahomey.png",
    description: "Покровительница красоты, богатства, добрых начинаний, мечтаний, а также зависти, мести и раздора. Эзили не является олицетворением каких-то сил природы, скорее представляет стремления людей, их мечты и надежды. В любом святилище всегда найдётся место, посвящённое ей. Это красивая, кокетливая белокожая дама. Осёдланные ею шуали всегда следят за своим внешним видом, красиво одеваются и флиртуют с мужчинами (вне зависимости от пола), что порой приводит к ряду неловких ситуаций, когда Эзили покидает тело.",
    ritual: "Зеркало; Драгоценности или красивая одежда — желательно красного или синего цвета; Сладости.",
    chips: {
      white: "Шуаль получает +4 к проверкам убеждения и выступления.",
      red: "Вудуист получает автоматический успех при проверке любого социального навыка. Эффект этой способности длится на протяжении 12 часов.",
      blue: "Любое существо, желающее нанести вред вудуисту, обязано пройти встречную проверку характера против его навыка вуду. При провале не может выполнить желаемого действия — этот эффект длится по 1 часу за каждую ступень навыка вуду колдуна."
    }
  },
  {
    name: "Папа Легба",
    type: "Рада лоа",
    art: "assets/Loa/PapaLegba.png",
    description: "Владыка дорог, хранитель храмов, домов и полей. Папа Легба даёт своё разрешение на общение с лоа, поэтому любой ритуал начинается с обращения к нему. У него множество лиц и образов, однако чаще всего он предстаёт в виде хромого старика с палкой, обладающего, впрочем, недюжинной силой. Папа Легба знает все языки и собирает новости от каждого путника, которого встретит в любом из миров. Вудуист, призывавший этого лоа в своё тело, корчится в судорогах. Он получает изъян хромота и теряет одну ступень ловкости (эти последствия проходят после сна длительностью 9 часов).",
    ritual: "Костыль; Овощи; Дорога или перекрёсток.",
    chips: {
      white: "В течение 12 часов вудуист способен общаться с другими людьми на любом существующем и уже известном им языке.",
      red: "Пока Легба присутствует в теле шуаля, тот способен открыть любой немагический замок простым прикосновением (в бою на это уходит один раунд).",
      blue: "Папа Легба существенно увеличивает физические способности своего избранного — на ближайших 3 часа его сила становится равной d12+2."
    }
  },
  {
    name: "Эрзули-Ян-Петро",
    type: "Петро лоа",
    art: "assets/Loa/ErzulieJanPetro.png",
    description: "Хранительница святилищ, жестоко и безжалостно карающая всех, кто вошёл в храм с недобрыми желаниями и намерениями. Любит духи, а также, хоть это и противоречиво — чистый и свежий воздух.",
    ritual: "Храм или дом вудуиста; Духи; Чистые помыслы.",
    chips: {
      white: "Эрзули-Ян-Петро позволяет снять шуалю с себя или товарища до 2 уровней усталости, если они находятся в вудуистском храме или доме.",
      red: "Все противники шуаля, если они пересекли порог его дома, попадают под действие силы Ужас.",
      blue: "Дом вудуиста становится надёжно защищён на ближайшие 24 часа от любого посягательства со стороны сверхъестественных созданий или сил — они не могут подойти к дому на расстояние ближе чем 4 метра. Эта способность не действует на неодушевлённые предметы, например, ножи или пули, если только они не зачарованы или являются проявлением сил."
    }
  }
];

// ── Modal refs ──────────────────────────────────────────────────────────────

let _loaModal       = null;
let _loaDialog      = null;
let _loaBodyEl      = null;
let _loaNameEl      = null;
let _loaTypeEl      = null;
let _loaFamilyEl    = null;
let _loaPrevBtn     = null;
let _loaNextBtn     = null;
let _loaPageInd     = null;
let _loaCurrentIdx = 0;

// ── Chip helpers ─────────────────────────────────────────────────────────────

// Used in the compact panel view (selected loa)
function _loaChipTable(chips) {
  return `<table class="loa-chip-table"><tbody>
<tr><td class="loa-chip loa-chip--white">БЕЛАЯ</td><td>${chips.white}</td></tr>
<tr><td class="loa-chip loa-chip--red">КРАСНАЯ</td><td>${chips.red}</td></tr>
<tr><td class="loa-chip loa-chip--blue">СИНЯЯ</td><td>${chips.blue}</td></tr>
</tbody></table>`;
}

// Used in the modal — visual chip tokens
function _chipRow(color, label, text) {
  return `<div class="loa-chip-row">
    <div class="loa-chip-token loa-chip-token--${color}">
      <span class="loa-chip-token-label">${label}</span>
    </div>
    <p class="loa-chip-row-text">${text.replace(/\.$/, "")}</p>
  </div>`;
}

function _loaChipTokens(chips) {
  return `<div class="loa-chip-rows">
    ${_chipRow('white', 'БЕЛАЯ', chips.white)}
    ${_chipRow('red', 'КРАСНАЯ', chips.red)}
    ${_chipRow('blue', 'СИНЯЯ', chips.blue)}
  </div>`;
}

// ── Modal rendering ─────────────────────────────────────────────────────────

function _renderLoaPage(idx) {
  _loaCurrentIdx = idx;
  const loa = LOA_DATA[idx];

  _loaNameEl.textContent = loa.name;
  _loaTypeEl.textContent = "";

  const isRada = loa.type.startsWith("Рада");
  const family = isRada ? "rada" : "petro";

  if (_loaFamilyEl) {
    _loaFamilyEl.textContent = loa.type;
    _loaFamilyEl.className = `loa-header-family loa-header-family--${family}`;
  }

  const artHtml = loa.art
    ? `<img src="${loa.art}" alt="${loa.name}" class="loa-modal-art" />`
    : `<div class="loa-art-placeholder"></div>`;

  const isSelected = state.selectedLoa === loa.name;
  const btnHtml = isSelected
    ? `<p class="loa-already-selected">— Этот Лоа выбран —</p>`
    : `<button type="button" class="loa-modal-select-btn" data-loa="${loa.name}">ВЫБРАТЬ ЛОА</button>`;

  const strip = s => s.replace(/\.$/, "");

  _loaBodyEl.innerHTML = `
    <div class="loa-modal-layout">
      <div class="loa-modal-art-col">
        ${artHtml}
        ${btnHtml}
      </div>
      <div class="loa-modal-content-col">
        <p class="loa-modal-p">${strip(loa.description)}</p>
        <div class="loa-ritual-box">
          <div class="loa-ritual-label">⚑ Требования к ритуалу</div>
          <p class="loa-ritual-text">${strip(loa.ritual)}</p>
        </div>
        <div class="loa-chips-label">Эффекты за фишки</div>
        ${_loaChipTokens(loa.chips)}
      </div>
    </div>`;

  _loaBodyEl.scrollTop = 0;

  _loaPageInd.textContent = `${idx + 1} / ${LOA_DATA.length}`;
  _loaPrevBtn.disabled = idx === 0;
  _loaNextBtn.disabled = idx === LOA_DATA.length - 1;
}

function openLoaModal(startIdx) {
  if (!_loaModal) return;
  _renderLoaPage(startIdx ?? 0);
  _loaModal.hidden = false;
  requestAnimationFrame(() => _loaDialog.classList.add("open"));
}

function _closeLoaModal() {
  if (!_loaModal) return;
  _loaDialog.classList.remove("open");
  setTimeout(() => { _loaModal.hidden = true; }, 280);
}

// ── Confirmation dialog ─────────────────────────────────────────────────────

function _openLoaConfirm(loa) {
  const ov = document.createElement("div");
  ov.className = "spirit-confirm-overlay";
  ov.style.zIndex = "1100";

  const box = document.createElement("div");
  box.className = "spirit-confirm-box";
  box.style.cssText = `border-color:${LOA_PANEL_COLOR};box-shadow:0 4px 32px rgba(58,92,26,0.55);max-width:460px;`;

  const msg = document.createElement("div");
  msg.className = "spirit-confirm-msg";
  msg.style.color = "#c8e6a0";
  msg.innerHTML = `Вы можете выбрать лишь одного Лоа!<br>
    Благоволит ли вам <strong style="color:#fff;font-size:1.05em">${loa.name}</strong>?`;

  const btns = document.createElement("div");
  btns.className = "spirit-raise-btns";
  btns.style.cssText = "flex-direction:column;gap:8px;";

  const yes = document.createElement("button");
  yes.type = "button";
  yes.className = "spirit-btn spirit-btn--yes";
  yes.style.cssText = `background:${LOA_PANEL_COLOR};border-color:${LOA_PANEL_COLOR};`;
  yes.textContent = "ДА, ЭТО МОЙ ВЫБОР";

  const no = document.createElement("button");
  no.type = "button";
  no.className = "spirit-btn spirit-btn--no";
  no.style.cssText = `border-color:${LOA_PANEL_COLOR};color:#c8e6a0;font-size:0.72rem;line-height:1.3;`;
  no.textContent = "НЕТ, Я ХОЧУ ЕЩЕ ПОБРОДИТЬ В ЗЕМЛЯХ ОХОТЫ";

  btns.append(yes, no);
  box.append(msg, btns);
  ov.append(box);
  document.body.append(ov);

  yes.addEventListener("click", () => {
    ov.remove();
    _closeLoaModal();
    _pickLoa(loa.name);
  });
  no.addEventListener("click", () => ov.remove());
  ov.addEventListener("click", e => { if (e.target === ov) ov.remove(); });
}

function _pickLoa(name) {
  state.selectedLoa = name;
  recalculate();
  scheduleSave();
}

// ── Panel rendering ─────────────────────────────────────────────────────────

function _loaSelectedView(loa) {
  const petro = !loa.type.startsWith("Рада");
  const strip = s => s.replace(/\.$/, "");
  const artHtml = loa.art
    ? `<img src="${loa.art}" alt="${loa.name}" class="loa-selected-art" />`
    : `<div class="loa-selected-art loa-selected-art--placeholder"></div>`;
  const marshalBtn = state.marshalMode
    ? `<button type="button" class="loa-reject-btn" id="btn-loa-reject">ОТВЕРГНУТЬ ЛОА</button>`
    : "";
  return `<div class="loa-selected-layout">
  ${artHtml}
  <div class="loa-selected-content">
    <div class="loa-card-head">
      <span class="loa-card-name">${loa.name}</span>
      <span class="loa-type-badge${petro ? " loa-type--petro" : ""}">${loa.type}</span>
    </div>
    <p class="loa-card-desc">${strip(loa.description)}</p>
    <div class="loa-ritual-box loa-ritual-box--compact">
      <div class="loa-ritual-label">⚑ Требования к ритуалу</div>
      <p class="loa-ritual-text">${strip(loa.ritual)}</p>
    </div>
    <div class="loa-chips-label">Эффекты за фишки</div>
    ${_loaChipTokens(loa.chips)}
    ${marshalBtn}
  </div>
  <div class="loa-sidebar" style="background:${LOA_PANEL_COLOR}">ЛОА</div>
</div>`;
}

function renderLoaPanel() {
  const section = document.getElementById("panel-loa");
  if (!section || section.hidden) return;

  if (state.selectedLoa) {
    if (section.dataset.loaShown === state.selectedLoa) return;
    const loa = LOA_DATA.find(l => l.name === state.selectedLoa);
    if (!loa) return;
    section.classList.add("loa-panel--selected");
    section.innerHTML = _loaSelectedView(loa);
    section.dataset.loaShown = state.selectedLoa;
  } else {
    if (!section.classList.contains("loa-panel--selected") && section.dataset.loaInit) return;
    section.classList.remove("loa-panel--selected");
    delete section.dataset.loaShown;
    section.innerHTML = `
      <p class="loa-intro-text">Каждый из лоа в вудуизме обладает собственным характером, планами и мотивами. Они являются персонифицированными духами предков, получившими возможность влиять на этот и потусторонний мир. Лоа разделены на два «семейства» («нанчон», как называют их в вудуизме) по свойствам своего характера — рада лоа и петро лоа. Первые наделены весёлым и доброжелательным нравом, вторые же — сварливы, жестоки и порой даже кровожадны, и чаще всего с ними нелегко договориться о сотрудничестве. Они не «хорошие» или «плохие» — они всегда нейтральны, а хорошие и плохие поступки совершают с их помощью люди. <em>Шуаль, тебе надо выбрать одного из Лоа, что ближе всего тебе по мотивам или пользе.</em></p>
      <button type="button" class="archetype-panel-btn" id="btn-loa"
        style="background:${LOA_PANEL_COLOR};box-shadow:inset 0 -2px 0 rgba(0,0,0,0.2)">ВЫБРАТЬ ЛОА</button>`;
    section.dataset.loaInit = "1";
  }
}

// ── Initialisation ──────────────────────────────────────────────────────────

function initLoaPanel() {
  _loaModal    = document.getElementById("loa-modal");
  _loaDialog   = document.getElementById("loa-dialog");
  _loaBodyEl   = document.getElementById("loa-modal-body");
  _loaNameEl   = document.getElementById("loa-modal-name");
  _loaTypeEl   = document.getElementById("loa-modal-type");
  _loaFamilyEl = document.getElementById("loa-header-family");
  if (!_loaModal) return;

  // Pager — inserted after subtitle
  const pager = document.createElement("div");
  pager.className = "atype-pager";
  pager.innerHTML =
    '<button type="button" class="atype-prev-btn" aria-label="Предыдущий">‹</button>' +
    '<span class="atype-page-indicator"></span>' +
    '<button type="button" class="atype-next-btn" aria-label="Следующий">›</button>';
  _loaTypeEl.after(pager);

  _loaPrevBtn = pager.querySelector(".atype-prev-btn");
  _loaNextBtn = pager.querySelector(".atype-next-btn");
  _loaPageInd = pager.querySelector(".atype-page-indicator");

  _loaPrevBtn.addEventListener("click", () => {
    if (_loaCurrentIdx > 0) _renderLoaPage(_loaCurrentIdx - 1);
  });
  _loaNextBtn.addEventListener("click", () => {
    if (_loaCurrentIdx < LOA_DATA.length - 1) _renderLoaPage(_loaCurrentIdx + 1);
  });

  // Select button (delegation)
  _loaBodyEl.addEventListener("click", e => {
    const btn = e.target.closest(".loa-modal-select-btn");
    if (btn) {
      const loa = LOA_DATA.find(l => l.name === btn.dataset.loa);
      if (loa) _openLoaConfirm(loa);
    }
  });

  // Close
  document.getElementById("loa-modal-close").addEventListener("click", _closeLoaModal);
  document.getElementById("loa-backdrop").addEventListener("click", _closeLoaModal);

  // ESC
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && _loaModal && !_loaModal.hidden) {
      e.stopImmediatePropagation();
      _closeLoaModal();
    }
  });

  // Panel button — event delegation on section
  const section = document.getElementById("panel-loa");
  if (section) {
    section.addEventListener("click", e => {
      if (e.target.closest("#btn-loa")) openLoaModal(0);
      if (e.target.closest("#btn-loa-reject")) {
        state.selectedLoa = null;
        delete section.dataset.loaShown;
        delete section.dataset.loaInit;
        section.classList.remove("loa-panel--selected");
        recalculate();
        scheduleSave();
        updateMarshalUI();
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", initLoaPanel);
