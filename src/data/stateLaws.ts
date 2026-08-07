export interface StateLawArticle {
  id: string;
  articleNumber: string;
  title: string;
  content: string;
}

export interface StateLaw {
  id: string;
  title: string;
  code: string;
  category: string;
  forumUrl?: string;
  articles: StateLawArticle[];
}

export const INITIAL_STATE_LAWS: StateLaw[] = [
  {
    id: 'uk_sa',
    title: 'Уголовно-административный кодекс Штата San Andreas',
    code: 'УАК-SA',
    category: 'Кодексы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-ugolovno-administrativnyi-kodeks-shtata-san-andreas.1973527/',
    articles: [
      {
        id: 'uk_1_1',
        articleNumber: 'Статья 1.1',
        title: 'Задачи и принципы Уголовно-административного кодекса',
        content: 'Уголовно-административный кодекс имеет своей задачей охрану прав и свобод человека и гражданина, собственности, общественного порядка и безопасности, а также конституционного строя Штата San Andreas от преступных посягательств.'
      },
      {
        id: 'uk_2_1',
        articleNumber: 'Статья 2.1',
        title: 'Умышленное нанесение телесных повреждений',
        content: 'Умышленное нанесение ударов, побоев или иных насильственных действий, причинивших физическую боль либо легкий вред здоровью, наказывается лишением свободы сроком до 2 лет или административным штрафом в размере до 15.000$.'
      },
      {
        id: 'uk_2_2',
        articleNumber: 'Статья 2.2',
        title: 'Умышленное причинение тяжкого вреда здоровью',
        content: 'Умышленное причинение тяжкого вреда здоровью, опасного для жизни человека, наказывается лишением свободы сроком до 4 лет с отбыванием наказания в исправительном учреждении.'
      },
      {
        id: 'uk_2_3',
        articleNumber: 'Статья 2.3',
        title: 'Убийство (умышленное причинение смерти человеку)',
        content: 'Убийство, то есть умышленное причинение смерти другому человеку, наказывается лишением свободы сроком до 6 лет без права на условно-досрочное освобождение (УДО).'
      },
      {
        id: 'uk_3_1',
        articleNumber: 'Статья 3.1',
        title: 'Кража и хищение чужого имущества',
        content: 'Тайное хищение чужого имущества (кража) наказывается лишением свободы сроком до 3 лет с возмещением причиненного ущерба.'
      },
      {
        id: 'uk_3_2',
        articleNumber: 'Статья 3.2',
        title: 'Грабеж и разбойное нападение',
        content: 'Открытое хищение чужого имущества, совершенное с применением насилия или угрозой его применения, наказывается лишением свободы сроком до 5 лет.'
      },
      {
        id: 'uk_3_3',
        articleNumber: 'Статья 3.3',
        title: 'Умышленное уничтожение или повреждение чужого имущества',
        content: 'Умышленное уничтожение или повреждение чужого имущества, повлекшее причинение значительного ущерба, наказывается лишением свободы сроком до 3 лет.'
      },
      {
        id: 'uk_4_1',
        articleNumber: 'Статья 4.1',
        title: 'Хулиганство и нарушение общественного порядка',
        content: 'Грубое нарушение общественного порядка, выражающее явное неуважение к обществу, сопровождающееся применением насилия либо угрозой его применения, наказывается лишением свободы сроком до 2 лет.'
      },
      {
        id: 'uk_4_2',
        articleNumber: 'Статья 4.2',
        title: 'Проникновение на закрытую или охраняемую территорию',
        content: 'Незаконное проникновение или нахождение на закрытой либо охраняемой территории государственных объектов наказывается лишением свободы сроком до 4 лет.'
      },
      {
        id: 'uk_5_1',
        articleNumber: 'Статья 5.1',
        title: 'Посягательство на жизнь сотрудника государственных органов',
        content: 'Посягательство на жизнь сотрудника правоохранительного органа, военнослужащего, а равно их близких в связи с исполнением ими своих служебных обязанностей наказывается лишением свободы сроком до 6 лет без права УДО.'
      },
      {
        id: 'uk_5_2',
        articleNumber: 'Статья 5.2',
        title: 'Применение насилия в отношении представителя власти',
        content: 'Применение насилия, не опасного для жизни или здоровья, либо угроза применения насилия в отношении представителя власти в связи с исполнением им своих должностных обязанностей наказывается лишением свободы сроком до 4 лет.'
      },
      {
        id: 'uk_5_3',
        articleNumber: 'Статья 5.3',
        title: 'Оскорбление представителя власти при исполнении',
        content: 'Публичное оскорбление представителя власти при исполнении им своих должностных обязанностей или в связи с их исполнением наказывается лишением свободы сроком до 2 лет либо штрафом до 25.000$.'
      },
      {
        id: 'uk_5_4',
        articleNumber: 'Статья 5.4',
        title: 'Неповиновение законному требованию сотрудника правоохранительных органов',
        content: 'Злостное неповиновение законному распоряжению или требованию сотрудника правоохранительных органов, военнослужащего при исполнении обязанностей по охране общественного порядка наказывается лишением свободы сроком до 3 лет.'
      },
      {
        id: 'uk_5_5',
        articleNumber: 'Статья 5.5',
        title: 'Дача взятки должностному лицу',
        content: 'Дача взятки должностному лицу лично или через посредника за совершение заведомо незаконных действий наказывается лишением свободы сроком до 4 лет.'
      },
      {
        id: 'uk_5_6',
        articleNumber: 'Статья 5.6',
        title: 'Получение взятки должностным лицом',
        content: 'Получение должностным лицом лично или через посредника взятки в виде денег, ценных бумаг или иного имущества наказывается лишением свободы сроком до 6 лет с увольнением с государственной службы и занесением в черный список.'
      },
      {
        id: 'uk_6_1',
        articleNumber: 'Статья 6.1',
        title: 'Незаконное приобретение, хранение или ношение оружия',
        content: 'Незаконное приобретение, передача, сбыт, хранение, перевозка или ношение огнестрельного оружия и боеприпасов наказываются лишением свободы сроком до 4 лет с изъятием лицензии и оружия.'
      },
      {
        id: 'uk_6_2',
        articleNumber: 'Статья 6.2',
        title: 'Незаконный сбыт оружия и спецсредств',
        content: 'Незаконный сбыт огнестрельного оружия, боеприпасов, спецсредств или взрывчатых веществ наказывается лишением свободы сроком до 5 лет.'
      },
      {
        id: 'uk_6_3',
        articleNumber: 'Статья 6.3',
        title: 'Незаконное хранение и сбыт наркотических веществ',
        content: 'Незаконные приобретение, хранение, перевозка, изготовление или сбыт наркотических средств в крупном размере наказывается лишением свободы сроком до 4 лет.'
      }
    ]
  },
  {
    id: 'pk_sa',
    title: 'Процессуальный кодекс Штата San Andreas',
    code: 'ПК-SA',
    category: 'Кодексы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-processualnyi-kodeks-shtata-san-andreas.1973524/',
    articles: [
      {
        id: 'pk_1_1',
        articleNumber: 'Статья 1.1',
        title: 'Назначение Процессуального кодекса',
        content: 'Процессуальный кодекс устанавливает порядок следственных, процессуальных и оперативно-розыскных действий при расследовании преступлений и правонарушений.'
      },
      {
        id: 'pk_2_1',
        articleNumber: 'Статья 2.1',
        title: 'Порядок и последовательность стадии задержания',
        content: 'Процесс задержания состоит из следующих последовательных шагов: 1) Представиться и предъявить служебное удостоверение / жетон; 2) Надеть наручники; 3) Разъяснить причину задержания; 4) Зачитать Правило Миранды; 5) Провести первичный обыск.'
      },
      {
        id: 'pk_2_2',
        articleNumber: 'Статья 2.2',
        title: 'Правило Миранды (Права задерживаемого)',
        content: 'Задерживаемому разъясняются его права: "Вы имеете право хранить молчание. Всё, что вы скажете, может и будет использовано против вас в суде. Вы имеете право на один телефонный звонок длительностью до 5 минут и право на адвоката."'
      },
      {
        id: 'pk_2_3',
        articleNumber: 'Статья 2.3',
        title: 'Основания для проведения обыска',
        content: 'Обыск лица или транспортного средства допускается при наличии ордера, либо в случае задержания лица на месте преступления, либо при введении режима военного/чрезвычайного положения.'
      },
      {
        id: 'pk_3_1',
        articleNumber: 'Статья 3.1',
        title: 'Порядок ареста и помещении в КПЗ / FP',
        content: 'Арест заключается в заполнении Data-Bank, составлении протокола задержания, фотографировании задержанного и водворении его в камеру предварительного заключения или Федеральную тюрьму.'
      },
      {
        id: 'pk_4_1',
        articleNumber: 'Статья 4.1',
        title: 'Порядок проведения допроса',
        content: 'Допрос проводится в специально оборудованном допросном помещении. Максимальная продолжительность допроса не может превышать 60 минут без перерыва.'
      }
    ]
  },
  {
    id: 'sud_sa',
    title: 'Судебный кодекс Штата San Andreas',
    code: 'СУД-SA',
    category: 'Кодексы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-sudebnyi-kodeks-shtata-san-andreas.1973420/',
    articles: [
      {
        id: 'sud_1_1',
        articleNumber: 'Статья 1.1',
        title: 'Судебная система Штата San Andreas',
        content: 'Судебная система состоит из Окружного суда (первая инстанция) и Верховного суда (высшая судебная инстанция и конституционный контроль).'
      },
      {
        id: 'sud_2_1',
        articleNumber: 'Статья 2.1',
        title: 'Порядок подачи искового заявления',
        content: 'Исковое заявление подается в специальный раздел портала Штата с соблюдением требований к форме, указанием ответчика, сутью нарушения и предоставлением доказательств.'
      },
      {
        id: 'sud_2_2',
        articleNumber: 'Статья 2.2',
        title: 'Принятие иска к производству и судебные повестки',
        content: 'Судья в течение 48 часов с момента подачи иска выносит определение о принятии иска к производству либо об отказе в принятии, и направляет повестки сторонам.'
      },
      {
        id: 'sud_3_1',
        articleNumber: 'Статья 3.1',
        title: 'Права и обязанности сторон в судебном процессе',
        content: 'Истец, Ответчик, Прокурор и Адвокат имеют право знакомиться с материалами дела, давать показания, заявлять ходатайства и задавать вопросы участникам.'
      }
    ]
  },
  {
    id: 'tk_sa',
    title: 'Трудовой кодекс Штата San Andreas',
    code: 'ТК-SA',
    category: 'Кодексы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-trudovoi-kodeks-shtata-san-andreas.1973484/',
    articles: [
      {
        id: 'tk_1_1',
        articleNumber: 'Статья 1.1',
        title: 'Рабочее время и график службы',
        content: 'Стандартное рабочее время в государственных организациях устанавливается внутренним регламентом, но не должно превышать 12 часов в сутки без перерыва.'
      },
      {
        id: 'tk_2_1',
        articleNumber: 'Статья 2.1',
        title: 'Порядок приема на работу и кадровых переводов',
        content: 'Прием на службу осуществляется на основании собеседования, проверки электронных заявок, прохождения медосмотра и отсутствия судимостей.'
      },
      {
        id: 'tk_3_1',
        articleNumber: 'Статья 3.1',
        title: 'Виды дисциплинарных взысканий',
        content: 'За нарушение трудовой дисциплины работодатель имеет право применить: 1) Устное предупреждение; 2) Выговор; 3) Строгий выговор; 4) Увольнение с понижением или без.'
      },
      {
        id: 'tk_4_1',
        articleNumber: 'Статья 4.1',
        title: 'Порядок обжалования незаконного увольнения',
        content: 'Сотрудник, считающий увольнение незаконным, имеет право обратиться с жалобой в Офис Генерального прокурора или с иском в Окружной суд в течение 7 дней.'
      }
    ]
  },
  {
    id: 'dk_sa',
    title: 'Дорожный кодекс Штата San Andreas',
    code: 'ДК-SA',
    category: 'Кодексы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-dorozhnyi-kodeks-shtata-san-andreas.1973482/',
    articles: [
      {
        id: 'dk_1_1',
        articleNumber: 'Статья 1.1',
        title: 'Ограничения скорости движения',
        content: 'Максимальная допустимая скорость движения: в пределах населенных пунктов — 60 км/ч; за пределами населенных пунктов и на шоссе — 120 км/ч.'
      },
      {
        id: 'dk_2_1',
        articleNumber: 'Статья 2.1',
        title: 'Правила остановки и парковки',
        content: 'Парковка транспортных средств разрешена только в специально отведенных местах или на правой обочине дороги. Парковка на тротуарах и газонах запрещена.'
      },
      {
        id: 'dk_3_1',
        articleNumber: 'Статья 3.1',
        title: 'Управление ТС в состоянии алкогольного или наркотического опьянения',
        content: 'Управление транспортным средством водителем, находящимся в состоянии опьянения, влечет штраф в размере 20.000$ и эвакуацию ТС.'
      },
      {
        id: 'dk_4_1',
        articleNumber: 'Статья 4.1',
        title: 'Оставление места дорожно-транспортного происшествия',
        content: 'Оставление водителем места ДТП, участником которого он являлся, наказывается административным штрафом до 15.000$ или лишением прав.'
      }
    ]
  },
  {
    id: 'ethic_sa',
    title: 'Этический кодекс Штата San Andreas',
    code: 'ETHIC-SA',
    category: 'Кодексы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-ehticheskii-kodeks-shtata-san-andreas.1973476/',
    articles: [
      {
        id: 'ethic_1_1',
        articleNumber: 'Статья 1.1',
        title: 'Дресс-код и внешний вид государственных служащих',
        content: 'Госслужащий при исполнении служебных обязанностей обязан носить установленную форму одежды или строгий деловой костюм. Запрещены татуировки на лице.'
      },
      {
        id: 'ethic_2_1',
        articleNumber: 'Статья 2.1',
        title: 'Стандарты общения и субординации',
        content: 'Госслужащий должен соблюдать вежливость, быть сдержанным и корректным при общении как с коллегами, так и с гражданами Штата.'
      }
    ]
  },
  {
    id: 'const_sa',
    title: 'Конституция Штата San Andreas',
    code: 'CONST-SA',
    category: 'Конституция',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-konstitucija-shtata-san-andreas.1973522/',
    articles: [
      {
        id: 'const_1_1',
        articleNumber: 'Статья 1.1',
        title: 'Права и свободы человека',
        content: 'Все люди по природе свободны и независимы и имеют неотчуждаемые права, среди которых — право на жизнь, свободу, собственность и стремление к счастью.'
      },
      {
        id: 'const_2_1',
        articleNumber: 'Статья 2.1',
        title: 'Разделение властей',
        content: 'Государственная власть в Штате San Andreas разделяется на Исполнительную (Губернатор и Правительство), Законодательную (Сенат) и Судебную (Суды).'
      }
    ]
  },
  {
    id: 'ogp_sa',
    title: 'Закон «О деятельности Офиса Генерального прокурора Штата San Andreas (Минюст)»',
    code: 'OGP-SA',
    category: 'Законы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-zakon-o-dejatelnosti-ofisa-generalnogo-prokurora-shtata-san-andreas-minjust.1973479/',
    articles: [
      {
        id: 'ogp_1_1',
        articleNumber: 'Статья 1.1',
        title: 'Статус Офиса Генерального прокурора',
        content: 'Офис Генерального прокурора — единая централизованная система органов, осуществляющих от имени Штата надзор за соблюдением Конституции и законов.'
      },
      {
        id: 'ogp_2_1',
        articleNumber: 'Статья 2.1',
        title: 'Полномочия прокуроров по проведению проверок и авторизации ордеров',
        content: 'Прокурор при предъявлении удостоверения имеет право беспрепятственно входить на территории государственных организаций для проведения надзорных проверок.'
      }
    ]
  },
  {
    id: 'fib_sa',
    title: 'Закон «О деятельности Федерального Расследовательского Бюро (FIB)»',
    code: 'FIB-SA',
    category: 'Законы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-zakon-o-dejatelnosti-federalnogo-rassledovatelskogo-bjuro-na-territorii-shtata-san-andreas-fib.1973438/',
    articles: [
      {
        id: 'fib_1_1',
        articleNumber: 'Статья 1.1',
        title: 'Статус и юрисдикция FIB',
        content: 'Федеральное Расследовательское Бюро (FIB) является федеральным правоохранительным органом и органом внутренней разведки Штата San Andreas.'
      },
      {
        id: 'fib_2_1',
        articleNumber: 'Статья 2.1',
        title: 'Основные направления деятельности FIB',
        content: 'Деятельность FIB осуществляется по направлениям: контрразведка, борьба с организованной преступностью, коррупцией, терактами и особо тяжкими преступлениями.'
      }
    ]
  },
  {
    id: 'police_sa',
    title: 'Закон «О деятельности региональных правоохранительных органов (LSPD / LSSD)»',
    code: 'POLICE-SA',
    category: 'Законы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-zakon-o-dejatelnosti-regionalnyx-pravooxranitelnyx-organov-na-territorii-shtata-san-andreas-lspd-lssd.1973467/',
    articles: [
      {
        id: 'police_1_1',
        articleNumber: 'Статья 1.1',
        title: 'Юрисдикции LSPD и LSSD',
        content: 'LSPD осуществляет правоохранительную деятельность в пределах юрисдикции города Лос-Сантос. LSSD осуществляет деятельность в пределах юрисдикции Округа Блейн.'
      }
    ]
  },
  {
    id: 'usss_sa',
    title: 'Закон «О деятельности Секретной службы на территории Штата San Andreas (USSS)»',
    code: 'USSS-SA',
    category: 'Законы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-zakon-o-dejatelnosti-sekretnoi-sluzhby-na-territorii-shtata-san-andreas-usss.1973490/',
    articles: [
      {
        id: 'usss_1_1',
        articleNumber: 'Статья 1.1',
        title: 'Охрана высших должностных лиц',
        content: 'Секретная служба (USSS) обеспечивает безопасность Губернатора, Вице-губернатора, Министров, Судей и защищает Здание Капитолия.'
      }
    ]
  },
  {
    id: 'sang_sa',
    title: 'Закон «О деятельности Национальной гвардии на территории Штата San Andreas (SANG)»',
    code: 'SANG-SA',
    category: 'Законы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-zakon-o-dejatelnosti-nacionalnoi-gvardii-na-territorii-shtata-san-andreas-sang.1973452/',
    articles: [
      {
        id: 'sang_1_1',
        articleNumber: 'Статья 1.1',
        title: 'Статус Национальной гвардии и Форта Занкудо',
        content: 'Национальная гвардия (SANG) является государственным вооруженным формированием, дислоцирующимся на территории закрытого военного объекта «Форт Занкудо».'
      }
    ]
  },
  {
    id: 'fp_sa',
    title: 'Закон «О деятельности Федеральной тюрьмы на территории Штата San Andreas (FP)»',
    code: 'FP-SA',
    category: 'Законы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-zakon-o-dejatelnosti-federalnoi-tjurmy-na-territorii-shtata-san-andreas-fp.1973460/',
    articles: [
      {
        id: 'fp_1_1',
        articleNumber: 'Статья 1.1',
        title: 'Режим охраны и конвоирования в Федеральной тюрьме',
        content: 'Федеральная тюрьма является режимным объектом. Охрана и содержание заключенных осуществляется сотрудниками департамента коррекции FP.'
      }
    ]
  },
  {
    id: 'bar_sa',
    title: 'Закон «О деятельности Коллегии адвокатов на территории Штата San Andreas»',
    code: 'BAR-SA',
    category: 'Законы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-zakon-o-dejatelnosti-kollegii-advokatov-na-territorii-shtata-san-andreas.1973494/',
    articles: [
      {
        id: 'bar_1_1',
        articleNumber: 'Статья 1.1',
        title: 'Права адвоката при оказании юридической помощи',
        content: 'Адвокат имеет право присутствовать при процессуальных действиях, допросе, обыске и оказывать правовую помощь задержанному доверителю.'
      }
    ]
  },
  {
    id: 'imm_sa',
    title: 'Закон «О статусе неприкосновенности должностных лиц на территории Штата San Andreas»',
    code: 'IMMUNITY-SA',
    category: 'Законы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-zakon-o-statuse-neprikosnovennosti-dolzhnostnyx-lic-na-territorii-shtata-san-andreas.1973431/',
    articles: [
      {
        id: 'imm_1_1',
        articleNumber: 'Статья 1.1',
        title: 'Виды неприкосновенности и порядок приостановления',
        content: 'Неприкосновенность выражается в невозможности задержания, обыска или привлечения к ответственности без ордера Генерального прокурора или решения Суда.'
      }
    ]
  },
  {
    id: 'weapon_sa',
    title: 'Закон «О регулировании оборота оружия, боеприпасов и спецсредств в Штате San Andreas»',
    code: 'WEAPON-SA',
    category: 'Законы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-zakon-o-regulirovanii-oborota-oruzhija-boepripasov-i-specsredstv-v-shtate-san-andreas.1973404/',
    articles: [
      {
        id: 'weapon_1_1',
        articleNumber: 'Статья 1.1',
        title: 'Правила хранения и ношения оружия',
        content: 'Гражданское оружие должно носиться исключительно в кобуре или зачехленном виде при наличии действующей медицинской карты и лицензии на оружие.'
      }
    ]
  },
  {
    id: 'terr_sa',
    title: 'Закон «О закрытых и охраняемых территориях в Штате San Andreas»',
    code: 'TERRITORY-SA',
    category: 'Законы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-zakon-o-zakrytyx-i-oxranjaemyx-territorijax-v-shtate-san-andreas.1973412/',
    articles: [
      {
        id: 'terr_1_1',
        articleNumber: 'Статья 1.1',
        title: 'Режим доступа в Зоны (Красная, Желтая, Зеленая)',
        content: 'Красная зона — территория повышенного режима охраны, проход гражданам без сопровождения запрещен и влечет немедленное задержание.'
      }
    ]
  },
  {
    id: 'secret_sa',
    title: 'Закон «О регулировании документации и системы служебной и государственной тайны»',
    code: 'SECRET-SA',
    category: 'Законы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-zakon-o-regulirovanii-dokumentacii-i-sistemy-sluzhebnoi-i-gosudarstvennoi-tainy.1973511/',
    articles: [
      {
        id: 'secret_1_1',
        articleNumber: 'Статья 1.1',
        title: 'Классификация секретной информации',
        content: 'К государственной тайне относятся сведения в области военной, разведывательной, оперативно-розыскной деятельности и расследований.'
      }
    ]
  },
  {
    id: 'minfin_sa',
    title: 'Закон «О Министерстве финансов Штата San Andreas»',
    code: 'MINFIN-SA',
    category: 'Законы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-zakon-o-ministerstve-finansov-shtata-san-andreas.1973496/',
    articles: [
      {
        id: 'minfin_1_1',
        articleNumber: 'Статья 1.1',
        title: 'Финансовые проверки и государственный аудит',
        content: 'Министерство финансов проводит регулярные аудит-проверки государственных структур и премирование отличившихся сотрудников.'
      }
    ]
  },
  {
    id: 'health_sa',
    title: 'Закон «О здравоохранении в Штате San Andreas»',
    code: 'HEALTH-SA',
    category: 'Законы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-zakon-o-zdravooxranenii-v-shtate-san-andreas.1973498/',
    articles: [
      {
        id: 'health_1_1',
        articleNumber: 'Статья 1.1',
        title: 'Выдача медицинских карт и оказание помощи',
        content: 'Каждый гражданин Штата имеет право на бесплатную скорую медицинскую помощь в стационарах EMS.'
      }
    ]
  },
  {
    id: 'biz_sa',
    title: 'Закон «О предпринимательской деятельности на территории Штата San Andreas»',
    code: 'BIZ-SA',
    category: 'Законы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-zakon-o-predprinimatelskoi-dejatelnosti-na-territorii-shtata-san-andreas.1973501/',
    articles: [
      {
        id: 'biz_1_1',
        articleNumber: 'Статья 1.1',
        title: 'Регистрация индивидуальных предпринимателей и предприятий',
        content: 'Все коммерческие организации обязаны зарегистрироваться в реестре Капитолия и оплачивать установленные государственные пошлины.'
      }
    ]
  },
  {
    id: 'dipl_sa',
    title: 'Закон «О дипломатических представительствах на территории Штата San Andreas»',
    code: 'DIPL-SA',
    category: 'Законы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-zakon-o-diplomaticheskix-predstavitelstvax-na-territorii-shtata-san-andreas.1973505/',
    articles: [
      {
        id: 'dipl_1_1',
        articleNumber: 'Статья 1.1',
        title: 'Дипломатическая неприкосновенность',
        content: 'Здания консульств и дипломатический транспорт пользуются экстерриториальностью и неприкосновенностью от досмотров.'
      }
    ]
  },
  {
    id: 'emerg_sa',
    title: 'Закон «О чрезвычайном и военном положении на территории Штата San Andreas»',
    code: 'EMERGENCY-SA',
    category: 'Законы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-zakon-o-chrezvychainom-i-voennom-polozhenii-na-territorii-shtata-san-andreas.1973507/',
    articles: [
      {
        id: 'emerg_1_1',
        articleNumber: 'Статья 1.1',
        title: 'Комендантский час и особые полномочия силовых структур',
        content: 'При введении комендантского часа силовые структуры имеют право задерживать лиц без документов до выяснения личности.'
      }
    ]
  },
  {
    id: 'smi_sa',
    title: 'Закон «О средствах массовой информации в Штате San Andreas»',
    code: 'SMI-SA',
    category: 'Законы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-zakon-o-sredstvax-ma-informacii-v-shtate-san-andreas.1973510/',
    articles: [
      {
        id: 'smi_1_1',
        articleNumber: 'Статья 1.1',
        title: 'Журналистское расследование и аккредитация',
        content: 'Журналисты имеющие государственную аккредитацию имеют право присутствовать на открытых заседаниях и брифингах.'
      }
    ]
  },
  {
    id: 'awards_sa',
    title: 'Закон «О наградах и знаках отличия на территории Штата San Andreas»',
    code: 'AWARDS-SA',
    category: 'Законы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-zakon-o-nagradax-i-znakax-otlichija-na-territorii-shtata-san-andreas.1973519/',
    articles: [
      {
        id: 'awards_1_1',
        articleNumber: 'Статья 1.1',
        title: 'Медали и ордена за мужество и отвагу',
        content: 'Высшей наградой Штата является Орден Почета San Andreas, вручаемый Губернатором Штата.'
      }
    ]
  },
  {
    id: 'gov_act_sa',
    title: 'Закон «О Правительстве Штата San Andreas»',
    code: 'GOV-SA',
    category: 'Законы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-zakon-o-pravitelstve-shtata-san-andreas.2255937/',
    articles: [
      {
        id: 'gov_1_1',
        articleNumber: 'Статья 1.1',
        title: 'Исполнительные Указы Губернатора',
        content: 'Губернатор издает Указы и Постановления, обязательные к исполнению на всей территории Штата San Andreas.'
      }
    ]
  },
  {
    id: 'minzdrav_act_sa',
    title: 'Закон «О Министерстве здравоохранения»',
    code: 'MINZDRAV-SA',
    category: 'Законы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-zakon-o-ministerstve-zdravooxranenija.3163668/',
    articles: [
      {
        id: 'minzdrav_1_1',
        articleNumber: 'Статья 1.1',
        title: 'Санитарные инспекции предприятий',
        content: 'Министерство здравоохранения осуществляет плановые санитарные проверки государственных организаций и коммерческих предприятий.'
      }
    ]
  },
  {
    id: 'dhs_act_sa',
    title: 'Закон «О Министерстве внутренней безопасности Штата San Andreas»',
    code: 'DHS-SA',
    category: 'Законы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-zakon-o-ministerstve-vnutrennei-bezopasnosti-shtata-san-andreas.3310661/',
    articles: [
      {
        id: 'dhs_1_1',
        articleNumber: 'Статья 1.1',
        title: 'Координация антитеррористической защиты',
        content: 'DHS руководит объединением силовых структур при устранении угроз национальной безопасности.'
      }
    ]
  },
  {
    id: 'nature_act_sa',
    title: 'Закон «Об охране природных ресурсов»',
    code: 'NATURE-SA',
    category: 'Законы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-zakon-ob-oxrane-prirodnyx-resursov.1973471/',
    articles: [
      {
        id: 'nature_1_1',
        articleNumber: 'Статья 1.1',
        title: 'Браконьерство и незаконная вырубка леса',
        content: 'Незаконная охота или отлов диких животных вне сезона охоты наказывается штрафом до 30.000$ и конфискацией снаряжения.'
      }
    ]
  },
  {
    id: 'rent_act_sa',
    title: 'Закон «Об аренде государственного имущества в Штате San Andreas»',
    code: 'RENT-SA',
    category: 'Законы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-zakon-ob-arende-gosudarstvennogo-imuschestva-v-shtate-san-andreas.1973434/',
    articles: [
      {
        id: 'rent_1_1',
        articleNumber: 'Статья 1.1',
        title: 'Аренда помещений и участков',
        content: 'Аренда государственного имущества допускается только по согласованию с Министерством финансов.'
      }
    ]
  },
  {
    id: 'parties_act_sa',
    title: 'Закон «О политических партиях Штата San Andreas»',
    code: 'PARTIES-SA',
    category: 'Законы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-zakon-o-politicheskix-partijax-shtata-san-andreas.1973392/',
    articles: [
      {
        id: 'parties_1_1',
        articleNumber: 'Статья 1.1',
        title: 'Предвыборная агитация и дебаты',
        content: 'Все зарегистрированные политические партии имеют равные права на проведение агитации и участие в предвыборных дебатах.'
      }
    ]
  },
  {
    id: 'interact_act_sa',
    title: 'Закон «О взаимодействии государственных структур и граждан на территории Штата San Andreas»',
    code: 'INTERACT-SA',
    category: 'Законы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-zakon-o-vzaimodeistvii-gosudarstvennyx-struktur-i-grazhdan-na-territorii-shtata-san-andreas.1973400/',
    articles: [
      {
        id: 'interact_1_1',
        articleNumber: 'Статья 1.1',
        title: 'Прием обращений и жалоба граждан',
        content: 'Госслужащие обязаны принимать обращения граждан в установленные приемные часы и оперативно реагировать на правонарушения.'
      }
    ]
  }
];

