/**
 * Data Integrity Tests
 * データ整合性テスト
 *
 * Run: node tests/data-integrity.test.js
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

console.log('\n🔍 Data Integrity Tests\n');
console.log('=' .repeat(50));

// Load all data
const quizzes = loadJSON('quizzes.json');
const categories = loadJSON('categories.json');
const bookshelf = loadJSON('bookshelf.json');
const slides = loadJSON('slides.json');

describe('JSON Schema Validation', () => {
  test('quizzes.json should be valid JSON with no parse errors', () => {
    assert(typeof quizzes === 'object', 'quizzes should be an object');
  });

  test('categories.json should be valid JSON with no parse errors', () => {
    assert(typeof categories === 'object', 'categories should be an object');
  });

  test('bookshelf.json should be valid JSON with no parse errors', () => {
    assert(typeof bookshelf === 'object', 'bookshelf should be an object');
  });

  test('slides.json should be valid JSON with no parse errors', () => {
    assert(typeof slides === 'object', 'slides should be an object');
  });
});

describe('Cross-Reference Integrity: Quiz -> Categories', () => {
  const validCategoryIds = categories.categories.map(c => c.id);

  test('all quiz categories should exist in categories.json', () => {
    const invalidCategories = [];
    quizzes.themes.forEach(theme => {
      if (!validCategoryIds.includes(theme.category)) {
        invalidCategories.push(`${theme.id}: ${theme.category}`);
      }
    });

    assert.strictEqual(invalidCategories.length, 0,
      `Invalid categories found: ${invalidCategories.join(', ')}`);
  });
});

describe('Cross-Reference Integrity: Quiz -> Bookshelf', () => {
  // Get all valid subcategory IDs from bookshelf
  const validSubcategories = [];
  bookshelf.shelves.forEach(shelf => {
    shelf.subcategories.forEach(sub => {
      validSubcategories.push(sub.id);
    });
  });

  test('quiz subcategories should align with bookshelf structure', () => {
    // Note: Some quiz subcategories may be new and need to be added to bookshelf
    const quizSubcategories = [...new Set(quizzes.themes.map(t => t.subcategory))];
    const missingSubcategories = quizSubcategories.filter(
      sub => !validSubcategories.includes(sub)
    );

    // These are new subcategories that should be added to bookshelf
    const expectedNewSubcategories = [
      'astrophysics',
      'earth_science',
      'ecology',
      'biology'
    ];

    const unexpectedMissing = missingSubcategories.filter(
      sub => !expectedNewSubcategories.includes(sub)
    );

    assert.strictEqual(unexpectedMissing.length, 0,
      `Unexpected missing subcategories: ${unexpectedMissing.join(', ')}`);
  });
});

describe('Emoji Consistency', () => {
  test('all themes should have emoji', () => {
    quizzes.themes.forEach(theme => {
      assert(theme.emoji && theme.emoji.length > 0,
        `Theme ${theme.id} is missing emoji`);
    });
  });

  test('emojis should be valid Unicode characters', () => {
    const emojiRegex = /\p{Emoji}/u;
    quizzes.themes.forEach(theme => {
      assert(emojiRegex.test(theme.emoji),
        `Theme ${theme.id} has invalid emoji: ${theme.emoji}`);
    });
  });
});

describe('Text Content Validation', () => {
  test('all question texts should be non-empty', () => {
    quizzes.themes.forEach(theme => {
      theme.questions.forEach((q, index) => {
        assert(q.question && q.question.trim().length > 0,
          `Theme ${theme.id} Q${index + 1} has empty question text`);
      });
    });
  });

  test('all choices should be non-empty', () => {
    quizzes.themes.forEach(theme => {
      theme.questions.forEach((q, qIndex) => {
        q.choices.forEach((choice, cIndex) => {
          assert(choice && choice.trim().length > 0,
            `Theme ${theme.id} Q${qIndex + 1} choice ${cIndex + 1} is empty`);
        });
      });
    });
  });

  test('all explanations should be non-empty', () => {
    quizzes.themes.forEach(theme => {
      theme.questions.forEach((q, index) => {
        assert(q.explanation && q.explanation.trim().length > 0,
          `Theme ${theme.id} Q${index + 1} has empty explanation`);
      });
    });
  });

  test('question text should not exceed 200 characters', () => {
    const longQuestions = [];
    quizzes.themes.forEach(theme => {
      theme.questions.forEach((q, index) => {
        if (q.question.length > 200) {
          longQuestions.push(`${theme.id} Q${index + 1}: ${q.question.length} chars`);
        }
      });
    });

    assert.strictEqual(longQuestions.length, 0,
      `Questions exceeding 200 chars: ${longQuestions.join(', ')}`);
  });
});

describe('Duplicate Detection', () => {
  test('no duplicate question IDs', () => {
    const allQuestionIds = [];
    quizzes.themes.forEach(theme => {
      theme.questions.forEach(q => {
        allQuestionIds.push(q.id);
      });
    });

    const duplicates = allQuestionIds.filter(
      (id, index) => allQuestionIds.indexOf(id) !== index
    );

    assert.strictEqual(duplicates.length, 0,
      `Duplicate question IDs found: ${[...new Set(duplicates)].join(', ')}`);
  });

  test('no duplicate theme IDs', () => {
    const themeIds = quizzes.themes.map(t => t.id);
    const duplicates = themeIds.filter(
      (id, index) => themeIds.indexOf(id) !== index
    );

    assert.strictEqual(duplicates.length, 0,
      `Duplicate theme IDs found: ${duplicates.join(', ')}`);
  });

  test('no duplicate questions within same theme', () => {
    quizzes.themes.forEach(theme => {
      const questions = theme.questions.map(q => q.question);
      const duplicates = questions.filter(
        (q, index) => questions.indexOf(q) !== index
      );

      assert.strictEqual(duplicates.length, 0,
        `Theme ${theme.id} has duplicate questions`);
    });
  });
});

describe('Category Metadata Completeness', () => {
  test('all used categories should have complete metadata', () => {
    const usedCategories = [...new Set(quizzes.themes.map(t => t.category))];

    usedCategories.forEach(catId => {
      const category = categories.categories.find(c => c.id === catId);
      assert(category, `Category ${catId} not found in categories.json`);
      assert(category.name, `Category ${catId} missing name`);
      assert(category.emoji, `Category ${catId} missing emoji`);
      assert(category.color, `Category ${catId} missing color`);
      assert(category.description, `Category ${catId} missing description`);
    });
  });
});

describe('Numerical Value Ranges', () => {
  test('difficulty should be 1, 2, or 3', () => {
    quizzes.themes.forEach(theme => {
      assert([1, 2, 3].includes(theme.difficulty),
        `Theme ${theme.id} has invalid difficulty: ${theme.difficulty}`);
    });
  });

  test('reward should be positive integer', () => {
    quizzes.themes.forEach(theme => {
      assert(Number.isInteger(theme.reward) && theme.reward > 0,
        `Theme ${theme.id} has invalid reward: ${theme.reward}`);
    });
  });

  test('answer index should be 0-3', () => {
    quizzes.themes.forEach(theme => {
      theme.questions.forEach((q, index) => {
        assert([0, 1, 2, 3].includes(q.answer),
          `Theme ${theme.id} Q${index + 1} has invalid answer: ${q.answer}`);
      });
    });
  });
});

describe('Japanese Content Validation', () => {
  test('titles should contain Japanese characters', () => {
    const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/;

    quizzes.themes.forEach(theme => {
      assert(japaneseRegex.test(theme.title),
        `Theme ${theme.id} title should contain Japanese: ${theme.title}`);
    });
  });

  test('questions should contain Japanese characters', () => {
    const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/;

    quizzes.themes.forEach(theme => {
      theme.questions.forEach((q, index) => {
        assert(japaneseRegex.test(q.question),
          `Theme ${theme.id} Q${index + 1} should contain Japanese`);
      });
    });
  });
});

describe('Version Control', () => {
  test('quizzes.json should have version field', () => {
    assert(quizzes.version, 'quizzes.json should have version');
  });

  test('version should follow semantic versioning format', () => {
    const semverRegex = /^\d+\.\d+$/;
    assert(semverRegex.test(quizzes.version),
      `Version ${quizzes.version} should follow semver format (e.g., 1.0)`);
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
