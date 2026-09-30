export interface LawSubClause {
  id: string;
  bullet: string;              // "⁃", "1)", "а)"
  title?: string;              // "Двойная желтая сплошная линия:"
  content: string;             // Смысловой текст
  sanction?: string;           // Персональный штраф данного пункта
}

export interface LawClause {
  id: string;
  prefix?: string;             // "Исключение:", "Примечание:"
  content: string;
  subclauses?: LawSubClause[];
}

export interface LawSanction {
  id: string;
  text: string;                // "Штраф до $10.000 и принудительное изъятие лицензии."
}

export interface LawArticle {
  id: string;
  articleNumber: string;       // "9.1", "5.1.1", "12.3", "1"
  title?: string;              // "Государственные регистрационные знаки"
  content: string;             // Основной текст диспозиции
  clauses?: LawClause[];       // Список исключений, примечаний и подпунктов
  sanctions?: LawSanction[];   // Санкции статьи
  updatedAt: string;
  sourceBillId?: string;       // Идентификатор законопроекта, внесшего последнюю правку
  partIndex?: number;          // Номер части для многочастных законов (1..4)
  rawBBCode?: string;          // Исходный аутентичный BB-код форума
}

export interface LawChapter {
  id: string;
  numberRoman: string;         // "I", "II", "IX", "XII", "1", "2"
  title: string;               // "Государственные номерные знаки"
  articles: LawArticle[];
  partIndex?: number;          // Номер части для многочастных законов
  rawHeaderBBCode?: string;    // Исходный BB-код заголовка главы
}

export interface LawPartMeta {
  partIndex: number;
  title: string;
  sourceFile: string;
  headerBBCode?: string;
  footerBBCode?: string;
  rawBBCode?: string;
}

export interface StateLawDocument {
  id: string;                  // "road_code"
  code: string;                // "ДК"
  title: string;               // "Дорожный Кодекс штата Сан-Андреас"
  shortTitle?: string;
  category?: string;
  subCategory?: string;
  bannerImageUrl: string;      // "https://i.imgur.com/bQG2kud.png"
  dividerImageUrl: string;     // "https://i.imgur.com/eoOV353.png"
  chapters: LawChapter[];
  version: number;             // Версия редакции (инкрементируется при каждом "Внести")
  updatedAt: string;
  activeBBCode?: string;       // Предкомпилированный актуальный BB-код всего кодекса
  partsMeta?: LawPartMeta[];   // Метаданные частей для мульти-сообщений на форуме
  totalArticlesCount?: number;
}

export interface LawArticlePatch {
  articleNumber: string;
  becameContent: string;
  wasContent?: string;
  notes?: string;
}

export interface LawPatchResult {
  updatedLaw: StateLawDocument;
  affectedArticleNumbers: string[];
  articleBBCodes: Record<string, string>; // articleNumber -> compiled BB-code
  fullLawBBCode: string;
  partBBCodes?: Record<number, string>;   // partIndex -> compiled BB-code для многочастных законов
  chapterBBCodes?: Record<string, string>; // chapterId or numberRoman -> compiled BB-code главы
  multiLawResults?: Record<string, LawPatchResult>; // lawId -> LawPatchResult для комплексных актов по нескольким законам
}
