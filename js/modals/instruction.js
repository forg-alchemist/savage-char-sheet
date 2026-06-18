// ── Instruction Panel ────────────────────────────────────────────────────────

const INSTR_PAGES = [
  {
    html: `
      <div class="instr-ornament">✦ &nbsp; ✦ &nbsp; ✦</div>
      <h2 class="instr-heading">Добро пожаловать, партнёр!</h2>
      <div class="instr-ornament">— &nbsp; ☠ &nbsp; —</div>
      <p>Вижу, ты решил окунуться в мир <strong>Дикого Запада</strong> — жестокого, пыльного и полного опасностей. Что ж, смелое решение. Здесь пули дешевле, чем обещания, виски льётся рекой, а удача крутится как барабан кольта.</p>
      <p>Этот лист — всё, что стоит между тобой и безымянной могилой где-то в прерии. Здесь записано всё, что делает тебя тем, кто ты есть: твои силы и умения, снаряжение и оружие, тёмные секреты и особые таланты.</p>
      <p>Листай стрелкой вправо — каждая страница расскажет об одной части листа. Не торопись, изучи всё как следует. Или торопись — в этих краях иногда важно.</p>
      <p>Только одно предупреждение: на полях <strong>Фронтира</strong> второй шанс бывает редко.</p>
      <p class="instr-tagline"><em>Удачи, стрелок. Она тебе понадобится.</em></p>
    `
  },
  {
    html: `
      <div class="instr-ornament">✦ &nbsp; ★ &nbsp; ✦</div>
      <h2 class="instr-heading">Кто ты, ковбой?</h2>
      <div class="instr-ornament">— &nbsp; ☠ &nbsp; —</div>
      <p>Прежде чем браться за стволы и дайсы, реши главное: <strong>кем ты хочешь быть</strong>. Безумным учёным, что использует души грешников - призрачную руду и кидает молнии из самодельной пушки? Картёжником-магом, играющим в покер с самим дьяволом — и всякий раз выигрывающим? Или метким стрелком, чья пуля находит цель раньше, чем враг успевает моргнуть?</p>
      <p>Это твой выбор, ковбой. Никто не скажет тебе как жить — в Дедландс каждый сам кузнец своей судьбы. И своей смерти, впрочем, тоже.</p>
      <p>Хочешь узнать, кем можно быть на Фронтире? Нажми <button type="button" class="instr-btn-mock instr-btn-mock--info" onclick="openArchetypeInfo()">ИНФО</button> — откроется карточка твоего архетипа.</p>
      <p>Хочешь посмотреть все <strong>Особые</strong> архетипы? Нажми <span class="instr-btn-mock instr-btn-mock--gold">ВСЕ АРХЕТИПЫ</span> внутри окна — и увидишь всех, кем можно стать на Фронтире. Листай влево и вправо, чтобы их изучить.</p>
      <figure class="instr-figure">
        <img src="assets/Screen/Screen10.png" class="instr-screen" alt="Особые архетипы" />
        <figcaption class="instr-caption">Нажми на изображение, чтобы увеличить</figcaption>
      </figure>
      <p class="instr-tip">Это именно <strong>Особые</strong> архетипы — ты не обязан быть ими. Но если всё-таки хочешь — возьми <strong>особый талант</strong> этого архетипа в разделе черт.</p>
      <p>Определился? Тогда загляни в черты — нажми <span class="instr-btn-mock">+ Добавить</span> в разделе <strong>Черты</strong>.</p>
      <p class="instr-step"><span class="instr-step-num">!</span><span><strong>Черты — это то, что делает тебя уникальным.</strong> Здесь не весь список существующих черт, а лишь те, что доступны тебе прямо сейчас. Ранг, характеристики и навыки — всё это влияет на то, что открыто.</span></p>
      <p class="instr-step"><span class="instr-step-num">!</span><span>Обрати особое внимание на <strong>требования</strong> каждой черты. Многие из них просят определённый уровень характеристики или навыка. Запомни или запиши — они понадобятся, когда будешь распределять карты.</span></p>
      <p class="instr-tip">Пока не бери черты — ещё рано. Мы сделаем это чуть позже.</p>
      <p class="instr-tagline"><em>Сначала — цель. Потом — путь к ней.</em></p>
    `
  },
  {
    html: `
      <div class="instr-ornament">✦ &nbsp; ♠ &nbsp; ✦</div>
      <h2 class="instr-heading">Расклад судьбы</h2>
      <div class="instr-ornament">— &nbsp; 🂠 &nbsp; —</div>
      <p>Эта механика следует правилу <strong>Охоты за джокером</strong> из Дедландс. Здесь судьба правит бал — семь карт из перетасованной колоды выпадают случайно, и именно они определят, каким уродился твой герой. Нажми <span class="instr-btn-mock">Сделать расклад</span> и прими то, что даровала тебе фортуна.</p>
      <figure class="instr-figure">
        <img src="assets/Screen/Screen1.png" class="instr-screen" alt="Расклад карт" />
        <figcaption class="instr-caption">Нажми на изображение, чтобы увеличить</figcaption>
      </figure>
      <p class="instr-step"><span class="instr-step-num">1</span><span>Перед тобой сразу откроются семь случайных карт из колоды. Изучи их — каждая станет основой одной из характеристик. Выбери карту, которую хочешь <strong>убрать</strong>: лучше пожертвовать слабой сейчас, пока есть выбор.</span></p>
      <p class="instr-step"><span class="instr-step-num">2</span><span><strong>Двойки и джокеры — неприкосновенны.</strong> Убрать их из расклада нельзя. Нашёл нужную жертву — подтверди. Ошибся — нажми «Выбрать заново».</span></p>
      <figure class="instr-figure">
        <img src="assets/Screen/Screen2.png" class="instr-screen" alt="Распределение карт" />
        <figcaption class="instr-caption">Нажми на изображение, чтобы увеличить</figcaption>
      </figure>
      <p class="instr-step"><span class="instr-step-num">3</span><span>Оставшиеся шесть карт перетащи по характеристикам — туда, где они нужнее. Одну карту обязательно отдай в <strong>Навыки</strong>: чем старше карта, тем больше очков получишь. Расставил всё как надо — жми «Подтвердить выбор».</span></p>
      <p class="instr-tip"><strong>Обрати внимание!</strong> На этапе распределения над каждым слотом есть краткое <strong>описание характеристики</strong>, а под картой — её <strong>числовое значение</strong>. Не игнорируй их — именно они помогут принять верное решение, куда положить ту или иную карту.</p>
      <p class="instr-tagline"><em>Карты розданы. Теперь только ты решаешь, как ими сыграть.</em></p>
    `
  },
  {
    html: `
      <div class="instr-ornament">✦ &nbsp; ✎ &nbsp; ✦</div>
      <h2 class="instr-heading">Пали только в яблочко!</h2>
      <div class="instr-ornament">— &nbsp; ☠ &nbsp; —</div>
      <p>Карты розданы, характеристики <strong>распределены</strong> — ни прибавить, ни убрать до следующего повышения ранга. Зато очки навыков остались в твоих руках. Следи за счётчиком:</p>
      <div class="instr-mock-field"><span class="instr-mock-label">Навыки</span><span class="instr-mock-value">0 / 12</span></div>
      <p class="instr-step"><span class="instr-step-num">!</span><span>Прокачка навыка <strong>до уровня связанной характеристики</strong> или ниже стоит <strong>1 очко</strong>. Шагнуть выше характеристики — уже <strong>2 очка</strong> за ступень. Считай наперёд.</span></p>
      <p class="instr-step"><span class="instr-step-num">!</span><span>Распорядись очками мудро — после подтверждения их нельзя будет изменить до повышения или без <strong>дополнительных очков изъянов</strong>.</span></p>
      <p class="instr-step"><span class="instr-step-num">!</span><span>Навыки нужны не только для требований черт — именно они определяют <strong>успех твоих проверок</strong> в игре. Не понимаешь, что скрывается за каждым названием? Наведи мышь — и <em>голос предков подскажет</em>, что даёт тебе каждый навык.</span></p>
      <p class="instr-tip"><strong>Помнишь о требованиях черт?</strong> Понимаю, уже пушки в руках и хочется палить — но придержи горячую кровь. Загляни ещё раз в черты и проверь, какие характеристики и навыки они требуют, <em>прежде чем</em> спустить очки вслепую.</p>
      <p class="instr-tagline"><em>Стреляй метко. Трать — рассудительно. Горячая голова хороша только в баре и петле.</em></p>
    `
  },
  {
    html: `
      <div class="instr-ornament">✦ &nbsp; ☠ &nbsp; ✦</div>
      <h2 class="instr-heading">Тёмная сторона монеты</h2>
      <div class="instr-ornament">— &nbsp; ✦ &nbsp; —</div>
      <figure class="instr-figure">
        <img src="assets/Screen/Screen3.png" class="instr-screen" alt="Навыки распределены" />
        <figcaption class="instr-caption">Нажми на изображение, чтобы увеличить</figcaption>
      </figure>
      <p>Амиго, ты распределил очки навыков — поздравляю! Твой персонаж уже на полпути к первой авантюре, первой перестрелке и, вполне возможно, первой пуле в бок.</p>
      <figure class="instr-figure">
        <img src="assets/Screen/Screen4.png" class="instr-screen" alt="Характеристики закрыты" />
        <figcaption class="instr-caption">Нажми на изображение, чтобы увеличить</figcaption>
      </figure>
      <p>Как видишь, навыки и характеристики теперь <strong>закрыты</strong>. Но не спеши закрывать лист — у тебя есть ещё один козырь в рукаве.</p>
      <p><strong>Изъяны</strong> — это слабости, пороки и тёмные страницы прошлого твоего героя. Каждый из них делает тебя уязвимее, зато приносит <strong>дополнительные очки</strong>: мелкий изъян — <strong>1 очко</strong>, крупный — <strong>2 очка</strong>. Максимум можно получить <strong>4 очка</strong> таким путём.</p>
      <p>А куда их тратить? Вот расклад:</p>
      <p class="instr-step"><span class="instr-step-num">1</span><span>За <strong>1 очко</strong>: поднять навык на ступень или взять новый навык.</span></p>
      <p class="instr-step"><span class="instr-step-num">2</span><span>За <strong>2 очка</strong>: поднять характеристику на 1 ступень выше или взять новую черту. Недурно, да?</span></p>
      <figure class="instr-figure">
        <img src="assets/Screen/Screen5.png" class="instr-screen" alt="Окно изъянов" />
        <figcaption class="instr-caption">Нажми на изображение, чтобы увеличить</figcaption>
      </figure>
      <p class="instr-tip">Очки прибавятся <strong>в момент нажатия «Завершить»</strong> в окне выбора изъянов. После этого изъяны заблокируются — изменить их не получится без повышения ранга или доброй воли маршала.</p>
      <figure class="instr-figure">
        <img src="assets/Screen/Screen6.png" class="instr-screen" alt="Заблокированные изъяны" />
        <figcaption class="instr-caption">Нажми на изображение, чтобы увеличить</figcaption>
      </figure>
      <p>Все свои дополнительные очки ты сможешь увидеть в этом поле:</p>
      <div class="instr-mock-field"><span class="instr-mock-label">Доп. очки</span><span class="instr-mock-value">0</span></div>
      <p class="instr-tagline"><em>У каждого героя есть тёмная сторона. Пусть она поработает, как и дурная репутация на Фронтире — тебе во благо.</em></p>
    `
  },
  {
    html: `
      <div class="instr-ornament">✦ &nbsp; ★ &nbsp; ✦</div>
      <h2 class="instr-heading">Час особенных</h2>
      <div class="instr-ornament">— &nbsp; ☠ &nbsp; —</div>
      <p>Пришло время заявить о себе. <strong>Черты</strong> — это то, что выделяет тебя из толпы стрелков, бандитов и искателей приключений. Нужная черта откроет двери, которые для других наглухо закрыты. Чего же ты ждёшь?</p>
      <p>Нажми <span class="instr-btn-mock">+ Добавить</span> в разделе <strong>Черты</strong> и выбери то, что сделает тебя легендой — или хотя бы даст шанс ею стать.</p>
      <p class="instr-step"><span class="instr-step-num">!</span><span><strong>Первая черта — бесплатна.</strong> Ты же человек, помнишь? Это твоё наследие по праву рождения. А вот каждая следующая будет стоить <strong>2 дополнительных очка</strong> из тех, что принесли изъяны. Магия вуду — не иначе!</span></p>
      <p class="instr-step"><span class="instr-step-num">!</span><span>Выбрал всё что хотел — нажми <span class="instr-btn-mock" style="font-size:0.7rem;padding:1px 7px;">Завершить</span> в окне черт. Без этого они не будут работать. Или ты думал, что сделка с маниту заключается сама по себе? Глупые идеи оставь на потом.</span></p>
      <figure class="instr-figure">
        <img src="assets/Screen/Screen7.png" class="instr-screen" alt="Черты заблокированы" />
        <figcaption class="instr-caption">Нажми на изображение, чтобы увеличить</figcaption>
      </figure>
      <p>После завершения черты <strong>заблокируются</strong> — добавить новые получится только при повышении ранга.</p>
      <p class="instr-tagline"><em>Особенный говоришь? Ну-ну, давай посмотрим что у тебя там? Вскрывай расклад!</em></p>
    `
  },
  {
    html: `
      <div class="instr-ornament">✦ &nbsp; ☠ &nbsp; ✦</div>
      <h2 class="instr-heading">Зов неведомого</h2>
      <div class="instr-ornament">— &nbsp; ★ &nbsp; —</div>
      <p>Ты решил быть не просто ковбоем, а человеком с талантом заглядывать в мистические силы? Что ж — большая сила, большая опасность, большая ответственность. Источники сил на Фронтире редко доброжелательны. Но теперь мы в этой лодке.</p>
      <p>Зайди в раздел <strong>Силы</strong> и нажми <span class="instr-btn-mock">+ Добавить</span>.</p>
      <p>Здесь ты увидишь силы, доступные твоему архетипу и рангу.</p>
      <figure class="instr-figure">
        <img src="assets/Screen/Screen8.png" class="instr-screen" alt="Список сил" />
        <figcaption class="instr-caption">Нажми на изображение, чтобы увеличить</figcaption>
      </figure>
      <p>Выбери те проявления силы, что тебе доступны, — в соответствии с максимумом своих Пунктов Силы. Сколько их у тебя — всегда можно подсмотреть вот в этом блоке:</p>
      <figure class="instr-figure">
        <img src="assets/Screen/Screen9.png" class="instr-screen" alt="Блок пунктов силы" />
        <figcaption class="instr-caption">Нажми на изображение, чтобы увеличить</figcaption>
      </figure>
      <p class="instr-tip">Не переживай о предупреждении — если нажмёшь <strong>Закончить выбор</strong> раньше времени, силы заблокируются только тогда, когда достигнут максимума. Так что можно возвращаться и добирать.</p>
      <p>Взял все силы на максимум? Жми <span class="instr-btn-mock instr-btn-mock--green" style="font-size:0.7rem;padding:1px 7px;">Закончить выбор</span>. Теперь маршал будет видеть, что ты готов к приключению.</p>
      <p class="instr-step"><span class="instr-step-num">!</span><span>Будь аккуратен — новые силы ты сможешь получить лишь с чертой <strong>Новые силы</strong>.</span></p>
      <p class="instr-tagline"><em>Мистический дар всегда даёт тебе ступить за грань. Постарайся, чтобы эта дверь не закрылась и не стала твоей темницей.</em></p>
    `
  },
  {
    html: `
      <div class="instr-ornament">✦ &nbsp; ★ &nbsp; ✦</div>
      <h2 class="instr-heading">Снаряжение и стволы</h2>
      <div class="instr-ornament">— &nbsp; ☠ &nbsp; —</div>
      <p>Осталось немного. Я знаю — горячая кровь бурлит, поводья натянуты, а палец лежит на курке верного кольта. Кстати о нём. Где твоя лошадь, оружие и снаряжение? Давай всё и купим.</p>
      <p>Как видишь, тебе выпало <strong>$250</strong> — или даже больше, если ты взял черту <strong>Богатство</strong> или <strong>Богатство+</strong>. Не знаю, где ты их взял: бабушка прислала наследство из Нью-Мехико, заработал на охоте за головами или ограбил дилижанс — это неважно. Давай пустим их в дело.</p>
      <p>Ниже блока <span style="color:#5b9bd5;font-weight:700;">Силы</span> ты найдёшь разделы <strong>Оружие</strong>, <strong>Броня</strong> и <strong>Снаряжение</strong>. Настало время покупать!</p>
      <p class="instr-step"><span class="instr-step-num">!</span><span>В блоке оружия вверху — категории. Листай их влево и вправо, чтобы найти нужное.</span></p>
      <figure class="instr-figure">
        <img src="assets/Screen/Screen11.png" class="instr-screen" alt="Пикер оружия" />
        <figcaption class="instr-caption">Нажми на изображение, чтобы увеличить</figcaption>
      </figure>
      <p>Деньги спишутся со счёта автоматически при каждой покупке — тебе будет предложен выбор способа. В окне выбора оружия всегда виден твой кошелёк — он подскажет, когда пора остановиться. И не забудь купить <strong>патроны</strong> — палить пустотой, конечно, весело, но смертельно опасно в этих краях.</p>
      <p class="instr-step"><span class="instr-step-num">!</span><span>Броня требует определённую <strong>силу</strong>, зато даёт защиту. Следи за весом — бесконечно нагружаться не получится. Всё, чего нет в списках — смело вноси в раздел <strong>Снаряжение</strong>.</span></p>
      <p class="instr-tip"><strong>Самое главное!</strong> Не забудь купить лошадь — ты же не хочешь все прерии исходить на своих двоих. Нажми на иконку <img src="assets/Horse/Horse.png" class="instr-horse-icon" alt="Лошадь" /> в верхней части листа — откроется окно покупки.</p>
      <div class="instr-ornament" style="margin: 18px 0 10px;">— &nbsp; ✦ &nbsp; —</div>
      <p>Ты же не думал, что так легко отделаешься и будешь покупать всё за бесценок? За всё надо платить — и эта плата будет серьёзной.</p>
      <p class="instr-step"><span class="instr-step-num">⚠</span><span><strong>Оружие за полцены</strong> ты купил у сомнительного барыги где-то в дилижансе на краю мира. Оно выглядит истрёпанным и видавшим виды. При каждом <strong>Осложнении (1)</strong> на кубике — оно будет выдавать сюрпризы, вплоть до того, что просто рассыплется у тебя в руках.</span></p>
      <p class="instr-step"><span class="instr-step-num">⚠</span><span><strong>Лошадь за полцены</strong> — а там всё написано. Она получит <strong>2 изъяна</strong>. Взял её на сдачу на колбасном заводе — вот и получай.</span></p>
      <p class="instr-tagline"><em>Хорошее снаряжение — половина выживания. Вторая половина — удача. Молись, чтобы обе были при тебе.</em></p>
    `
  },
  {
    html: `
      <div class="instr-ornament">✦ &nbsp; ★ &nbsp; ✦</div>
      <h2 class="instr-heading">Вот и познакомились</h2>
      <div class="instr-ornament">— &nbsp; ☠ &nbsp; —</div>
      <p>Ну вот мы и закончили, партнёр. Дело сделано, ты полностью готов! А кстати, как тебя зовут? Ты бы хоть представился, а то, может, ещё не раз пересечёмся на землях Дикого Запада. Впиши своё имя вот сюда:</p>
      <p><input readonly class="instr-name-field" placeholder="Безымянный стрелок" /></p>
      <p>Ну вот и познакомились! Правда, я плоховато вижу — годы выпивки и пальбы в тёмных салунах дают о себе знать. Загрузи свой портрет, чтобы я мог получше тебя рассмотреть. Да не переживай, это не на плакат «Разыскивается живым или мёртвым»!</p>
      <p>Ну, теперь ты точно собран и заряжен. Вперёд, к приключениям!</p>
      <p class="instr-step"><span class="instr-step-num">!</span><span>И не забудь сохранить персонажа на всякий случай — нажми <span class="instr-btn-mock">Экспорт персонажа</span>. Так и твой Маршал сможет на тебя глянуть, если скинешь ему файл, или даже подправит что-нибудь, вернув файл обратно.</span></p>
      <p class="instr-step"><span class="instr-step-num">!</span><span>Если же тебе больше по душе старая добрая бумажная классика — <span class="instr-btn-mock">Печать PDF</span> всегда к твоим услугам.</span></p>
      <p class="instr-tagline"><em>Затягивай подпругу, проверяй барабан и прыгай в седло. Твоя история на Диких Землях начинается прямо сейчас!</em></p>
    `
  }
];

