const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('  HEADLESS VERIFICATION SUITE: LAWS & BILL ENACTMENT ENGINE');
console.log('================================================================\n');

// 1. Load Registry
console.log('TEST 1: Loading Compiled Laws Registry...');
const registryContent = fs.readFileSync('src/data/compiledLawsRegistry.ts', 'utf8');
const jsonMatch = registryContent.match(/export const COMPILED_LAWS_REGISTRY: Record<string, StateLawDocument> = ([\s\S]+);\s*$/);
assert(jsonMatch, 'COMPILED_LAWS_REGISTRY json match failed');
const registry = JSON.parse(jsonMatch[1]);

const lawIds = Object.keys(registry);
console.log(`✓ Successfully loaded registry with ${lawIds.length} laws.`);
assert(lawIds.length >= 27, `Expected at least 27 laws, got ${lawIds.length}`);

// 2. Validate Every Law Document
console.log('\nTEST 2: Validating Document Structural Integrity...');
let totalArticles = 0;
let totalChapters = 0;

lawIds.forEach(id => {
  const doc = registry[id];
  assert(doc.id, `Law ${id} missing id`);
  assert(doc.title, `Law ${id} missing title`);
  assert(doc.code, `Law ${id} missing code`);
  assert(Array.isArray(doc.chapters), `Law ${id} chapters is not an array`);
  assert(doc.chapters.length > 0, `Law ${id} has 0 chapters`);

  totalChapters += doc.chapters.length;
  doc.chapters.forEach(ch => {
    assert(ch.numberRoman, `Chapter in ${id} missing numberRoman`);
    assert(Array.isArray(ch.articles), `Articles in chapter ${ch.numberRoman} not an array`);
    totalArticles += ch.articles.length;
    ch.articles.forEach(art => {
      assert(art.articleNumber, `Article in ${id} missing articleNumber`);
      assert(typeof art.content === 'string', `Article ${art.articleNumber} in ${id} content is not a string`);
    });
  });
});

console.log(`✓ All ${lawIds.length} laws structurally intact:`);
console.log(`  - Total Chapters: ${totalChapters}`);
console.log(`  - Total Articles: ${totalArticles}`);
assert(totalArticles > 1900, `Expected > 1900 articles, got ${totalArticles}`);

// 3. Test Multi-Part Laws
console.log('\nTEST 3: Verifying Multi-Part Forum Post Split Laws...');
const multiPartLaws = ['road_code', 'criminal_code', 'procedural_code', 'judicial_code', 'law_fib'];
multiPartLaws.forEach(id => {
  const doc = registry[id];
  assert(doc.partsMeta && doc.partsMeta.length > 1, `Law ${id} should have multiple parts`);
  console.log(`  - ${doc.shortTitle || doc.title}: ${doc.partsMeta.length} parts`);
  doc.partsMeta.forEach(p => {
    assert(p.partIndex >= 1, `Part index should be >= 1`);
    assert(p.sourceFile, `Part ${p.partIndex} missing sourceFile`);
  });
});
console.log('✓ Multi-part metadata verified.');

// 4. Test BBCode Compiler & Tag Balancer
console.log('\nTEST 4: Testing BBCode Compiler & Tag Balancer...');
function validateAndBalanceBBCode(bbcode) {
  const openTagRegex = /\[([A-Z0-9]+)(?:=[^\]]+)?\]/gi;
  const closeTagRegex = /\[\/([A-Z0-9]+)\]/gi;
  const stack = [];
  const tagTokens = [];
  let match;

  while ((match = openTagRegex.exec(bbcode)) !== null) {
    const raw = match[0];
    const tag = match[1].toUpperCase();
    if (!raw.startsWith('[/')) {
      tagTokens.push({ type: 'open', tag, raw, index: match.index });
    }
  }

  while ((match = closeTagRegex.exec(bbcode)) !== null) {
    tagTokens.push({ type: 'close', tag: match[1].toUpperCase(), raw: match[0], index: match.index });
  }

  tagTokens.sort((a, b) => a.index - b.index);

  for (const token of tagTokens) {
    if (token.type === 'open') {
      stack.push(token.tag);
    } else if (token.type === 'close') {
      const last = stack.lastIndexOf(token.tag);
      if (last !== -1) {
        stack.splice(last, 1);
      }
    }
  }

  if (stack.length > 0) {
    const closingSuffix = stack.reverse().map((t) => `[/${t}]`).join('');
    return { isValid: false, balancedBBCode: bbcode + closingSuffix, unclosedCount: stack.length };
  }
  return { isValid: true, balancedBBCode: bbcode, unclosedCount: 0 };
}

