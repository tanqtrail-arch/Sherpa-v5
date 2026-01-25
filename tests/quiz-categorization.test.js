/**
 * Quiz Categorization Tests
 * 探究学習カリキュラム - クイズカテゴリ分類テスト
 *
 * Run: node tests/quiz-categorization.test.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Test utilities
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

let passCount = 0;
let failCount = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passCount++;
    console.log(`${colors.green}✓${colors.reset} ${name}`);
  } catch (error) {
    failCount++;
    failures.push({ name, error: error.message });
    console.log(`${colors.red}✗${colors.reset} ${name}`);
    console.log(`  ${colors.red}${error.message}${colors.reset}`);
  }
}

function describe(suiteName, fn) {
  console.log(`\n${colors.blue}${suiteName}${colors.reset}`);
  fn();
}

// Load data files
const dataPath = path.join(__dirname, '..', 'data');

function loadJSON(filename) {
  const filePath = path.join(dataPath, filename);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

// ============================================
// Tests Start Here
// ============================================

console.log('\n🧪 Quiz Categorization Tests\n');
console.log('=' .repeat(50));

// Load all data
let quizzes, categories, bookshelf;

describe('Data Loading', () => {
  test('should load quizzes.json', () => {
    quizzes = loadJSON('quizzes.json');
    assert(quizzes, 'quizzes.json should exist');
    assert(quizzes.themes, 'quizzes should have themes array');
  });

  test('should load categories.json', () => {
    categories = loadJSON('categories.json');
    assert(categories, 'categories.json should exist');
    assert(categories.categories, 'categories should have categories array');
  });

  test('should load bookshelf.json', () => {
    bookshelf = loadJSON('bookshelf.json');
    assert(bookshelf, 'bookshelf.json should exist');
    assert(bookshelf.shelves, 'bookshelf should have shelves array');
  });
});

describe('Quiz Structure Validation', () => {
  test('should have exactly 20 themes', () => {
    assert.strictEqual(quizzes.themes.length, 20,
      `Expected 20 themes, got ${quizzes.themes.length}`);
  });

  test('should have targetGrade set to 5', () => {
    assert.strictEqual(quizzes.targetGrade, 5,
      `Expected targetGrade 5, got ${quizzes.targetGrade}`);
  });

  test('should have 8 questions per theme setting', () => {
    assert.strictEqual(quizzes.questionsPerTheme, 8,
      `Expected 8 questions per theme, got ${quizzes.questionsPerTheme}`);
  });

  test('each theme should have unique ID', () => {
    const ids = quizzes.themes.map(t => t.id);
    const uniqueIds = [...new Set(ids)];
    assert.strictEqual(ids.length, uniqueIds.length,
      'Theme IDs should be unique');
  });

  test('each theme should have all required fields', () => {
    const requiredFields = ['id', 'title', 'emoji', 'category', 'subcategory',
                           'themeId', 'difficulty', 'reward', 'questions'];

    quizzes.themes.forEach((theme, index) => {
      requiredFields.forEach(field => {
        assert(theme.hasOwnProperty(field),
          `Theme ${index + 1} (${theme.id}) missing field: ${field}`);
      });
    });
  });
});

describe('Question Structure Validation', () => {
  test('each theme should have exactly 8 questions', () => {
    quizzes.themes.forEach(theme => {
      assert.strictEqual(theme.questions.length, 8,
        `Theme ${theme.id} should have 8 questions, got ${theme.questions.length}`);
    });
  });

  test('each question should have required fields', () => {
    const requiredFields = ['id', 'question', 'choices', 'answer', 'explanation'];

    quizzes.themes.forEach(theme => {
      theme.questions.forEach((q, qIndex) => {
        requiredFields.forEach(field => {
          assert(q.hasOwnProperty(field),
            `Question ${qIndex + 1} in theme ${theme.id} missing field: ${field}`);
        });
      });
    });
  });

  test('each question should have exactly 4 choices', () => {
    quizzes.themes.forEach(theme => {
      theme.questions.forEach((q, qIndex) => {
        assert.strictEqual(q.choices.length, 4,
          `Question ${qIndex + 1} in theme ${theme.id} should have 4 choices`);
      });
    });
  });

  test('answer index should be valid (0-3)', () => {
    quizzes.themes.forEach(theme => {
      theme.questions.forEach((q, qIndex) => {
        assert(q.answer >= 0 && q.answer <= 3,
          `Question ${qIndex + 1} in theme ${theme.id} has invalid answer index: ${q.answer}`);
      });
    });
  });

  test('question IDs should follow naming convention', () => {
    quizzes.themes.forEach(theme => {
      theme.questions.forEach((q, qIndex) => {
        const expectedPattern = /^q\d{3}_\d+$/;
        assert(expectedPattern.test(q.id),
          `Question ID ${q.id} doesn't match expected pattern (qXXX_N)`);
      });
    });
  });
});

describe('Category Validation', () => {
  test('all theme categories should exist in categories.json', () => {
    const validCategories = categories.categories.map(c => c.id);

    quizzes.themes.forEach(theme => {
      assert(validCategories.includes(theme.category),
        `Theme ${theme.id} has invalid category: ${theme.category}`);
    });
  });

  test('category distribution should be correct', () => {
    const distribution = {};
    quizzes.themes.forEach(theme => {
      distribution[theme.category] = (distribution[theme.category] || 0) + 1;
    });

    // Expected: world_history: 7, japan_history: 4, space: 4, science: 5
    assert.strictEqual(distribution['world_history'], 7,
      `Expected 7 world_history themes, got ${distribution['world_history']}`);
    assert.strictEqual(distribution['japan_history'], 4,
      `Expected 4 japan_history themes, got ${distribution['japan_history']}`);
    assert.strictEqual(distribution['space'], 4,
      `Expected 4 space themes, got ${distribution['space']}`);
    assert.strictEqual(distribution['science'], 5,
      `Expected 5 science themes, got ${distribution['science']}`);
  });

  test('categoryMapping should match actual theme distribution', () => {
    const mapping = quizzes.categoryMapping;

    Object.entries(mapping).forEach(([category, data]) => {
      const actualThemes = quizzes.themes
        .filter(t => t.category === category)
        .map(t => t.id);

      assert.deepStrictEqual(
        data.themes.sort(),
        actualThemes.sort(),
        `Category mapping for ${category} doesn't match actual themes`
      );
    });
  });
});

describe('History Category - World History (歴史のふしぎ - 世界史)', () => {
  const worldHistoryThemes = [
    { id: 'theme_001', title: 'ピラミッドのひみつ', subcategory: 'ancient' },
    { id: 'theme_002', title: '万里の長城のひみつ', subcategory: 'ancient' },
    { id: 'theme_003', title: 'ローマ帝国のすごさ', subcategory: 'medieval' },
    { id: 'theme_004', title: 'シルクロード物語', subcategory: 'ancient' },
    { id: 'theme_009', title: 'フランス革命の始まり', subcategory: 'modern' },
    { id: 'theme_010', title: '蒸気機関が変えた世界', subcategory: 'modern' },
    { id: 'theme_011', title: '冷戦とベルリンの壁', subcategory: 'modern' }
  ];

  worldHistoryThemes.forEach(expected => {
    test(`${expected.title} should be categorized as world_history/${expected.subcategory}`, () => {
      const theme = quizzes.themes.find(t => t.id === expected.id);
      assert(theme, `Theme ${expected.id} not found`);
      assert.strictEqual(theme.category, 'world_history',
        `Theme ${expected.id} should have category world_history`);
      assert.strictEqual(theme.subcategory, expected.subcategory,
        `Theme ${expected.id} should have subcategory ${expected.subcategory}`);
    });
  });
});

describe('History Category - Japan History (歴史のふしぎ - 日本史)', () => {
  const japanHistoryThemes = [
    { id: 'theme_005', title: '邪馬台国はどこ？', subcategory: 'ancient' },
    { id: 'theme_006', title: '信長の革新', subcategory: 'samurai' },
    { id: 'theme_007', title: '江戸のエコ生活', subcategory: 'samurai' },
    { id: 'theme_008', title: '明治維新の変革', subcategory: 'modern_japan' }
  ];

  japanHistoryThemes.forEach(expected => {
    test(`${expected.title} should be categorized as japan_history/${expected.subcategory}`, () => {
      const theme = quizzes.themes.find(t => t.id === expected.id);
      assert(theme, `Theme ${expected.id} not found`);
      assert.strictEqual(theme.category, 'japan_history',
        `Theme ${expected.id} should have category japan_history`);
      assert.strictEqual(theme.subcategory, expected.subcategory,
        `Theme ${expected.id} should have subcategory ${expected.subcategory}`);
    });
  });
});

describe('Science Category - Space (科学のひみつ - 宇宙)', () => {
  const spaceThemes = [
    { id: 'theme_012', title: 'ロケットが飛ぶ理由', subcategory: 'exploration' },
    { id: 'theme_013', title: 'アポロ計画の偉業', subcategory: 'exploration' },
    { id: 'theme_014', title: 'ブラックホール', subcategory: 'astrophysics' },
    { id: 'theme_015', title: '宇宙の始まり', subcategory: 'astrophysics' }
  ];

  spaceThemes.forEach(expected => {
    test(`${expected.title} should be categorized as space/${expected.subcategory}`, () => {
      const theme = quizzes.themes.find(t => t.id === expected.id);
      assert(theme, `Theme ${expected.id} not found`);
      assert.strictEqual(theme.category, 'space',
        `Theme ${expected.id} should have category space`);
      assert.strictEqual(theme.subcategory, expected.subcategory,
        `Theme ${expected.id} should have subcategory ${expected.subcategory}`);
    });
  });
});

describe('Science Category - General Science (科学のひみつ - 科学)', () => {
  const scienceThemes = [
    { id: 'theme_016', title: '動く大陸', subcategory: 'earth_science' },
    { id: 'theme_017', title: '地震のメカニズム', subcategory: 'earth_science' },
    { id: 'theme_018', title: '食物連鎖', subcategory: 'ecology' },
    { id: 'theme_019', title: '森林の役割', subcategory: 'ecology' },
    { id: 'theme_020', title: 'DNAって何？', subcategory: 'biology' }
  ];

  scienceThemes.forEach(expected => {
    test(`${expected.title} should be categorized as science/${expected.subcategory}`, () => {
      const theme = quizzes.themes.find(t => t.id === expected.id);
      assert(theme, `Theme ${expected.id} not found`);
      assert.strictEqual(theme.category, 'science',
        `Theme ${expected.id} should have category science`);
      assert.strictEqual(theme.subcategory, expected.subcategory,
        `Theme ${expected.id} should have subcategory ${expected.subcategory}`);
    });
  });
});

describe('Difficulty Distribution', () => {
  test('difficulty should be between 1 and 3', () => {
    quizzes.themes.forEach(theme => {
      assert(theme.difficulty >= 1 && theme.difficulty <= 3,
        `Theme ${theme.id} has invalid difficulty: ${theme.difficulty}`);
    });
  });

  test('most themes should have difficulty 2 (appropriate for grade 5)', () => {
    const difficulty2Count = quizzes.themes.filter(t => t.difficulty === 2).length;
    assert(difficulty2Count >= 15,
      `Expected at least 15 themes with difficulty 2, got ${difficulty2Count}`);
  });

  test('advanced topics (ブラックホール, 宇宙の始まり) should have difficulty 3', () => {
    const advancedThemes = ['theme_014', 'theme_015'];
    advancedThemes.forEach(id => {
      const theme = quizzes.themes.find(t => t.id === id);
      assert.strictEqual(theme.difficulty, 3,
        `Theme ${id} should have difficulty 3`);
    });
  });
});

describe('Reward Distribution', () => {
  test('rewards should match difficulty (10 for 1, 15 for 2, 20 for 3)', () => {
    const expectedRewards = { 1: 10, 2: 15, 3: 20 };

    quizzes.themes.forEach(theme => {
      const expected = expectedRewards[theme.difficulty];
      assert.strictEqual(theme.reward, expected,
        `Theme ${theme.id} with difficulty ${theme.difficulty} should have reward ${expected}, got ${theme.reward}`);
    });
  });
});

describe('Theme ID Sequence', () => {
  test('theme IDs should follow sequential order (001-020)', () => {
    for (let i = 1; i <= 20; i++) {
      const expectedId = `theme_${String(i).padStart(3, '0')}`;
      const theme = quizzes.themes.find(t => t.id === expectedId);
      assert(theme, `Missing theme with ID ${expectedId}`);
    }
  });
});

describe('Answer Verification (Spot Checks)', () => {
  // Verify some specific answers from the original content

  test('Q001_1: ピラミッド建設時期 should be 約4500年前 (index 2)', () => {
    const theme = quizzes.themes.find(t => t.id === 'theme_001');
    const question = theme.questions[0];
    assert.strictEqual(question.answer, 2,
      'ピラミッド建設時期の正解は約4500年前（インデックス2）');
  });

  test('Q002_4: 始皇帝 should be first choice (index 0)', () => {
    const theme = quizzes.themes.find(t => t.id === 'theme_002');
    const question = theme.questions[3];
    assert.strictEqual(question.answer, 0,
      '万里の長城を完成させた皇帝は始皇帝（インデックス0）');
  });

  test('Q005_1: 卑弥呼 should be first choice (index 0)', () => {
    const theme = quizzes.themes.find(t => t.id === 'theme_005');
    const question = theme.questions[0];
    assert.strictEqual(question.answer, 0,
      '邪馬台国の女王は卑弥呼（インデックス0）');
  });

  test('Q013_1: アポロ11号月面着陸 should be 1969年 (index 1)', () => {
    const theme = quizzes.themes.find(t => t.id === 'theme_013');
    const question = theme.questions[0];
    assert.strictEqual(question.answer, 1,
      '人類初の月面着陸は1969年（インデックス1）');
  });

  test('Q017_8: マグニチュード1増加 should be 約32倍 (index 2)', () => {
    const theme = quizzes.themes.find(t => t.id === 'theme_017');
    const question = theme.questions[7];
    assert.strictEqual(question.answer, 2,
      'マグニチュード1増加でエネルギーは約32倍（インデックス2）');
  });

  test('Q019_8: 日本の森林率 should be 約70% (index 3)', () => {
    const theme = quizzes.themes.find(t => t.id === 'theme_019');
    const question = theme.questions[7];
    assert.strictEqual(question.answer, 3,
      '日本の森林率は約70%（インデックス3）');
  });
});

describe('Total Question Count', () => {
  test('total questions should be 160 (20 themes x 8 questions)', () => {
    const totalQuestions = quizzes.themes.reduce(
      (sum, theme) => sum + theme.questions.length, 0
    );
    assert.strictEqual(totalQuestions, 160,
      `Expected 160 total questions, got ${totalQuestions}`);
  });
});

// ============================================
// Summary
// ============================================

console.log('\n' + '='.repeat(50));
console.log(`\n${colors.blue}Test Summary${colors.reset}`);
console.log(`${colors.green}Passed: ${passCount}${colors.reset}`);
console.log(`${colors.red}Failed: ${failCount}${colors.reset}`);

if (failures.length > 0) {
  console.log(`\n${colors.red}Failed Tests:${colors.reset}`);
  failures.forEach((f, i) => {
    console.log(`  ${i + 1}. ${f.name}`);
    console.log(`     ${colors.yellow}${f.error}${colors.reset}`);
  });
}

console.log('\n');
process.exit(failCount > 0 ? 1 : 0);
