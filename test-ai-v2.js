/**
 * AI Service V2 - Test Suite với Validation
 * Run: node test-ai-v2.js
 */

const aiService = require('./services/aiService.v2');

// Mock user ID (thay bằng ID thực tế trong DB)
const TEST_USER_ID = 1;

/**
 * Validation helpers
 */
function validateAnswer(answer, expectedPatterns, testName) {
    const results = {
        passed: false,
        reason: '',
        score: 0
    };

    // Nếu không có pattern nào, chỉ kiểm tra có answer không
    if (!expectedPatterns || expectedPatterns.length === 0) {
        results.passed = answer && answer.length > 0;
        results.reason = results.passed ? 'Has answer' : 'Empty answer';
        results.score = results.passed ? 50 : 0;
        return results;
    }

    let matchedPatterns = 0;
    const failedPatterns = [];

    for (const pattern of expectedPatterns) {
        if (pattern.type === 'contains') {
            // Kiểm tra answer có chứa text
            if (answer.includes(pattern.value)) {
                matchedPatterns++;
            } else {
                failedPatterns.push(`Missing: "${pattern.value}"`);
            }
        } else if (pattern.type === 'number') {
            // Kiểm tra số lượng chính xác
            const regex = new RegExp(pattern.regex);
            const match = answer.match(regex);
            if (match && parseInt(match[1]) === pattern.value) {
                matchedPatterns++;
            } else {
                failedPatterns.push(`Expected ${pattern.label}: ${pattern.value}, got: ${match ? match[1] : 'not found'}`);
            }
        } else if (pattern.type === 'regex') {
            // Kiểm tra regex pattern
            const regex = new RegExp(pattern.value, 'i');
            if (regex.test(answer)) {
                matchedPatterns++;
            } else {
                failedPatterns.push(`Pattern not matched: ${pattern.value}`);
            }
        } else if (pattern.type === 'not_contains') {
            // Kiểm tra answer KHÔNG chứa text
            if (!answer.includes(pattern.value)) {
                matchedPatterns++;
            } else {
                failedPatterns.push(`Should not contain: "${pattern.value}"`);
            }
        }
    }

    results.score = Math.round((matchedPatterns / expectedPatterns.length) * 100);
    results.passed = results.score >= 70; // 70% patterns match = pass
    results.reason = results.passed
        ? `${matchedPatterns}/${expectedPatterns.length} patterns matched (${results.score}%)`
        : `Failed: ${failedPatterns.join(', ')}`;

    return results;
}

// Test cases covering all question types
const TEST_QUESTIONS = [
    // Counting questions
    {
        category: '📊 COUNTING',
        tests: [
            {
                question: "Có bao nhiêu dự án?",
                expectedPatterns: [
                    { type: 'regex', value: '(dự án|project).*?\\d+|\\d+.*?(dự án|project)' },
                    { type: 'not_contains', value: 'không tìm thấy' }
                ]
            },
            {
                question: "Có bao nhiêu dự án đang chạy?",
                expectedPatterns: [
                    { type: 'regex', value: '(đang chạy|dang_chay)' },
                    { type: 'regex', value: '\\d+' }
                ]
            },
            {
                question: "Đếm số công việc hoàn thành",
                expectedPatterns: [
                    { type: 'regex', value: '(hoàn thành|da_hoan_thanh)' },
                    { type: 'regex', value: '\\d+' }
                ]
            },
            {
                question: "Tổng số thành viên trong hệ thống",
                expectedPatterns: [
                    { type: 'regex', value: '(thành viên|người|user).*?\\d+|\\d+.*?(thành viên|người|user)' }
                ]
            },
        ]
    },

    // Overdue checks
    {
        category: '⏰ OVERDUE CHECK',
        tests: [
            {
                question: "Có cái nào đang quá hạn không?",
                expectedPatterns: [
                    { type: 'regex', value: '(quá hạn|overdue|trễ)' },
                    { type: 'regex', value: '(có|không có|\\d+)' }
                ]
            },
            {
                question: "Dự án nào trễ deadline?",
                expectedPatterns: [
                    { type: 'regex', value: '(quá hạn|trễ|overdue|deadline)' },
                    { type: 'regex', value: '(dự án|project)' }
                ]
            },
            {
                question: "Task nào đang overdue?",
                expectedPatterns: [
                    { type: 'regex', value: '(task|công việc)' },
                    { type: 'regex', value: '(quá hạn|overdue|trễ|không có)' }
                ]
            },
        ]
    },

    // Personal data
    {
        category: '� MY DATA',
        tests: [
            {
                question: "Tôi đang làm những dự án nào?",
                expectedPatterns: [
                    { type: 'regex', value: '(dự án|project|chưa|không)' }
                ]
            },
            {
                question: "Công việc của tôi",
                expectedPatterns: [
                    { type: 'regex', value: '(công việc|task|chưa|không)' }
                ]
            },
        ]
    },

    // Listing & Search
    {
        category: '📋 LIST & SEARCH',
        tests: [
            {
                question: "Danh sách dự án đang chạy",
                expectedPatterns: [
                    { type: 'regex', value: '(đang chạy|dang_chay)' },
                    { type: 'regex', value: '\\d+' } // Phải có số lượng
                ]
            },
            {
                question: "Liệt kê các task hoàn thành",
                expectedPatterns: [
                    { type: 'regex', value: '(hoàn thành|da_hoan_thanh|task|công việc)' }
                ]
            },
        ]
    },

    // Advanced - Multi-criteria
    {
        category: '🎯 ADVANCED - MULTI-CRITERIA',
        tests: [
            {
                question: "Task nào ưu tiên cao mà chưa hoàn thành?",
                expectedPatterns: [
                    { type: 'regex', value: '(task|công việc|ưu tiên)' }
                ]
            },
            {
                question: "Có task nào đã quá hạn nhưng vẫn đang thực hiện?",
                expectedPatterns: [
                    { type: 'regex', value: '(quá hạn|overdue|trễ)' }
                ]
            },
        ]
    },

    // Advanced - Statistics
    {
        category: '� ADVANCED - STATISTICS',
        tests: [
            {
                question: "Tỷ lệ hoàn thành của các dự án là bao nhiêu?",
                expectedPatterns: [
                    { type: 'regex', value: '(tỷ lệ|%|phần trăm|hoàn thành)' },
                    { type: 'regex', value: '\\d+' }
                ]
            },
            {
                question: "Thống kê số lượng dự án theo trạng thái",
                expectedPatterns: [
                    { type: 'regex', value: '(dự án|project)' },
                    { type: 'regex', value: '\\d+' }
                ]
            },
        ]
    },
];