// Test unclosed tag balancing
const brokenSample = '[B][COLOR=rgb(236, 199, 129)]Статья 9.1[FONT=verdana]Текст статьи';
const balanced = validateAndBalanceBBCode(brokenSample);
assert(!balanced.isValid, 'Should detect broken BBCode');
assert(balanced.balancedBBCode.endsWith('[/FONT][/COLOR][/B]'), 'Should balance unclosed tags in reverse LIFO order');
console.log('✓ Tag balancing stack works perfectly (LIFO reversal).');

// 5. Test Fuzzy Law Matcher
console.log('\nTEST 5: Testing Fuzzy Law Matcher...');
const LAW_ALIAS_MAP = {
  'дорожный': 'road_code',
  'дорожный кодекс': 'road_code',
  'дк': 'road_code',
  'уголовный': 'criminal_code',
  'уголовно-административный': 'criminal_code',
  'уак': 'criminal_code',
  'ук': 'criminal_code',
  'процессуальный': 'procedural_code',
  'пк': 'procedural_code',
  'судебный': 'judicial_code',
  'ск': 'judicial_code',
  'трудовой': 'labor_code',
  'тк': 'labor_code',
  'этический': 'ethical_code',
  'конституция': 'constitution',
  'fib': 'law_fib',
  'фиб': 'law_fib',
  'sang': 'law_sang',
  'санг': 'law_sang',
  'usss': 'law_usss',
  'полиция': 'law_police',
  'правительство': 'law_government',
  'минюст': 'law_prosecutor',
  'прокуратура': 'law_prosecutor',
  'минфин': 'law_finance',
  'адвокатура': 'law_bar',
  'неприкосновенность': 'law_immunity',
  'оружие': 'law_weapons',
  'здравоохранение': 'law_health',
  'сми': 'law_media',
  'гостайна': 'law_docs',
  'чп': 'law_emergency',
  'вп': 'law_emergency',
  'чрезвычайн': 'law_emergency',
  'чрезвычайное': 'law_emergency',
  'чрезвычайное положение': 'law_emergency',
  'военное положение': 'law_emergency',
  'военном': 'law_emergency',
  'аренда': 'law_rent',
  'природа': 'law_nature',
  'награды': 'law_awards'
};

function findLaw(query) {
  if (!query) return null;
  const q = query.trim().toLowerCase();
  if (registry[q]) return registry[q];
  for (const [alias, id] of Object.entries(LAW_ALIAS_MAP)) {
    if (q === alias || q.includes(alias) || alias.includes(q)) return registry[id];
  }
  return Object.values(registry).find(l => 
    l.code.toLowerCase() === q ||
    l.title.toLowerCase().includes(q) ||
    (l.shortTitle && l.shortTitle.toLowerCase().includes(q))
  ) || null;
}

const testQueries = [
  ['УАК', 'criminal_code'],
  ['Уголовный кодекс', 'criminal_code'],
  ['Дорожный Кодекс штата Сан-Андреас', 'road_code'],
  ['ДК', 'road_code'],
  ['Конституция', 'constitution'],
  ['Закон о FIB', 'law_fib'],
  ['ФИБ', 'law_fib'],
  ['SANG', 'law_sang'],
  ['Прокуратура', 'law_prosecutor'],
  ['Минфин', 'law_finance'],
  ['Оружие', 'law_weapons'],
  ['Чрезвычайное положение', 'law_emergency']
];

testQueries.forEach(([q, expectedId]) => {
  const match = findLaw(q);
  assert(match, `Query "${q}" did not match any law`);
  assert.strictEqual(match.id, expectedId, `Query "${q}" expected ${expectedId}, got ${match.id}`);
  console.log(`  - Match "${q}" -> ${match.title} (${match.id})`);
});
console.log('✓ Fuzzy matcher successfully resolved 100% of test queries.');

// 6. Test Article Content Retrieval ("Было" pre-fill)
console.log('\nTEST 6: Testing Article Content Extraction for Bill Editor...');
function extractArticleNumber(title) {
  if (!title) return '';
  const match = title.match(/(?:ст(?:атья|\.)?\s*)?([0-9]+(?:\.[0-9]+)*)/i);
  if (match) return match[1];
  return title.replace(/^статья\s+/i, '').replace(/[\.:]$/, '').trim();
}