export const STATE_LAWS_KEY = 'legaldraft_custom_state_laws_v1';

export function getAllStateLaws(): StateLaw[] {
  const saved = localStorage.getItem(STATE_LAWS_KEY);
  if (saved) {
    try {
      const customLaws: StateLaw[] = JSON.parse(saved);
      const map = new Map<string, StateLaw>();
      INITIAL_STATE_LAWS.forEach((l) => map.set(l.id, l));
      customLaws.forEach((l) => map.set(l.id, l));
      return Array.from(map.values());
    } catch {
      // ignore
    }
  }
  return INITIAL_STATE_LAWS;
}

export function saveCustomStateLaw(newLaw: StateLaw): StateLaw[] {
  const saved = localStorage.getItem(STATE_LAWS_KEY);
  let customLaws: StateLaw[] = [];
  if (saved) {
    try {
      customLaws = JSON.parse(saved);
    } catch {
      customLaws = [];
    }
  }

  const existingIdx = customLaws.findIndex((l) => l.id === newLaw.id);
  if (existingIdx >= 0) {
    customLaws[existingIdx] = newLaw;
  } else {
    customLaws.push(newLaw);
  }

  localStorage.setItem(STATE_LAWS_KEY, JSON.stringify(customLaws));
  return getAllStateLaws();
}
