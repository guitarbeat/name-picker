const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const glob = require('glob');

// Define truly shared styles that should be moved
const sharedCategories = {
  base: {
    file: 'src/styles/base.css',
    patterns: ['html', 'body', '*', ':root']
  },
  animations: {
    file: 'src/styles/animations.css',
    patterns: ['@keyframes', 'animation-', 'animate-']
  }
};

// Define patterns that should stay in their component files
const componentSpecific = [
  'composes',  // CSS Modules
  'name-card', // Component-specific styles
  'ranking-',
  'tournament-',
  'login-',
  'profile-'
];

async function reorganizeCSS(dryRun = true) {
  const cssFiles = glob.sync('src/**/*.css');
  const sharedRules = {
    base: new Set(),
    animations: new Set()
  };
  
  // Track duplicates but don't automatically move them
  const duplicates = new Map();

  console.log('\nAnalyzing CSS files...\n');

  // First pass: collect shared styles and track duplicates
  for (const file of cssFiles) {
    const css = fs.readFileSync(file, 'utf8');
    const root = postcss.parse(css);

    root.walkRules(rule => {
      // Skip keyframes in this pass
      if (rule.parent.type === 'atrule' && rule.parent.name === 'keyframes') return;

      const selector = rule.selector;
      const declaration = rule.toString();

      // Track duplicates
      if (!duplicates.has(selector)) {
        duplicates.set(selector, { count: 0, files: new Set(), declaration });
      }
      duplicates.get(selector).count++;
      duplicates.get(selector).files.add(file);

      // Only move to shared if it's not component-specific
      if (!componentSpecific.some(pattern => selector.includes(pattern))) {
        // Check if it belongs in shared categories
        for (const [category, config] of Object.entries(sharedCategories)) {
          if (config.patterns.some(pattern => selector.includes(pattern))) {
            sharedRules[category].add(declaration);
            break;
          }
        }
      }
    });

    // Handle keyframes
    root.walkAtRules('keyframes', rule => {
      sharedRules.animations.add(rule.toString());
    });
  }

  // Show analysis
  console.log('Proposed changes:\n');

  for (const [category, config] of Object.entries(sharedCategories)) {
    const rules = Array.from(sharedRules[category]);
    console.log(`\n${config.file} would contain ${rules.length} rules:`);
    rules.forEach(rule => {
      console.log(`  ${rule.split('\n')[0]}${rule.split('\n').length > 1 ? ' ...' : ''}`);
    });
  }

  console.log('\nDuplicate selectors found (but not automatically moved):');
  for (const [selector, data] of duplicates) {
    if (data.count > 1 && !selector.includes('@keyframes')) {
      console.log(`\n"${selector}" appears in:`);
      data.files.forEach(file => console.log(`  - ${file}`));
    }
  }

  if (!dryRun) {
    console.log('\nApplying changes...');

    // Create shared style files
    for (const [category, config] of Object.entries(sharedCategories)) {
      const rules = Array.from(sharedRules[category]).join('\n\n');
      const content = `/* ${category} styles */\n\n${rules}`;
      fs.writeFileSync(config.file, content);
      console.log(`Created ${config.file}`);
    }

    // Update the main index.css to import shared styles
    const indexContent = `
/* Base styles */
@import './base.css';

/* Animations */
@import './animations.css';

/* Original styles */
@import './variables.css';
@import './utilities.css';
@import './components.css';
`;

    fs.writeFileSync('src/styles/index.css', indexContent);
    console.log('\nCreated src/styles/index.css');

    // Remove only the shared styles from other files
    for (const file of cssFiles) {
      if (Object.values(sharedCategories).some(c => c.file === file)) continue;

      const css = fs.readFileSync(file, 'utf8');
      const root = postcss.parse(css);
      let modified = false;

      // Only remove base elements and animations
      root.walkRules(rule => {
        const selector = rule.selector;
        if (
          sharedCategories.base.patterns.some(p => selector.includes(p)) ||
          (rule.parent.type === 'atrule' && rule.parent.name === 'keyframes')
        ) {
          rule.remove();
          modified = true;
        }
      });

      if (modified) {
        fs.writeFileSync(file, root.toString());
        console.log(`Updated ${file}`);
      }
    }
  } else {
    console.log('\nThis was a dry run. No files were modified.');
    console.log('To apply these changes, run the script with dryRun = false');
  }
}

// Run in dry-run mode first
reorganizeCSS(true).catch(console.error); 