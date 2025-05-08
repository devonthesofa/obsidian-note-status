#!/usr/bin/env tsx
/**
 * Obsidian Test Vault Generator
 * 
 * This script generates a large number of markdown files with status tags
 * to test the performance of the Note Status plugin with large vaults.
 * 
 * Usage:
 *   npx tsx generate-test-vault.ts --count 40000 --output ./test-vault
 */

import * as fs from 'fs';
import * as path from 'path';
import { program } from 'commander';

// Define command line options
program
  .option('-c, --count <number>', 'Number of notes to generate', '40000')
  .option('-o, --output <path>', 'Output directory path', './test-vault')
  .option('-t, --tag-prefix <string>', 'Status tag prefix', 'obsidian-note-status')
  .option('-d, --depth <number>', 'Maximum folder depth', '5')
  .option('-m, --max-per-folder <number>', 'Maximum files per folder', '200')
  .parse(process.argv);

const options = program.opts();

// Validate options
const noteCount = parseInt(options.count, 10);
const outputDir = options.output;
const tagPrefix = options.tagPrefix;
const maxDepth = parseInt(options.depth, 10);
const maxPerFolder = parseInt(options.maxPerFolder, 10);

if (isNaN(noteCount) || noteCount <= 0) {
  console.error('Error: Note count must be a positive number');
  process.exit(1);
}

// Define possible statuses (matching your plugin's defaults)
const statuses = [
  'active',
  'onHold',
  'completed',
  'dropped',
  'unknown',
  // Add some from the colorful template
  'idea',
  'draft',
  'inProgress',
  'editing',
  'pending'
];

// Define topics for more realistic note titles
const topics = [
  'Project', 'Meeting', 'Research', 'Idea', 'Book', 'Journal', 
  'Task', 'Recipe', 'Person', 'Place', 'Event', 'Course', 
  'Paper', 'Review', 'Analysis', 'Summary', 'Plan', 'Design',
  'Budget', 'Report', 'Feature', 'Bug', 'Release', 'Backlog',
  'Sprint', 'Goal', 'OKR', 'KPI', 'Metric', 'Reflection'
];

// Generate a random status
function getRandomStatus(): string {
  const multipleStatuses = Math.random() > 0.8; // 20% chance of multiple statuses
  
  if (multipleStatuses) {
    const count = Math.floor(Math.random() * 2) + 2; // 2-3 statuses
    const selectedStatuses = new Set<string>();
    
    while (selectedStatuses.size < count) {
      selectedStatuses.add(statuses[Math.floor(Math.random() * statuses.length)]);
    }
    
    return JSON.stringify(Array.from(selectedStatuses));
  } else {
    return JSON.stringify([statuses[Math.floor(Math.random() * statuses.length)]]);
  }
}

// Generate a random title
function generateTitle(): string {
  const topic = topics[Math.floor(Math.random() * topics.length)];
  const qualifier = Math.random() > 0.5 ? 
    ['New', 'Important', 'Urgent', 'Weekly', 'Monthly', 'Daily', 'Annual'][Math.floor(Math.random() * 7)] : '';
  const number = Math.random() > 0.3 ? Math.floor(Math.random() * 1000).toString() : '';
  
  return [qualifier, topic, number].filter(Boolean).join(' ').trim();
}

// Generate note content with random length
function generateContent(): string {
  const paragraphCount = Math.floor(Math.random() * 5) + 1;
  let content = '';
  
  for (let i = 0; i < paragraphCount; i++) {
    const sentenceCount = Math.floor(Math.random() * 5) + 1;
    let paragraph = '';
    
    for (let j = 0; j < sentenceCount; j++) {
      const wordCount = Math.floor(Math.random() * 15) + 5;
      const sentence = Array(wordCount).fill('lorem').join(' ') + '. ';
      paragraph += sentence;
    }
    
    content += paragraph + '\n\n';
  }
  
  return content;
}