let instrCurrentPage = 0;

function readRootPx(name) {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || 0;
}

function updateSheetScale() {
  const designWidth = readRootPx('--sheet-design-width') || 1360;
  const panelWidth = readRootPx('--instruction-panel-width') || 264;
  const panelGap = readRootPx('--instruction-panel-gap') || 20;
  const buttonGutter = readRootPx('--instruction-button-gutter') || 96;
  const instructionOpen = document.body.classList.contains('instruction-open');
  const panelReserve = panelWidth + panelGap;
  // При закрытой панели резервируем гаттер с ОБЕИХ сторон, иначе лист
  // невозможно отцентрировать: места хватает только слева, и весь остаток
  // уходит вправо (лист прижат влево). При открытой панели лист сдвигается
  // вправо от неё.
  const sideReserve = instructionOpen ? panelReserve : buttonGutter * 2;
  const availableWidth = Math.max(1, window.innerWidth - sideReserve);
  const scale = Math.min(1, availableWidth / designWidth);
  const scaledWidth = designWidth * scale;
  const renderedLeft = instructionOpen
    ? panelReserve
    : Math.max(buttonGutter, (window.innerWidth - scaledWidth) / 2);
  // margin-left задаётся ДО zoom: zoom его домножит на scale, поэтому делим
  // на scale, чтобы фактический отступ на экране совпал с расчётным.
  const visualLeft = renderedLeft / scale;

  document.documentElement.style.setProperty('--sheet-scale', String(scale));
  document.documentElement.style.setProperty('--sheet-margin-left', `${visualLeft}px`);
}

