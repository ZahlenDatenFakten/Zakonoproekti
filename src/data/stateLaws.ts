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
        id: 'uk_5_1',
        articleNumber: 'Статья 5.1',
        title: 'Посягательство на жизнь сотрудника государственных органов',
        content: 'Посягательство на жизнь сотрудника правоохранительного органа, военнослужащего, а равно их близких в связи с исполнением ими своих служебных обязанностей наказывается лишением свободы сроком до 6 лет с отбыванием наказания в исправительном учреждении.'
      },
      {
        id: 'uk_5_2',
        articleNumber: 'Статья 5.2',
        title: 'Умышленное причинение тяжкого вреда здоровью',
        content: 'Умышленное причинение тяжкого вреда здоровью, опасного для жизни человека, наказывается лишением свободы сроком до 4 лет.'
      },
      {
        id: 'uk_10_1',
        articleNumber: 'Статья 10.1',
        title: 'Незаконное приобретение, передача, сбыт, хранение или ношение оружия',
        content: 'Незаконные приобретение, передача, сбыт, хранение, перевозка или ношение огнестрельного оружия наказываются лишением свободы сроком до 4 лет.'
      },
      {
        id: 'uk_12_1',
        articleNumber: 'Статья 12.1',
        title: 'Превышение должностных полномочий',
        content: 'Совершение должностным лицом действий, явно выходящих за пределы его полномочий, наказывается лишением свободы сроком до 5 лет.'
      }
    ]
  },
  {
    id: 'minfin',
    title: 'Закон «О Министерстве финансов Штата San Andreas»',
    code: 'MINFIN-SA',
    category: 'Законы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-zakon-o-ministerstve-finansov-shtata-san-andreas.1973496/',
    articles: [
      {
        id: 'minfin_1',
        articleNumber: 'Статья 1.1',
        title: 'Статус и назначение Министерства финансов',
        content: 'Министерство финансов является органом исполнительной власти, осуществляющим функции по выработке государственной политики и нормативно-правовому регулированию в сфере финансовой и налоговой деятельности.'
      }
    ]
  },
  {
    id: 'zdrav',
    title: 'Закон «О здравоохранении в Штате San Andreas»',
    code: 'HEALTH-SA',
    category: 'Законы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-zakon-o-zdravooxranenii-v-shtate-san-andreas.1973498/',
    articles: [
      {
        id: 'health_1',
        articleNumber: 'Статья 1.1',
        title: 'Основы охраны здоровья граждан',
        content: 'Охрана здоровья граждан — это система мер политического, экономического, правового, социального, научного и медицинского характера, направленных на сохранение и укрепление здоровья каждого человека.'
      }
    ]
  },
  {
    id: 'biz',
    title: 'Закон «О предпринимательской деятельности на территории Штата San Andreas»',
    code: 'BIZ-SA',
    category: 'Законы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-zakon-o-predprinimatelskoi-dejatelnosti-na-territorii-shtata-san-andreas.1973501/',
    articles: [
      {
        id: 'biz_1',
        articleNumber: 'Статья 1.1',
        title: 'Понятие предпринимательской деятельности',
        content: 'Предпринимательской является самостоятельная, осуществляемая на свой риск деятельность, направленная на систематическое получение прибыли от пользования имуществом, продажи товаров или оказания услуг.'
      }
    ]
  },
  {
    id: 'diplomacy',
    title: 'Закон «О дипломатических представительствах на территории Штата San Andreas»',
    code: 'DIPL-SA',
    category: 'Законы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-zakon-o-diplomaticheskix-predstavitelstvax-na-territorii-shtata-san-andreas.1973505/',
    articles: [
      {
        id: 'dipl_1',
        articleNumber: 'Статья 1.1',
        title: 'Дипломатический иммунитет и привилегии',
        content: 'Дипломатические представительства и их аккредитованный персонал пользуются неприкосновенностью и привилегиями в соответствии с международными нормами и законами Штата San Andreas.'
      }
    ]
  },
  {
    id: 'chrez',
    title: 'Закон «О чрезвычайном и военном положении на территории Штата San Andreas»',
    code: 'EMERGENCY-SA',
    category: 'Законы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-zakon-o-chrezvychainom-i-voennom-polozhenii-na-territorii-shtata-san-andreas.1973507/',
    articles: [
      {
        id: 'emerg_1',
        articleNumber: 'Статья 1.1',
        title: 'Порядок введения чрезвычайного положения',
        content: 'Чрезвычайное положение вводится указом Губернатора при наличии непосредственной угрозы жизни и безопасности граждан или конституционному строю Штата.'
      }
    ]
  },
  {
    id: 'smi',
    title: 'Закон «О средствах массовой информации в Штате San Andreas»',
    code: 'SMI-SA',
    category: 'Законы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-zakon-o-sredstvax-massovoi-informacii-v-shtate-san-andreas.1973510/',
    articles: [
      {
        id: 'smi_1',
        articleNumber: 'Статья 1.1',
        title: 'Свобода массовой информации',
        content: 'Поиск, получение, производство и распространение массовой информации не подлежат ограничениям, за исключением случаев, предусмотренных законодательством Штата.'
      }
    ]
  },
  {
    id: 'taina',
    title: 'Закон «О регулировании документации и системы служебной и государственной тайны»',
    code: 'SECRET-SA',
    category: 'Законы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-zakon-o-regulirovanii-dokumentacii-i-sistemy-sluzhebnoi-i-gosudarstvennoi-tainy.1973511/',
    articles: [
      {
        id: 'secret_1',
        articleNumber: 'Статья 1.1',
        title: 'Грифы секретности и доступ к государственной тайне',
        content: 'Сведения, составляющие государственную тайну, подразделяются на степени секретности: Особой важности, Совершенно секретно, Секретно и Для служебного пользования.'
      }
    ]
  },
  {
    id: 'nagrady',
    title: 'Закон «О наградах и знаках отличия на территории Штата San Andreas»',
    code: 'AWARDS-SA',
    category: 'Законы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-zakon-o-nagradax-i-znakax-otlichija-na-territorii-shtata-san-andreas.1973519/',
    articles: [
      {
        id: 'awards_1',
        articleNumber: 'Статья 1.1',
        title: 'Государственные награды Штата San Andreas',
        content: 'Государственные награды являются высшей формой поощрения граждан за выдающиеся заслуги в защите Штата, государственном строительстве, экономике и культуре.'
      }
    ]
  },
  {
    id: 'gov_sa',
    title: 'Закон «О Правительстве Штата San Andreas»',
    code: 'GOV-SA',
    category: 'Законы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-zakon-o-pravitelstve-shtata-san-andreas.2255937/',
    articles: [
      {
        id: 'gov_1',
        articleNumber: 'Статья 1.1',
        title: 'Состав и полномочия Правительства',
        content: 'Правительство Штата San Andreas является высшим органом исполнительной власти, возглавляемым Губернатором Штата.'
      }
    ]
  },
  {
    id: 'minzdrav',
    title: 'Закон «О Министерстве здравоохранения»',
    code: 'MINZDRAV-SA',
    category: 'Законы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-zakon-o-ministerstve-zdravooxranenija.3163668/',
    articles: [
      {
        id: 'minzdrav_1',
        articleNumber: 'Статья 1.1',
        title: 'Полномочия Министерства здравоохранения',
        content: 'Министерство здравоохранения осуществляет контроль за деятельностью медицинских учреждений EMS и соблюдением санитарно-эпидемиологических норм.'
      }
    ]
  },
  {
    id: 'dhs',
    title: 'Закон «О Министерстве внутренней безопасности Штата San Andreas»',
    code: 'DHS-SA',
    category: 'Законы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-zakon-o-ministerstve-vnutrennei-bezopasnosti-shtata-san-andreas.3310661/',
    articles: [
      {
        id: 'dhs_1',
        articleNumber: 'Статья 1.1',
        title: 'Задачи Министерства внутренней безопасности',
        content: 'Министерство внутренней безопасности координарует противодействие террористическим угрозам и обеспечение правопорядка.'
      }
    ]
  },
  {
    id: 'sud_kodeks',
    title: 'Судебный кодекс Штата San Andreas',
    code: 'СУД-SA',
    category: 'Кодексы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-sudebnyi-kodeks-shtata-san-andreas.1973420/',
    articles: [
      {
        id: 'sud_1',
        articleNumber: 'Статья 1.1',
        title: 'Судебная власть в Штате San Andreas',
        content: 'Судебная власть в Штате принадлежит исключительно судам в лице судей и привлекаемых в установленных законом случаях присяжных заседателей.'
      }
    ]
  },
  {
    id: 'trud_kodeks',
    title: 'Трудовой кодекс Штата San Andreas',
    code: 'ТК-SA',
    category: 'Кодексы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-trudovoi-kodeks-shtata-san-andreas.1973484/',
    articles: [
      {
        id: 'tk_1',
        articleNumber: 'Статья 1.1',
        title: 'Цели и задачи трудового законодательства',
        content: 'Целями трудового законодательства являются установление государственных гарантий трудовых прав и свобод граждан, создание благоприятных условий труда.'
      }
    ]
  },
  {
    id: 'konstituciya',
    title: 'Конституция Штата San Andreas',
    code: 'CONST-SA',
    category: 'Конституция',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-konstitucija-shtata-san-andreas.1973522/',
    articles: [
      {
        id: 'const_1',
        articleNumber: 'Статья 1.1',
        title: 'Верховенство Конституции',
        content: 'Штат San Andreas является неотъемлемой частью Соединенных Штатов Америки. Конституция Штата имеет высшую юридическую силу на всей его территории.'
      }
    ]
  },
  {
    id: 'process_kodeks',
    title: 'Процессуальный кодекс Штата San Andreas',
    code: 'ПК-SA',
    category: 'Кодексы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-processualnyi-kodeks-shtata-san-andreas.1973524/',
    articles: [
      {
        id: 'pk_1',
        articleNumber: 'Статья 1.1',
        title: 'Назначение процессуального кодекса',
        content: 'Процессуальный кодекс устанавливает порядок следственных, процессуальных и оперативно-розыскных действий при расследовании преступлений.'
      }
    ]
  },
  {
    id: 'sang',
    title: 'Закон «О деятельности Национальной гвардии на территории Штата San Andreas (SANG)»',
    code: 'SANG-SA',
    category: 'Законы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-zakon-o-dejatelnosti-nacionalnoi-gvardii-na-territorii-shtata-san-andreas-sang.1973452/',
    articles: [
      {
        id: 'sang_1',
        articleNumber: 'Статья 1.1',
        title: 'Назначение и состав Национальной гвардии',
        content: 'Национальная гвардия (SANG) является государственным вооруженным формированием, обеспечивающим оборону территории Штата и охрану форта Занкудо.'
      }
    ]
  },
  {
    id: 'fp_tjurma',
    title: 'Закон «О деятельности Федеральной тюрьмы на территории Штата San Andreas (FP)»',
    code: 'FP-SA',
    category: 'Законы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-zakon-o-dejatelnosti-federalnoi-tjurmy-na-territorii-shtata-san-andreas-fp.1973460/',
    articles: [
      {
        id: 'fp_1',
        articleNumber: 'Статья 1.1',
        title: 'Статус Федеральной тюрьмы',
        content: 'Федеральная тюрьма (Bolingbroke Penitentiary) является режимным объектом для отбывания наказания лицами, осужденными за преступления.'
      }
    ]
  },
  {
    id: 'lspd_lssd',
    title: 'Закон «О деятельности региональных правоохранительных органов (LSPD / LSSD)»',
    code: 'POLICE-SA',
    category: 'Законы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-zakon-o-dejatelnosti-regionalnyx-pravooxranitelnyx-organov-na-territorii-shtata-san-andreas-lspd-lssd.1973467/',
    articles: [
      {
        id: 'police_1',
        articleNumber: 'Статья 1.1',
        title: 'Юрисдикция LSPD и LSSD',
        content: 'Департамент полиции Лос-Сантоса (LSPD) и Департамент шерифа (LSSD) являются региональными органами правопорядка, обеспечивающими безопасность граждан.'
      }
    ]
  },
  {
    id: 'priroda',
    title: 'Закон «Об охране природных ресурсов»',
    code: 'NATURE-SA',
    category: 'Законы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-zakon-ob-oxrane-prirodnyx-resursov.1973471/',
    articles: [
      {
        id: 'nature_1',
        articleNumber: 'Статья 1.1',
        title: 'Защита экологического баланса и ресурсов',
        content: 'Настоящий закон регулирует отношения в области использования и охраны природных ресурсов, лесного фонда и заповедных зон Штата San Andreas.'
      }
    ]
  },
  {
    id: 'ethic_kodeks',
    title: 'Этический кодекс Штата San Andreas',
    code: 'ETHIC-SA',
    category: 'Кодексы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-ehticheskii-kodeks-shtata-san-andreas.1973476/',
    articles: [
      {
        id: 'ethic_1',
        articleNumber: 'Статья 1.1',
        title: 'Стандарты поведения государственных служащих',
        content: 'Государственный служащий обязан проявлять вежливость, корректность, уважение к гражданам и не допускать действий, компрометирующих авторитет власти.'
      }
    ]
  },
  {
    id: 'ogp_minjust',
    title: 'Закон «О деятельности Офиса Генерального прокурора Штата San Andreas (Минюст)»',
    code: 'OGP-SA',
    category: 'Законы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-zakon-o-dejatelnosti-ofisa-generalnogo-prokurora-shtata-san-andreas-minjust.1973479/',
    articles: [
      {
        id: 'ogp_1',
        articleNumber: 'Статья 1.1',
        title: 'Полномочия Генерального прокурора и прокуратуры',
        content: 'Офис Генерального прокурора осуществляет надзор за соблюдением законов, уголовное преследование и представление интересов Штата в суде.'
      }
    ]
  },
  {
    id: 'dorozhn_kodeks',
    title: 'Дорожный кодекс Штата San Andreas',
    code: 'ДК-SA',
    category: 'Кодексы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-dorozhnyi-kodeks-shtata-san-andreas.1973482/',
    articles: [
      {
        id: 'dk_1',
        articleNumber: 'Статья 1.1',
        title: 'Правила дорожного движения и скоростной режим',
        content: 'Дорожный кодекс устанавливает единый порядок дорожного движения на всей территории Штата San Andreas.'
      }
    ]
  },
  {
    id: 'usss_act',
    title: 'Закон «О деятельности Секретной службы на территории Штата San Andreas (USSS)»',
    code: 'USSS-SA',
    category: 'Законы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-zakon-o-dejatelnosti-sekretnoi-sluzhby-na-territorii-shtata-san-andreas-usss.1973490/',
    articles: [
      {
        id: 'usss_1',
        articleNumber: 'Статья 1.1',
        title: 'Охрана первых лиц и капитолия',
        content: 'Секретная служба (USSS) обеспечивает безопасность Губернатора, первых лиц Штата и зданий государственного значения.'
      }
    ]
  },
  {
    id: 'advokaty',
    title: 'Закон «О деятельности Коллегии адвокатов на территории Штата San Andreas»',
    code: 'BAR-SA',
    category: 'Законы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-zakon-o-dejatelnosti-kollegii-advokatov-na-territorii-shtata-san-andreas.1973494/',
    articles: [
      {
        id: 'bar_1',
        articleNumber: 'Статья 1.1',
        title: 'Оказание юридической помощи гражданам',
        content: 'Коллегия адвокатов обеспечивает реализацию права граждан на получение квалифицированной юридической помощи и защиту в суде.'
      }
    ]
  },
  {
    id: 'fib_act',
    title: 'Закон «О деятельности Федерального Расследовательского Бюро (FIB)»',
    code: 'FIB-SA',
    category: 'Законы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-zakon-o-dejatelnosti-federalnogo-rassledovatelskogo-bjuro-na-territorii-shtata-san-andreas-fib.1973438/',
    articles: [
      {
        id: 'fib_1',
        articleNumber: 'Статья 1.1',
        title: 'Статус и спецполномочия FIB',
        content: 'FIB является главным органом контрразведки и расследования федеральных преступлений, оргпреступности и террактов.'
      }
    ]
  },
  {
    id: 'arenda_imuschestva',
    title: 'Закон «Об аренде государственного имущества в Штате San Andreas»',
    code: 'RENT-SA',
    category: 'Законы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-zakon-ob-arende-gosudarstvennogo-imuschestva-v-shtate-san-andreas.1973434/',
    articles: [
      {
        id: 'rent_1',
        articleNumber: 'Статья 1.1',
        title: 'Порядок передачи государственного имущества в аренду',
        content: 'Передача объектов государственной собственности в аренду осуществляется на основании открытых аукционов и договора с Правительством.'
      }
    ]
  },
  {
    id: 'neprikosnovennost',
    title: 'Закон «О статусе неприкосновенности должностных лиц на территории Штата San Andreas»',
    code: 'IMMUNITY-SA',
    category: 'Законы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-zakon-o-statuse-neprikosnovennosti-dolzhnostnyx-lic-na-territorii-shtata-san-andreas.1973431/',
    articles: [
      {
        id: 'imm_1',
        articleNumber: 'Статья 1.1',
        title: 'Лица, обладающие неприкосновенностью',
        content: 'Неприкосновенностью обладают Губернатор, Вице-губернатор, Генеральный прокурор, Судьи и определенные категории высших должностных лиц.'
      }
    ]
  },
  {
    id: 'partii',
    title: 'Закон «О политических партиях Штата San Andreas»',
    code: 'PARTIES-SA',
    category: 'Законы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-zakon-o-politicheskix-partijax-shtata-san-andreas.1973392/',
    articles: [
      {
        id: 'parties_1',
        articleNumber: 'Статья 1.1',
        title: 'Создание и регистрация политических партий',
        content: 'Политические партии создаются для участия в политической жизни Штата и выборов в органы государственной власти.'
      }
    ]
  },
  {
    id: 'vzaimodeistvie',
    title: 'Закон «О взаимодействии государственных структур и граждан на территории Штата San Andreas»',
    code: 'INTERACT-SA',
    category: 'Законы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-zakon-o-vzaimodeistvii-gosudarstvennyx-struktur-i-grazhdan-na-territorii-shtata-san-andreas.1973400/',
    articles: [
      {
        id: 'interact_1',
        articleNumber: 'Статья 1.1',
        title: 'Принципы прозрачности и взаимодействия с гражданами',
        content: 'Государственные структуры обязаны действовать на основе законности, открытости и уважения прав и свобод каждого гражданина.'
      }
    ]
  },
  {
    id: 'oruzhie',
    title: 'Закон «О регулировании оборота оружия, боеприпасов и спецсредств в Штате San Andreas»',
    code: 'WEAPON-SA',
    category: 'Законы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-zakon-o-regulirovanii-oborota-oruzhija-boepripasov-i-specsredstv-v-shtate-san-andreas.1973404/',
    articles: [
      {
        id: 'weapon_1',
        articleNumber: 'Статья 1.1',
        title: 'Лицензирование и правила ношения оружия',
        content: 'Ношение гражданского оружия разрешается только при наличии действительной лицензии и соблюдении правил скрытого ношения.'
      }
    ]
  },
  {
    id: 'zakrytye_terr',
    title: 'Закон «О закрытых и охраняемых территориях в Штате San Andreas»',
    code: 'TERRITORY-SA',
    category: 'Законы',
    forumUrl: 'https://forum.gta5rp.com/threads/sa-gov-zakon-o-zakrytyx-i-oxranjaemyx-territorijax-v-shtate-san-andreas.1973412/',
    articles: [
      {
        id: 'terr_1',
        articleNumber: 'Статья 1.1',
        title: 'Режим доступа на закрытые и охраняемые объекты',
        content: 'Закрытыми являются территории государственных учреждений, доступ на которые ограничен и требует специального пропуска или сопровождения.'
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
      // Merge custom saved laws with INITIAL_STATE_LAWS
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
