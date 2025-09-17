#!/usr/bin/env node

/**
 * Security Check Script for RecipeRush
 * 
 * This script scans the frontend source code for any hardcoded Stripe keys
 * to ensure no security vulnerabilities exist before deployment.
 * 
 * Run this script before deploying to production:
 * node security-check.js
 */

const fs = require('fs');
const path = require('path');

// Patterns to search for
const SECURITY_PATTERNS = {
    'Live Publishable Key': /pk_live_[a-zA-Z0-9_]+/g,
    'Live Secret Key': /sk_live_[a-zA-Z0-9_]+/g,
    'Test Publishable Key': /pk_test_[a-zA-Z0-9_]+/g,
    'Test Secret Key': /sk_test_[a-zA-Z0-9_]+/g,
    'Hardcoded Stripe()': /Stripe\(['"`][^'"`]*['"`]\)/g
};

// Files to scan
const SCAN_FILES = [
    'script.js',
    'catalog.js', 
    'contact.js',
    'server.js'
];

// Directories to exclude
const EXCLUDE_DIRS = [
    'node_modules',
    '.git',
    'coverage',
    'tests'
];

function scanFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const issues = [];
        
        for (const [patternName, pattern] of Object.entries(SECURITY_PATTERNS)) {
            const matches = content.match(pattern);
            if (matches) {
                issues.push({
                    pattern: patternName,
                    matches: matches,
                    lineNumbers: getLineNumbers(content, pattern)
                });
            }
        }
        
        return issues;
    } catch (error) {
        console.error(`❌ Error reading ${filePath}:`, error.message);
        return [];
    }
}

function getLineNumbers(content, pattern) {
    const lines = content.split('\n');
    const lineNumbers = [];
    
    lines.forEach((line, index) => {
        // Clone the pattern to avoid state mutation with global flag
        const clonedPattern = new RegExp(pattern.source, pattern.flags);
        if (clonedPattern.test(line)) {
            lineNumbers.push(index + 1);
        }
    });
    
    return lineNumbers;
}

function scanDirectory(dirPath, depth = 0) {
    if (depth > 3) return; // Limit recursion depth
    
    try {
        const items = fs.readdirSync(dirPath);
        
        for (const item of items) {
            const fullPath = path.join(dirPath, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                if (!EXCLUDE_DIRS.includes(item)) {
                    scanDirectory(fullPath, depth + 1);
                }
            } else if (item.endsWith('.js') || item.endsWith('.html')) {
                const issues = scanFile(fullPath);
                if (issues.length > 0) {
                    console.log(`\n🔍 Scanning: ${fullPath}`);
                    issues.forEach(issue => {
                        console.log(`   ⚠️  ${issue.pattern}:`);
                        issue.lineNumbers.forEach(lineNum => {
                            console.log(`      Line ${lineNum}`);
                        });
                    });
                }
            }
        }
    } catch (error) {
        console.error(`❌ Error scanning directory ${dirPath}:`, error.message);
    }
}

function main() {
    console.log('🔒 RecipeRush Security Check');
    console.log('=============================\n');
    console.log('Scanning for hardcoded Stripe keys and security issues...\n');
    
    // Scan specific files first
    console.log('📁 Scanning specific files:');
    SCAN_FILES.forEach(file => {
        if (fs.existsSync(file)) {
            const issues = scanFile(file);
            if (issues.length > 0) {
                console.log(`\n❌ ${file} - SECURITY ISSUES FOUND:`);
                issues.forEach(issue => {
                    console.log(`   ⚠️  ${issue.pattern}:`);
                    issue.lineNumbers.forEach(lineNum => {
                        console.log(`      Line ${lineNum}`);
                    });
                });
            } else {
                console.log(`✅ ${file} - No security issues found`);
            }
        } else {
            console.log(`⚠️  ${file} - File not found`);
        }
    });
    
    // Scan entire directory
    console.log('\n📁 Scanning entire directory for additional files...');
    scanDirectory('.');
    
    console.log('\n🔒 Security check completed!');
    console.log('\n✅ If no issues were found above, your code is secure for deployment.');
    console.log('❌ If issues were found, fix them before deploying to production.');
}

// Run the security check
if (require.main === module) {
    main();
}

module.exports = { scanFile, scanDirectory, SECURITY_PATTERNS };
