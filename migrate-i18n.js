#!/usr/bin/env node

/**
 * Migration script to convert from next-intl to single French language system
 * This script updates all files that import from next-intl or next-intl/server
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');

// Files to skip (already updated)
const SKIP_FILES = [
  'src/app/layout.tsx',
  'src/app/sitemap.ts',
  'src/app/page.tsx',
  'src/app/about/page.tsx',
  'src/lib/i18n/config.ts',
  'src/lib/i18n/navigation.ts'
];

// Count files processed
let processedCount = 0;
let errorCount = 0;

/**
 * Recursively find all TypeScript files
 */
function findTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      findTsFiles(fullPath, fileList);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(fullPath);
    }
  });
  
  return fileList;
}

/**
 * Update file content to remove next-intl imports and use new French system
 */
function updateFileContent(filePath, content) {
  let updated = content;
  const relativePath = path.relative(SRC_DIR, filePath);
  
  // Skip files we've already updated
  if (SKIP_FILES.includes(relativePath)) {
    return null;
  }
  
  // Check if file has next-intl imports
  const hasNextIntl = content.includes('next-intl');
  if (!hasNextIntl) {
    return null;
  }
  
  console.log(`Processing: ${relativePath}`);
  processedCount++;
  
  try {
    // Pattern 1: Server components importing from next-intl/server
    if (content.includes('next-intl/server')) {
      // Remove setRequestLocale and getTranslations imports
      updated = updated.replace(
        /import\s+{[^}]*setRequestLocale[^}]*}[^\n]*;\s*from\s+["']next-intl\/server["'];/g,
        ''
      );
      
      updated = updated.replace(
        /import\s+{[^}]*getTranslations[^}]*}[^\n]*;\s*from\s+["']next-intl\/server["'];/g,
        ''
      );
      
      // Add import for t function
      if (!updated.includes('from "@/lib/fr"') && !updated.includes("from '@/lib/fr'")) {
        // Find the last import statement and add our import
        const lastImportMatch = updated.match(/^(.*import.*\n)*/);
        if (lastImportMatch) {
          const imports = lastImportMatch[0];
          const afterImports = updated.substring(lastImportMatch[0].length);
          updated = imports + 'import { t, getTranslations, setRequestLocale } from "@/lib/fr";\n\n' + afterImports;
        }
      }
      
      // Remove params from function signature
      updated = updated.replace(
        /export\s+(async\s+)?function\s+\w+\s*\(\s*{\s*children,\s*params,\s*}/g,
        'export $1function $&{ children, }'
      );
      
      updated = updated.replace(
        /params:\s*Promise<\s*{\s*locale:\s*string\s*}\s*>/g,
        ''
      );
      
      // Remove locale parameter handling
      updated = updated.replace(
        /const\s+{\s*locale\s*}\s*=\s*await\s+params;\n/g,
        ''
      );
      
      updated = updated.replace(
        /if\s*\(\s*!\s*hasLocale\([^)]*\)\s*\)\s*notFound\(\);/g,
        ''
      );
      
      // Replace setRequestLocale(locale) with setRequestLocale("fr")
      updated = updated.replace(
        /setRequestLocale\(locale\)/g,
        'setRequestLocale("fr")'
      );
      
      // Replace getTranslations("namespace") with direct t function usage
      // This is complex - we'll handle it with a note to manually update
      updated = updated.replace(
        /const\s+t\s*=\s*await\s+getTranslations\([^)]*\);/g,
        '// Use t("namespace.key") directly from @/lib/fr'
      );
    }
    
    // Pattern 2: Client components importing from next-intl
    if (content.includes('from "next-intl"') || content.includes("from 'next-intl'")) {
      // Remove useLocale and useTranslations imports
      updated = updated.replace(
        /import\s+{[^}]*useLocale[^}]*}[^\n]*;\s*from\s+["']next-intl["'];/g,
        ''
      );
      
      updated = updated.replace(
        /import\s+{[^}]*useTranslations[^}]*}[^\n]*;\s*from\s+["']next-intl["'];/g,
        ''
      );
      
      // Add import for t function
      if (!updated.includes('from "@/lib/fr"') && !updated.includes("from '@/lib/fr'")) {
        const lastImportMatch = updated.match(/^(.*import.*\n)*/);
        if (lastImportMatch) {
          const imports = lastImportMatch[0];
          const afterImports = updated.substring(lastImportMatch[0].length);
          updated = imports + 'import { useTranslations, useLocale } from "@/lib/fr";\n\n' + afterImports;
        }
      }
      
      // Note: Client components need more complex handling
      console.log(`  ⚠️  Client component - may need manual review`);
    }
    
    // Replace @/lib/i18n/navigation with next/link
    updated = updated.replace(
      /from\s+["']@\/lib\/i18n\/navigation["']/g,
      'from "next/link"'
    );
    
    // Clean up empty lines
    updated = updated.replace(/\n\n\n+/g, '\n\n');
    
    return updated;
    
  } catch (error) {
    console.error(`  ❌ Error processing ${relativePath}:`, error.message);
    errorCount++;
    return null;
  }
}

/**
 * Main migration function
 */
function migrate() {
  console.log('🚀 Starting i18n migration...\n');
  
  const allFiles = findTsFiles(SRC_DIR);
  console.log(`Found ${allFiles.length} TypeScript files\n`);
  
  let updatedFiles = 0;
  
  allFiles.forEach(filePath => {
    const relativePath = path.relative(SRC_DIR, filePath);
    
    // Skip files we've already updated
    if (SKIP_FILES.includes(relativePath)) {
      return;
    }
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const updated = updateFileContent(filePath, content);
      
      if (updated && updated !== content) {
        fs.writeFileSync(filePath, updated, 'utf8');
        console.log(`  ✅ Updated: ${relativePath}`);
        updatedFiles++;
      }
    } catch (error) {
      console.error(`  ❌ Error reading ${relativePath}:`, error.message);
      errorCount++;
    }
  });
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Migration complete!`);
  console.log(`   Files processed: ${processedCount}`);
  console.log(`   Files updated: ${updatedFiles}`);
  console.log(`   Errors: ${errorCount}`);
  console.log('='.repeat(60));
  console.log('\n⚠️  Note: Some files may need manual review:');
  console.log('   - Client components using hooks (useLocale, useTranslations)');
  console.log('   - Translation calls need to be updated to use t("namespace.key")');
  console.log('   - Check all updated files for any remaining next-intl references');
}

// Run migration
migrate();
