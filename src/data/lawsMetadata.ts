export type LawCategory = 'constitution' | 'code' | 'law';
export type LawSubCategory = 'security' | 'government' | 'civil';

export interface LawPartInfo {
  partIndex: number;
  title: string;
  sourceFile: string;
}

export interface LawMetadata {
  id: string;
  code: string;
  title: string;
  shortTitle: string;
  category: LawCategory;
  subCategory?: LawSubCategory;
  parts: LawPartInfo[];
  bannerImageUrl: string;
  dividerImageUrl: string;
}

export const LAWS_METADATA: LawMetadata[] = [
  // 1. КОНСТИТУЦИЯ
  {
    id: 'constitution',
    code: 'КОНСТИТУЦИЯ',
    title: 'Конституция штата Сан-Андреас',
    shortTitle: 'Конституция штата Сан-Андреас',
    category: 'constitution',
    parts: [
      { partIndex: 1, title: 'Полный текст (Главы I-VIII)', sourceFile: 'Конституция штата Сан-Андреас.txt' }
    ],
    bannerImageUrl: 'https://i.imgur.com/bQG2kud.png',
    dividerImageUrl: 'https://i.imgur.com/eoOV353.png'
  },

  // 2. КОДЕКСЫ (6 кодексов)
  {
    id: 'road_code',
    code: 'ДК',
    title: 'Дорожный Кодекс штата Сан-Андреас',
    shortTitle: 'Дорожный кодекс',
    category: 'code',
    parts: [
      { partIndex: 1, title: 'Часть 1 (Главы I-VIII)', sourceFile: 'Дорожный кодекс (Часть 1, Главы I-VIII).txt' },
      { partIndex: 2, title: 'Часть 2 (Главы IX-XII)', sourceFile: 'Дорожный кодекс (Часть 2, Главы IX-XII).txt' }
    ],
    bannerImageUrl: 'https://i.imgur.com/bQG2kud.png',
    dividerImageUrl: 'https://i.imgur.com/eoOV353.png'
  },
  {
    id: 'criminal_code',
    code: 'УАК',
    title: 'Уголовно-Административный Кодекс штата Сан-Андреас',
    shortTitle: 'Уголовно-административный кодекс',
    category: 'code',
    parts: [
      { partIndex: 1, title: 'Часть 1 (Общая часть, Главы 1-5)', sourceFile: 'Уголовно-административный кодекс (Часть 1, Общая часть, Главы 1-5).txt' },
      { partIndex: 2, title: 'Часть 2 (Преступления против личности, Главы 6-9)', sourceFile: 'Уголовно-административный кодекс (Часть 2, Особенная часть, Главы 6-9).txt' },
      { partIndex: 3, title: 'Часть 3 (Экономика и общественная безопасность, Главы 10-18)', sourceFile: 'Уголовно-административный кодекс (Часть 3, Особенная часть, Главы 10-18).txt' },
      { partIndex: 4, title: 'Часть 4 (Административные правонарушения, Главы 19-28)', sourceFile: 'Уголовно-административный кодекс (Часть 4, Административные правонарушения, Главы 19-28).txt' }
    ],
    bannerImageUrl: 'https://i.imgur.com/bQG2kud.png',
    dividerImageUrl: 'https://i.imgur.com/eoOV353.png'
  },
  {
    id: 'procedural_code',
    code: 'ПК',
    title: 'Процессуальный Кодекс штата Сан-Андреас',
    shortTitle: 'Процессуальный кодекс',
    category: 'code',
    parts: [
      { partIndex: 1, title: 'Часть 1 (Главы I-II: Общие положения и следствие)', sourceFile: 'Процессуальный кодекс (Часть 1, Главы I-II).txt' },
      { partIndex: 2, title: 'Часть 2 (Глава III: Процесс задержания)', sourceFile: 'Процессуальный кодекс (Часть 2, Глава III - Задержание).txt' },
      { partIndex: 3, title: 'Часть 3 (Главы IV-X: Процесс ареста и допрос)', sourceFile: 'Процессуальный кодекс (Часть 3, Главы IV-X - Арест и следствие).txt' }
    ],
    bannerImageUrl: 'https://i.imgur.com/bQG2kud.png',
    dividerImageUrl: 'https://i.imgur.com/eoOV353.png'
  },
  {
    id: 'judicial_code',
    code: 'СК',
    title: 'Судебный Кодекс штата Сан-Андреас',
    shortTitle: 'Судебный кодекс',
    category: 'code',
    parts: [
      { partIndex: 1, title: 'Часть 1 (Главы I-IV: Судебная власть и подсудность)', sourceFile: 'Судебный кодекс (Часть 1, Главы I-IV).txt' },
      { partIndex: 2, title: 'Часть 2 (Главы V-IX: Пошлины, заседания, доказательства)', sourceFile: 'Судебный кодекс (Часть 2, Главы V-IX).txt' },
      { partIndex: 3, title: 'Часть 3 (Главы X-XIII: Неуважение к суду и апелляции)', sourceFile: 'Судебный кодекс (Часть 3, Главы X-XIII).txt' }
    ],
    bannerImageUrl: 'https://i.imgur.com/bQG2kud.png',
    dividerImageUrl: 'https://i.imgur.com/eoOV353.png'
  },
  {
    id: 'labor_code',
    code: 'ТК',
    title: 'Трудовой Кодекс штата Сан-Андреас',
    shortTitle: 'Трудовой кодекс',
    category: 'code',
    parts: [
      { partIndex: 1, title: 'Полный текст (Главы I-VIII)', sourceFile: 'Трудовой кодекс штата Сан-Андреас.txt' }
    ],
    bannerImageUrl: 'https://i.imgur.com/bQG2kud.png',
    dividerImageUrl: 'https://i.imgur.com/eoOV353.png'
  },
  {
    id: 'ethical_code',
    code: 'ЭК',
    title: 'Этический Кодекс штата Сан-Андреас',
    shortTitle: 'Этический кодекс',
    category: 'code',
    parts: [
      { partIndex: 1, title: 'Полный текст (Главы I-VI)', sourceFile: 'Этический кодекс штата Сан-Андреас.txt' }
    ],
    bannerImageUrl: 'https://i.imgur.com/bQG2kud.png',
    dividerImageUrl: 'https://i.imgur.com/eoOV353.png'
  },

  // 3. ЗАКОНЫ О СИЛОВЫХ СТРУКТУРАХ (5 законов)
  {
    id: 'law_fib',
    code: 'FIB',
    title: 'Закон "О деятельности Федерального Расследовательского Бюро на территории штата Сан-Андреас (FIB)"',
    shortTitle: 'Закон о деятельности FIB',
    category: 'law',
    subCategory: 'security',
    parts: [
      { partIndex: 1, title: 'Часть 1 (Главы I-XXI)', sourceFile: 'Закон о деятельности Федерального Расследовательского Бюро (FIB) (Часть 1, Главы I-XXI).txt' },
      { partIndex: 2, title: 'Часть 2 (Главы XXII-XXVI)', sourceFile: 'Закон о деятельности Федерального Расследовательского Бюро (FIB) (Часть 2, Главы XXII-XXVI).txt' }
    ],
    bannerImageUrl: 'https://i.imgur.com/bQG2kud.png',
    dividerImageUrl: 'https://i.imgur.com/eoOV353.png'
  },
  {
    id: 'law_sang',
    code: 'SANG',
    title: 'Закон "О деятельности Национальной Гвардии на территории штата Сан-Андреас (SANG)"',
    shortTitle: 'Закон о Национальной Гвардии (SANG)',
    category: 'law',
    subCategory: 'security',
    parts: [
      { partIndex: 1, title: 'Полный текст (Главы I-VI)', sourceFile: 'Закон о деятельности Национальной Гвардии (SANG).txt' }
    ],
    bannerImageUrl: 'https://i.imgur.com/bQG2kud.png',
    dividerImageUrl: 'https://i.imgur.com/eoOV353.png'
  },
  {
    id: 'law_usss',
    code: 'USSS',
    title: 'Закон "О деятельности Секретной Службы на территории штата Сан-Андреас (USSS)"',
    shortTitle: 'Закон о Секретной Службе (USSS)',
    category: 'law',
    subCategory: 'security',
    parts: [
      { partIndex: 1, title: 'Полный текст (Главы I-XI)', sourceFile: 'Закон о деятельности Секретной Службы (USSS).txt' }
    ],
    bannerImageUrl: 'https://i.imgur.com/bQG2kud.png',
    dividerImageUrl: 'https://i.imgur.com/eoOV353.png'
  },
  {
    id: 'law_police',
    code: 'LSPD/LSSD',
    title: 'Закон “О деятельности региональных правоохранительных органов на территории штата Сан-Андреас (LSPD,LSSD)”',
    shortTitle: 'Закон о полиции и шерифах (LSPD/LSSD)',
    category: 'law',
    subCategory: 'security',
    parts: [
      { partIndex: 1, title: 'Полный текст (Главы I-VII)', sourceFile: 'Закон о деятельности региональных правоохранительных органов (LSPD, LSSD).txt' }
    ],
    bannerImageUrl: 'https://i.imgur.com/bQG2kud.png',
    dividerImageUrl: 'https://i.imgur.com/eoOV353.png'
  },
  {
    id: 'law_prison',
    code: 'FP',
    title: 'Закон "О деятельности Федеральной Тюрьмы на территории штата Сан-Андреас (FP)"',
    shortTitle: 'Закон о Федеральной Тюрьме (FP)',
    category: 'law',
    subCategory: 'security',
    parts: [
      { partIndex: 1, title: 'Полный текст (Главы I-VIII)', sourceFile: 'Закон о деятельности Федеральной Тюрьмы (FP).txt' }
    ],
    bannerImageUrl: 'https://i.imgur.com/bQG2kud.png',
    dividerImageUrl: 'https://i.imgur.com/eoOV353.png'
  },

  // 4. ЗАКОНЫ ОБ ОРГАНАХ ВЛАСТИ И ЮСТИЦИИ (6 законов)
  {
    id: 'law_government',
    code: 'ПРАВИТЕЛЬСТВО',
    title: 'Закон "О Правительстве штата Сан-Андреас"',
    shortTitle: 'Закон о Правительстве',
    category: 'law',
    subCategory: 'government',
    parts: [
      { partIndex: 1, title: 'Полный текст (Главы I-VIII)', sourceFile: 'Закон о Правительстве.txt' }
    ],
    bannerImageUrl: 'https://i.imgur.com/bQG2kud.png',
    dividerImageUrl: 'https://i.imgur.com/eoOV353.png'
  },
  {
    id: 'law_prosecutor',
    code: 'МИНЮСТ',
    title: 'Закон "О деятельности Офиса Генерального Прокурора штата Сан-Андреас (Минюст)"',
    shortTitle: 'Закон об Офисе Генерального Прокурора',
    category: 'law',
    subCategory: 'government',
    parts: [
      { partIndex: 1, title: 'Полный текст (Главы I-IV)', sourceFile: 'Закон о деятельности Офиса Генерального Прокурора (Минюст).txt' }
    ],
    bannerImageUrl: 'https://i.imgur.com/bQG2kud.png',
    dividerImageUrl: 'https://i.imgur.com/eoOV353.png'
  },
  {
    id: 'law_finance',
    code: 'МИНФИН',
    title: 'Закон "О министерстве финансов штата Сан-Андреас"',
    shortTitle: 'Закон о Министерстве финансов',
    category: 'law',
    subCategory: 'government',
    parts: [
      { partIndex: 1, title: 'Полный текст (Главы I-VI)', sourceFile: 'Закон о Министерстве финансов.txt' }
    ],
    bannerImageUrl: 'https://i.imgur.com/bQG2kud.png',
    dividerImageUrl: 'https://i.imgur.com/eoOV353.png'
  },
  {
    id: 'law_bar',
    code: 'АДВОКАТУРА',
    title: 'Закон "О деятельности Коллегии Адвокатов на территории штата Сан-Андреас"',
    shortTitle: 'Закон о Коллегии Адвокатов',
    category: 'law',
    subCategory: 'government',
    parts: [
      { partIndex: 1, title: 'Полный текст (Главы I-VII)', sourceFile: 'Закон о деятельности Коллегии Адвокатов.txt' }
    ],
    bannerImageUrl: 'https://i.imgur.com/bQG2kud.png',
    dividerImageUrl: 'https://i.imgur.com/eoOV353.png'
  },
  {
    id: 'law_immunity',
    code: 'НЕПРИКОСНОВЕННОСТЬ',
    title: 'Закон "О статусе неприкосновенности должностных лиц на территории штата Сан-Андреас"',
    shortTitle: 'Закон о статусе неприкосновенности',
    category: 'law',
    subCategory: 'government',
    parts: [
      { partIndex: 1, title: 'Полный текст', sourceFile: 'Закон о статусе неприкосновенности должностных лиц.txt' }
    ],
    bannerImageUrl: 'https://i.imgur.com/bQG2kud.png',
    dividerImageUrl: 'https://i.imgur.com/eoOV353.png'
  },
  {
    id: 'law_territories',
    code: 'ТЕРРИТОРИИ',
    title: 'Закон "О закрытых и охраняемых территориях в штате Сан-Андреас"',
    shortTitle: 'Закон о закрытых территориях',
    category: 'law',
    subCategory: 'government',
    parts: [
      { partIndex: 1, title: 'Полный текст (Главы I-VIII)', sourceFile: 'Закон о закрытых и охраняемых территориях.txt' }
    ],
    bannerImageUrl: 'https://i.imgur.com/bQG2kud.png',
    dividerImageUrl: 'https://i.imgur.com/eoOV353.png'
  },

  // 5. ГРАЖДАНСКИЕ И ОТРАСЛЕВЫЕ ЗАКОНЫ (10 законов)
  {
    id: 'law_state_coop',
    code: 'ВЗАИМОДЕЙСТВИЕ',
    title: 'Закон "О взаимодействии государственных структур и граждан на территории штата Сан-Андреас"',
    shortTitle: 'Закон о взаимодействии гос. структур',
    category: 'law',
    subCategory: 'civil',
    parts: [
      { partIndex: 1, title: 'Полный текст (Главы I-VIII)', sourceFile: 'Закон о взаимодействии государственных структур и граждан.txt' }
    ],
    bannerImageUrl: 'https://i.imgur.com/bQG2kud.png',
    dividerImageUrl: 'https://i.imgur.com/eoOV353.png'
  },
  {
    id: 'law_weapons',
    code: 'ОРУЖИЕ',
    title: 'Закон "О регулировании оборота оружия, боеприпасов и спецсредств в штате Сан-Андреас"',
    shortTitle: 'Закон об обороте оружия и спецсредств',
    category: 'law',
    subCategory: 'civil',
    parts: [
      { partIndex: 1, title: 'Полный текст (Главы I-VIII)', sourceFile: 'Закон о регулировании оборота оружия и спецсредств.txt' }
    ],
    bannerImageUrl: 'https://i.imgur.com/bQG2kud.png',
    dividerImageUrl: 'https://i.imgur.com/eoOV353.png'
  },
  {
    id: 'law_health',
    code: 'ЗДРАВООХРАНЕНИЕ',
    title: 'Закон "О здравоохранении в штате Сан-Андреас"',
    shortTitle: 'Закон о здравоохранении',
    category: 'law',
    subCategory: 'civil',
    parts: [
      { partIndex: 1, title: 'Полный текст (Главы I-V)', sourceFile: 'Закон о здравоохранении.txt' }
    ],
    bannerImageUrl: 'https://i.imgur.com/bQG2kud.png',
    dividerImageUrl: 'https://i.imgur.com/eoOV353.png'
  },
  {
    id: 'law_media',
    code: 'СМИ',
    title: 'Закон "О средствах массовой информации в штате Сан-Андреас"',
    shortTitle: 'Закон о средствах массовой информации',
    category: 'law',
    subCategory: 'civil',
    parts: [
      { partIndex: 1, title: 'Полный текст (Главы I-VI)', sourceFile: 'Закон о средствах массовой информации.txt' }
    ],
    bannerImageUrl: 'https://i.imgur.com/bQG2kud.png',
    dividerImageUrl: 'https://i.imgur.com/eoOV353.png'
  },
  {
    id: 'law_docs',
    code: 'ГОСТАЙНА',
    title: 'Закон "О регулировании документации и системы служебной и государственной тайны"',
    shortTitle: 'Закон о документации и гостайне',
    category: 'law',
    subCategory: 'civil',
    parts: [
      { partIndex: 1, title: 'Полный текст (Главы I-VI)', sourceFile: 'Закон о регулировании документации и государственной тайны.txt' }
    ],
    bannerImageUrl: 'https://i.imgur.com/bQG2kud.png',
    dividerImageUrl: 'https://i.imgur.com/eoOV353.png'
  },
  {
    id: 'law_diplomatic',
    code: 'ДИППРЕДСТАВИТЕЛЬСТВА',
    title: 'Закон "О дипломатических представительствах на территории штата Сан-Андреас"',
    shortTitle: 'Закон о дип. представительствах',
    category: 'law',
    subCategory: 'civil',
    parts: [
      { partIndex: 1, title: 'Полный текст (Главы I-III)', sourceFile: 'Закон о дипломатических представительствах.txt' }
    ],
    bannerImageUrl: 'https://i.imgur.com/bQG2kud.png',
    dividerImageUrl: 'https://i.imgur.com/eoOV353.png'
  },
  {
    id: 'law_parties',
    code: 'ПАРТИИ',
    title: 'Закон о политических партиях штата Сан-Андреас',
    shortTitle: 'Закон о политических партиях',
    category: 'law',
    subCategory: 'civil',
    parts: [
      { partIndex: 1, title: 'Полный текст (Главы 1-5)', sourceFile: 'Закон о политических партиях.txt' }
    ],
    bannerImageUrl: 'https://i.imgur.com/bQG2kud.png',
    dividerImageUrl: 'https://i.imgur.com/eoOV353.png'
  },
  {
    id: 'law_business',
    code: 'БИЗНЕС',
    title: 'Закон «О предпринимательской деятельности на территории штата Сан Андреас»',
    shortTitle: 'Закон о предпринимательской деятельности',
    category: 'law',
    subCategory: 'civil',
    parts: [
      { partIndex: 1, title: 'Полный текст (Главы I-IV)', sourceFile: 'Закон о предпринимательской деятельности.txt' }
    ],
    bannerImageUrl: 'https://i.imgur.com/bQG2kud.png',
    dividerImageUrl: 'https://i.imgur.com/eoOV353.png'
  },
  {
    id: 'law_emergency',
    code: 'ЧП/ВП',
    title: 'Закон "О Чрезвычайном и Военном положении на территории штата Сан-Андреас"',
    shortTitle: 'Закон о ЧП и Военном положении',
    category: 'law',
    subCategory: 'civil',
    parts: [
      { partIndex: 1, title: 'Полный текст (Разделы I-III)', sourceFile: 'Закон о Чрезвычайном и Военном положении.txt' }
    ],
    bannerImageUrl: 'https://i.imgur.com/bQG2kud.png',
    dividerImageUrl: 'https://i.imgur.com/eoOV353.png'
  },
  {
    id: 'law_rent',
    code: 'АРЕНДА',
    title: 'Закон "Об аренде государственного имущества в штате Сан-Андреас"',
    shortTitle: 'Закон об аренде госимущества',
    category: 'law',
    subCategory: 'civil',
    parts: [
      { partIndex: 1, title: 'Полный текст (Главы I-II)', sourceFile: 'Закон об аренде государственного имущества.txt' }
    ],
    bannerImageUrl: 'https://i.imgur.com/bQG2kud.png',
    dividerImageUrl: 'https://i.imgur.com/eoOV353.png'
  },
  {
    id: 'law_nature',
    code: 'ПРИРОДА',
    title: 'Закон “Об охране природных ресурсов”',
    shortTitle: 'Закон об охране природных ресурсов',
    category: 'law',
    subCategory: 'civil',
    parts: [
      { partIndex: 1, title: 'Полный текст', sourceFile: 'Закон об охране природных ресурсов.txt' }
    ],
    bannerImageUrl: 'https://i.imgur.com/bQG2kud.png',
    dividerImageUrl: 'https://i.imgur.com/eoOV353.png'
  },
  {
    id: 'law_awards',
    code: 'НАГРАДЫ',
    title: 'Закон "О наградах и знаках отличия на территории штата Сан-Андреас"',
    shortTitle: 'Закон о наградах и знаках отличия',
    category: 'law',
    subCategory: 'civil',
    parts: [
      { partIndex: 1, title: 'Полный текст (Разделы I-IV)', sourceFile: 'Закон о наградах и знаках отличия.txt' }
    ],
    bannerImageUrl: 'https://i.imgur.com/bQG2kud.png',
    dividerImageUrl: 'https://i.imgur.com/eoOV353.png'
  }
];