function openInstruction() {
  const modal = document.getElementById('instruction-modal');
  const dialog = modal.querySelector('.instr-dialog');

  instrCurrentPage = 0;
  renderInstrPage();

  document.body.classList.add('instruction-open');
  updateSheetScale();
  modal.hidden = false;

  requestAnimationFrame(() => requestAnimationFrame(() => {
    dialog.classList.add('open');
  }));
}

function closeInstruction() {
  const modal = document.getElementById('instruction-modal');
  if (modal.hidden) return;
  const dialog = modal.querySelector('.instr-dialog');

  dialog.classList.remove('open');
  document.body.classList.remove('instruction-open');
  updateSheetScale();
  dialog.addEventListener('transitionend', () => { modal.hidden = true; }, { once: true });
}

function renderInstrPage() {
  const body = document.querySelector('.instr-body');
  const pageNum = document.querySelector('.instr-page-num');
  const prevBtn = document.querySelector('.instr-btn-prev');
  const nextBtn = document.querySelector('.instr-btn-next');

  body.innerHTML = INSTR_PAGES[instrCurrentPage].html;
  pageNum.textContent = `${instrCurrentPage + 1} / ${INSTR_PAGES.length}`;
  const nameField = body.querySelector('.instr-name-field');
  if (nameField) nameField.value = state.name || "";

  prevBtn.style.visibility = instrCurrentPage === 0 ? 'hidden' : '';
  prevBtn.disabled = instrCurrentPage === 0;
  nextBtn.disabled = instrCurrentPage >= INSTR_PAGES.length - 1;
}

