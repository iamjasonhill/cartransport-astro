const fs = require('fs').promises;
const path = require('path');
const cheerio = require('cheerio');
const { JSDOM } = require('jsdom');

// Configuration
const OLD_SITE_DIR = '/Users/jasonhill/websites/cartransport_movingagain/cartransport.movingagain.com.au';
const OUTPUT_DIR = path.join(process.cwd(), 'src/content/routes');

// Ensure output directory exists
async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

// Extract main content from HTML
function extractContent(html, filePath) {
  try {
    const $ = cheerio.load(html);
    
    // Remove scripts and styles
    $('script, style, noscript, iframe, form, nav, header, footer').remove();
    
    // Get the main content - adjust selectors as needed
    let content = $('main, .main-content, #main, .content, .entry-content, article').first();
    if (!content.length) {
      content = $('body');
    }
    
    // Clean up the content
    content.find('*').each(function() {
      const classes = $(this).attr('class') || '';
      const id = $(this).attr('id') || '';
      
      // Remove unnecessary classes and IDs
      if (classes) {
        $(this).removeAttr('class');
      }
      if (id && !['main', 'content'].includes(id)) {
        $(this).removeAttr('id');
      }
      
      // Remove inline styles
      $(this).removeAttr('style');
    });
    
    return content.html() || '';
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return '';
  }
}

// Process a single HTML file
async function processHtmlFile(filePath, relativePath) {
  try {
    const html = await fs.readFile(filePath, 'utf8');
    const $ = cheerio.load(html);
    
    // Extract metadata
    const title = $('title').text().trim() || 'Car Transport Service';
    const description = $('meta[name="description"]').attr('content') || 
                       $('meta[property="og:description"]').attr('content') ||
                       'Professional car transport services across Australia';
    
    // Extract content
    const content = extractContent(html, filePath);
    
    // Create output object
    const output = {
      title,
      description,
      content
    };
    
    // Determine output path
    let outputPath = path.join(OUTPUT_DIR, relativePath);
    
    // If it's an index.html, use the directory name
    if (path.basename(outputPath) === 'index.html') {
      outputPath = path.dirname(outputPath);
    }
    
    // Change .html to .json
    outputPath = outputPath.replace(/\.html$/, '.json');
    
    // Ensure the directory exists
    await ensureDir(path.dirname(outputPath));
    
    // Write the JSON file
    await fs.writeFile(outputPath, JSON.stringify(output, null, 2));
    console.log(`Processed: ${outputPath}`);
    
    return true;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
}

// Recursively process directory
async function processDirectory(dir, relativeDir = '') {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.join(relativeDir, entry.name);
      
      if (entry.isDirectory()) {
        await processDirectory(fullPath, relativePath);
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        await processHtmlFile(fullPath, relativePath);
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dir}:`, error);
  }
}

// Main function
async function main() {
  try {
    console.log('Starting migration...');
    await ensureDir(OUTPUT_DIR);
    await processDirectory(OLD_SITE_DIR);
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