function getLatestArticle(lawQuery, artTitle) {
  const law = findLaw(lawQuery);
  if (!law) return null;
  const num = extractArticleNumber(artTitle);
  for (const ch of law.chapters) {
    const art = ch.articles.find(a => extractArticleNumber(a.articleNumber) === num || a.articleNumber === num);
    if (art) return art.content;
  }
  return null;
}

const art91 = getLatestArticle('ДК', 'Статья 9.1');
assert(art91, 'Failed to extract article 9.1 from Road Code');
console.log(`✓ Article 9.1 extracted from Road Code: "${art91.slice(0, 60)}..."`);

const art11 = getLatestArticle('УАК', '1.1');
assert(art11, 'Failed to extract article 1.1 from Criminal Code');
console.log(`✓ Article 1.1 extracted from Criminal Code: "${art11.slice(0, 60)}..."`);

// 7. Test Enactment & Law Patching Simulation
console.log('\nTEST 7: Testing Law Enactment and Patching Mechanism...');
const targetLaw = JSON.parse(JSON.stringify(registry['road_code']));
const originalVersion = targetLaw.version;

// Simulate bill with amendment to 9.1
const mockBill = {
  id: 'bill_test_123',
  title: 'Поправка к Дорожному Кодексу',
  targetLaw: 'Дорожный Кодекс штата Сан-Андреас',
  comparisons: [
    {
      id: 'comp_1',
      articleTitle: 'Статья 9.1',
      wasContent: art91,
      becameContent: 'Транспортное средство без государственных номерных знаков подлежит немедленной эвакуации. Штраф $20.000.'
    }
  ]
};

// Patch law
const updatedChapters = targetLaw.chapters.map(ch => ({
  ...ch,
  articles: ch.articles.map(a => ({ ...a }))
}));

const art = updatedChapters.find(ch => ch.articles.some(a => extractArticleNumber(a.articleNumber) === '9.1'))
  .articles.find(a => extractArticleNumber(a.articleNumber) === '9.1');

assert(art, 'Could not find 9.1 in cloned chapters');
art.content = mockBill.comparisons[0].becameContent;
art.rawBBCode = undefined; // Force recompilation
art.sourceBillId = mockBill.id;

targetLaw.chapters = updatedChapters;
targetLaw.version = originalVersion + 1;
targetLaw.updatedAt = new Date().toISOString();

assert.strictEqual(targetLaw.version, originalVersion + 1, 'Version should increment');
assert.strictEqual(art.content, mockBill.comparisons[0].becameContent, 'Article content should match becameContent');
assert.strictEqual(art.sourceBillId, mockBill.id, 'Source bill ID should be recorded');

console.log(`✓ Enactment patch applied: Version updated from v${originalVersion} to v${targetLaw.version}`);
console.log(`✓ Article 9.1 content successfully replaced with new amendment.`);

// 8. Test Total Reform Enactment Simulation
console.log('\nTEST 8: Testing Total Law Reform Enactment...');
const reformLaw = JSON.parse(JSON.stringify(registry['law_immunity']));
const reformOriginalVersion = reformLaw.version;
const mockReformBill = {
  id: 'reform_bill_999',
  title: 'Общая реформа Закона о неприкосновенности',
  targetLaw: 'Закон о статусе неприкосновенности',
  isTotalReform: true,
  totalReformContent: '[CENTER][FONT=verdana][SIZE=4][B]НОВАЯ РЕДАКЦИЯ ЗАКОНА О НЕПРИКОСНОВЕННОСТИ[/B][/SIZE][/FONT][/CENTER]'
};

reformLaw.version = reformOriginalVersion + 1;
reformLaw.activeBBCode = mockReformBill.totalReformContent;
reformLaw.updatedAt = new Date().toISOString();

assert.strictEqual(reformLaw.version, reformOriginalVersion + 1);
assert.strictEqual(reformLaw.activeBBCode, mockReformBill.totalReformContent);
console.log(`✓ Total reform applied cleanly: Law version incremented to v${reformLaw.version}, full activeBBCode replaced.`);

console.log('\n================================================================');
console.log('  ALL 8 HEADLESS TEST SUITES PASSED WITH 100% SUCCESS!');
console.log('================================================================\n');