window.addEventListener('resize', () => {
  updateSheetScale();
});

updateSheetScale();

document.querySelector('.instruction-btn').addEventListener('click', () => {
  const modal = document.getElementById('instruction-modal');
  if (modal.hidden) openInstruction();
  else closeInstruction();
});

document.getElementById('instruction-modal').addEventListener('click', e => {
  const action = e.target.closest('[data-action]')?.dataset.action;
  if (action === 'closeInstruction') { closeInstruction(); return; }
  if (action === 'instrPrev') {
    if (instrCurrentPage > 0) { instrCurrentPage--; renderInstrPage(); }
    return;
  }
  if (action === 'instrNext') {
    if (instrCurrentPage < INSTR_PAGES.length - 1) { instrCurrentPage++; renderInstrPage(); }
    return;
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (_instrLightboxOpen()) closeLightbox();
    else closeInstruction();
  }
});

// ── Lightbox ──────────────────────────────────────────────────────────────────

const _lightbox = (() => {
  const el = document.createElement('div');
  el.className = 'instr-lightbox';
  el.innerHTML = `
    <div class="instr-lb-backdrop"></div>
    <div class="instr-lb-content">
      <button type="button" class="instr-lb-close">×</button>
      <img class="instr-lb-img" src="" alt="" />
    </div>`;
  document.body.append(el);
  return el;
})();

function _instrLightboxOpen() {
  return _lightbox.classList.contains('instr-lb-open');
}

function openLightbox(src, alt) {
  _lightbox.querySelector('.instr-lb-img').src = src;
  _lightbox.querySelector('.instr-lb-img').alt = alt || '';
  _lightbox.classList.add('instr-lb-open');
}

function closeLightbox() {
  _lightbox.classList.remove('instr-lb-open');
}

_lightbox.addEventListener('click', e => {
  if (e.target.closest('.instr-lb-close') || !e.target.closest('.instr-lb-content') || e.target === _lightbox.querySelector('.instr-lb-backdrop')) {
    closeLightbox();
  }
});

_lightbox.querySelector('.instr-lb-backdrop').addEventListener('click', closeLightbox);

document.getElementById('instruction-modal').addEventListener('click', e => {
  const img = e.target.closest('.instr-screen');
  if (img) openLightbox(img.src, img.alt);
}, true);