// Create a note with frontmatter containing status
function createNote(title: string, folderPath: string): void {
  const safeName = title.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, ' ');
  const fileName = `${safeName}.md`;
  const filePath = path.join(folderPath, fileName);
  
  // Create frontmatter with random status
  const status = getRandomStatus();
  const frontmatter = `---\n${tagPrefix}: ${status}\n---\n\n`;
  
  // Create content
  const content = `# ${title}\n\n${generateContent()}`;
  
  // Write file
  fs.writeFileSync(filePath, frontmatter + content);
}

// Generate a folder structure and notes
function generateNotes(count: number, baseDir: string): void {
  // Create base directory if it doesn't exist
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }
  
  // Track created files
  let created = 0;
  let foldersCreated = 0;
  
  // Create a function to generate notes in a folder with recursion
  function generateNotesInFolder(folderPath: string, depth: number): void {
    if (created >= count) return;
    
    // Determine how many files to create in this folder
    const filesInThisFolder = Math.min(
      Math.floor(Math.random() * maxPerFolder) + 1,
      count - created
    );
    
    // Create files in this folder
    for (let i = 0; i < filesInThisFolder; i++) {
      if (created >= count) break;
      
      const title = generateTitle();
      createNote(title, folderPath);
      created++;
      
      // Display progress
      if (created % 1000 === 0 || created === count) {
        console.log(`Created ${created}/${count} notes...`);
      }
    }
    
    // Possibly create subfolders if not at max depth
    if (depth < maxDepth && created < count) {
      // Decide how many subfolders to create
      const subfoldersCount = Math.floor(Math.random() * 5) + 1;
      
      for (let i = 0; i < subfoldersCount; i++) {
        if (created >= count) break;
        
        const folderName = `Folder ${++foldersCreated}`;
        const subfolderPath = path.join(folderPath, folderName);
        
        // Create subfolder
        if (!fs.existsSync(subfolderPath)) {
          fs.mkdirSync(subfolderPath);
        }
        
        // Recursively generate notes in subfolder
        generateNotesInFolder(subfolderPath, depth + 1);
      }
    }
  }
  
  // Start generation
  generateNotesInFolder(baseDir, 0);
  
  console.log(`\nSuccessfully created ${created} notes in ${foldersCreated} folders.`);
  console.log(`Output directory: ${path.resolve(baseDir)}`);
}

// Create .obsidian folder with minimal config to ensure it's recognized as a vault
function createObsidianConfig(baseDir: string): void {
  const obsidianDir = path.join(baseDir, '.obsidian');
  if (!fs.existsSync(obsidianDir)) {
    fs.mkdirSync(obsidianDir, { recursive: true });
  }
  
  // Create a minimal config.json
  const configPath = path.join(obsidianDir, 'config.json');
  const config = {
    "baseFontSize": 16,
    "pluginEnabledStatus": {
      "file-explorer": true,
      "global-search": true,
      "switcher": true,
      "graph": true,
      "backlink": true,
      "page-preview": true,
      "templates": true
    }
  };
  
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  
  // Create a minimal appearance.json
  const appearancePath = path.join(obsidianDir, 'appearance.json');
  const appearance = {
    "baseFontSize": 16,
    "theme": "obsidian"
  };
  
  fs.writeFileSync(appearancePath, JSON.stringify(appearance, null, 2));
}

// Main execution
console.log(`Generating ${noteCount} notes in ${outputDir} with tag prefix '${tagPrefix}'`);
console.time('Generation completed in');

// Create test vault
generateNotes(noteCount, outputDir);

// Create Obsidian configuration
createObsidianConfig(outputDir);

console.timeEnd('Generation completed in');
console.log('\nInstructions:');
console.log('1. Open Obsidian');
console.log('2. Select "Open folder as vault"');
console.log(`3. Navigate to: ${path.resolve(outputDir)}`);
console.log('4. Install and enable your Note Status plugin');
console.log('5. Test the plugin performance with this large vault');