/**
 * Script to remove all dark mode (dark:) Tailwind classes from EJS files
 * This creates a unified medium-tone design across the entire site
 */

const fs = require('fs');
const path = require('path');

// Files to process (from grep results)
const files = [
    'src/views/layout.ejs',
    'src/views/admin/users/view.ejs',
    'src/views/admin/users/list.ejs',
    'src/views/challenges/show.ejs',
    'src/views/challenges/create.ejs',
    'src/views/challenges/list.ejs',
    'src/views/posts/show.ejs',
    'src/views/posts/_post-card.ejs',
    'src/views/posts/feed.ejs',
    'src/views/contribute/index.ejs',
    'src/views/news/index.ejs',
    'src/views/donate/index.ejs',
    'src/views/donate/thank-you.ejs',
    'src/views/about/index.ejs',
    'src/views/resources/index.ejs',
    'src/views/settings/index.ejs',
    'src/views/teams/show.ejs',
    'src/views/teams/join.ejs',
    'src/views/teams/edit.ejs',
    'src/views/teams/create.ejs',
    'src/views/teams/index.ejs',
    'src/views/weight/index.ejs',
    'src/views/dashboard/index.ejs',
    'src/views/auth/login.ejs',
    'src/views/auth/resend-verification.ejs',
    'src/views/auth/register.ejs',
    'src/views/errors/403.ejs'
];

let totalRemovals = 0;
let processedFiles = 0;

files.forEach(filePath => {
    const fullPath = path.join(__dirname, '..', filePath);

    if (!fs.existsSync(fullPath)) {
        console.log(`❌ File not found: ${filePath}`);
        return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;

    // Remove dark: prefixed classes
    // Matches patterns like: dark:bg-slate-900, dark:text-white, dark:hover:bg-blue-600, etc.
    const darkClassPattern = /\s*dark:[a-z-]+:[a-z0-9-]+(?:\/[0-9]+)?/g;
    const simpleDarkClassPattern = /\s*dark:[a-z0-9-]+(?:\/[0-9]+)?/g;

    // Count matches before removal
    const matches1 = content.match(darkClassPattern) || [];
    const matches2 = content.match(simpleDarkClassPattern) || [];
    const removals = matches1.length + matches2.length;

    // Remove the classes
    content = content.replace(darkClassPattern, '');
    content = content.replace(simpleDarkClassPattern, '');

    // Clean up multiple spaces
    content = content.replace(/class="([^"]*)"/g, (match, classes) => {
        return `class="${classes.replace(/\s+/g, ' ').trim()}"`;
    });

    if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ ${filePath} - Removed ${removals} dark: classes`);
        totalRemovals += removals;
        processedFiles++;
    } else {
        console.log(`⚪ ${filePath} - No changes needed`);
    }
});

console.log('\n' + '='.repeat(60));
console.log(`🎉 Processed ${processedFiles} files`);
console.log(`🗑️  Removed ${totalRemovals} dark mode classes total`);
console.log('✨ Site now has unified medium-tone design!');
console.log('='.repeat(60));