async function runTests() {
    console.log('🚀 Starting AI Service V2 Test Suite với Validation\n');
    console.log('='.repeat(60));

    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    const failedDetails = [];

    for (const category of TEST_QUESTIONS) {
        console.log(`\n${category.category}`);
        console.log('-'.repeat(60));

        for (const test of category.tests) {
            totalTests++;
            console.log(`\n❓ Question: "${test.question}"`);

            try {
                const startTime = Date.now();
                const response = await aiService.queryDatabase(test.question, TEST_USER_ID);
                const endTime = Date.now();
                const duration = endTime - startTime;

                if (!response || !response.answer || response.answer.length === 0) {
                    failedTests++;
                    console.log(`❌ FAIL: Empty response`);
                    failedDetails.push({
                        category: category.category,
                        question: test.question,
                        reason: 'Empty response'
                    });
                    continue;
                }

                // Validate answer
                const validation = validateAnswer(response.answer, test.expectedPatterns, test.question);

                if (validation.passed) {
                    passedTests++;
                    console.log(`✅ PASS (${duration}ms) - ${validation.reason}`);
                    console.log(`📝 Answer: ${response.answer.substring(0, 150)}${response.answer.length > 150 ? '...' : ''}`);
                } else {
                    failedTests++;
                    console.log(`❌ FAIL (${duration}ms) - ${validation.reason}`);
                    console.log(`📝 Answer: ${response.answer.substring(0, 150)}${response.answer.length > 150 ? '...' : ''}`);
                    failedDetails.push({
                        category: category.category,
                        question: test.question,
                        reason: validation.reason,
                        answer: response.answer.substring(0, 200)
                    });
                }

                console.log(`🔍 Sources: ${JSON.stringify(response.sources)}`);
                console.log(`💯 Confidence: ${response.confidence} | Score: ${validation.score}%`);

                // Add delay to avoid rate limit (only for Gemini API tests)
                await new Promise(resolve => setTimeout(resolve, 2000));

            } catch (error) {
                failedTests++;
                console.log(`❌ FAIL: ${error.message}`);
                failedDetails.push({
                    category: category.category,
                    question: test.question,
                    reason: `Error: ${error.message}`
                });

                // Add delay after error
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests} (${Math.round(passedTests / totalTests * 100)}%)`);
    console.log(`❌ Failed: ${failedTests} (${Math.round(failedTests / totalTests * 100)}%)`);

    if (failedTests > 0) {
        console.log('\n' + '='.repeat(60));
        console.log('❌ FAILED TESTS DETAILS');
        console.log('='.repeat(60));
        failedDetails.forEach((fail, index) => {
            console.log(`\n${index + 1}. ${fail.category}`);
            console.log(`   Q: ${fail.question}`);
            console.log(`   ❌ ${fail.reason}`);
            if (fail.answer) {
                console.log(`   A: ${fail.answer}...`);
            }
        });
    }

    console.log('\n' + (passedTests === totalTests ? '🎉 ALL TESTS PASSED!' : `⚠️  ${failedTests} TESTS FAILED - Need improvement`));

    // Tính accuracy rate
    const accuracyRate = Math.round((passedTests / totalTests) * 100);
    console.log(`\n📈 Accuracy Rate: ${accuracyRate}%`);
    if (accuracyRate >= 95) {
        console.log('🏆 EXCELLENT - Production ready!');
    } else if (accuracyRate >= 80) {
        console.log('👍 GOOD - Minor improvements needed');
    } else if (accuracyRate >= 60) {
        console.log('⚠️  FAIR - Significant improvements needed');
    } else {
        console.log('🚨 POOR - Major fixes required');
    }
}

// Run tests
runTests()
    .then(() => {
        console.log('\n✅ Test suite completed');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Test suite failed:', error);
        process.exit(1);
    });
