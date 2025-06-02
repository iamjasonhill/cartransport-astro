import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';

// Get the current directory in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const OLD_SITE_DIR = '/Users/jasonhill/websites/cartransport_movingagain/cartransport.movingagain.com.au';
const TEST_ROUTE = 'adelaide-to-sydney';
const TEST_FILE = path.join(OLD_SITE_DIR, TEST_ROUTE, 'index.html');
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
function extractContent(html) {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  
  // Remove scripts and styles
  const elementsToRemove = document.querySelectorAll('script, style, noscript, iframe, form, nav, header, footer');
  elementsToRemove.forEach(el => el.remove());
  
  // Get the main content - adjust selectors as needed
  let content = document.querySelector('main, .main-content, #main, .content, .entry-content, article');
  if (!content) {
    content = document.body;
  }
  
  // Clean up the content
  content.querySelectorAll('*').forEach(el => {
    // Remove all classes and IDs
    el.removeAttribute('class');
    
    const id = el.getAttribute('id');
    if (id && !['main', 'content'].includes(id)) {
      el.removeAttribute('id');
    }
    
    // Remove inline styles
    el.removeAttribute('style');
  });
  
  return content.innerHTML;
}

// Process the test route
async function processTestRoute() {
  // Ensure the old site directory exists
  try {
    await fs.access(OLD_SITE_DIR);
  } catch (error) {
    console.error(`Error: The source directory does not exist: ${OLD_SITE_DIR}`);
    console.log('Please ensure the old site directory exists at the specified location.');
    return false;
  }
  try {
    console.log(`Processing test route: ${TEST_ROUTE}`);
    
    // Read the HTML file
    const html = await fs.readFile(TEST_FILE, 'utf8');
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    // Extract metadata
    const title = document.title.trim() || 'Car Transport Service';
    let description = '';
    
    const metaDesc = document.querySelector('meta[name="description"], meta[property="og:description"]');
    if (metaDesc) {
      description = metaDesc.getAttribute('content') || '';
    }
    
    // Extract content
    const content = extractContent(html);
    
    // Create output object
    const output = {
      title,
      description,
      content
    };
    
    // Ensure output directory exists
    await ensureDir(OUTPUT_DIR);
    
    // Write the JSON file
    const outputPath = path.join(OUTPUT_DIR, `${TEST_ROUTE}.json`);
    await fs.writeFile(outputPath, JSON.stringify(output, null, 2));
    
    console.log(`Test route processed successfully!`);
    console.log(`Output file: ${outputPath}`);
    
    return true;
  } catch (error) {
    console.error('Error processing test route:', error);
    return false;
  }
}

// Main function
async function main() {
  try {
    const success = await processTestRoute();
    if (success) {
      console.log('Test completed successfully! You can now run the development server to see the result.');
      console.log('Run: npm run dev');
    } else {
      console.error('Test failed. Please check the error messages above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('An unexpected error occurred:', error);
    process.exit(1);
  }
}

// Run the test
main().catch(error => {
  console.error('Unhandled error in main:', error);
  process.exit(1);
});
