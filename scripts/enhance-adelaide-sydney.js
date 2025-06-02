import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const ROUTE_FILE = path.join(__dirname, '../src/content/routes/adelaide-to-sydney.json');
const OLLAMA_MODEL = 'llama3';
const OLLAMA_API_URL = 'http://localhost:11434/api/generate';

async function enhanceContent(text) {
    const prompt = `You are a professional web content editor for a car transport company. 
    Please enhance the following content about car transport services from Adelaide to Sydney with these requirements:
    
    1. FORMATTING:
    - Use proper HTML5 semantic structure
    - Use h2 for main section headings
    - Use h3 for subsection headings
    - Use p for paragraphs
    - Use ul/li for lists
    - Use strong for emphasis
    - Do not include any markdown, only HTML
    
    2. CONTENT:
    - Keep the tone professional but friendly
    - Focus on customer benefits for Adelaide to Sydney transport
    - Include clear calls to action
    - Add relevant sections if missing
    - Keep all original key information
    - Include specific details about Adelaide to Sydney route
    
    3. STRUCTURE:
    - Start with a compelling introduction
    - Group related information in sections
    - End with a strong call to action
    - Use proper heading hierarchy
    
    Here's the content to enhance (convert to HTML):
    ${text}
    
    Return ONLY the enhanced HTML content, no explanations or introductory text.`;

    console.log(chalk.blue('🔄 Sending content to Ollama for enhancement...'));
    
    try {
        const response = await fetch(OLLAMA_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                prompt: prompt,
                stream: false
            })
        });
        
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, body: ${error}`);
        }
        
        const result = await response.json();
        let content = result.response.trim();
        
        // Remove any leading text before the first HTML tag
        const firstTagMatch = content.match(/<[a-z][\s\S]*>/i);
        if (firstTagMatch) {
            content = content.substring(firstTagMatch.index);
        }
        
        // Remove common leading text patterns
        const leadingTextPatterns = [
            /^Here is the enhanced content:[\s\n]*/i,
            /^Enhanced content:[\s\n]*/i,
            /^Here's the enhanced content:[\s\n]*/i,
            /^<p>Here is the enhanced content:<\/p>[\s\n]*/i,
            /^<p>Enhanced content:<\/p>[\s\n]*/i,
            /^<p>Here's the enhanced content:<\/p>[\s\n]*/i
        ];
        
        leadingTextPatterns.forEach(pattern => {
            content = content.replace(pattern, '');
        });
        
        return content.trim();
    } catch (error) {
        console.error(chalk.red('❌ Error calling Ollama:'), error.message);
        throw error;
    }
}

async function main() {
    try {
        console.log(chalk.blue('🚀 Starting enhancement for Adelaide to Sydney route...'));
        
        // Read the route file
        const fileContent = await fs.readFile(ROUTE_FILE, 'utf-8');
        const data = JSON.parse(fileContent);
        
        console.log(chalk.blue('📝 Original content preview:'));
        console.log(chalk.gray('---\n' + data.content.substring(0, 200) + '...\n---'));
        
        // Enhance the content
        const enhancedContent = await enhanceContent(data.content);
        
        // Create a timestamped backup
        const backupPath = `${ROUTE_FILE}.${Date.now()}.bak`;
        await fs.writeFile(backupPath, fileContent, 'utf-8');
        
        // Update the content
        data.content = enhancedContent;
        
        // Save the enhanced content
        await fs.writeFile(
            ROUTE_FILE,
            JSON.stringify(data, null, 2),
            'utf-8'
        );
        
        console.log(chalk.green('✅ Successfully enhanced content'));
        console.log(chalk.blue('✨ Enhanced content preview:'));
        console.log(chalk.gray('---\n' + enhancedContent.substring(0, 200) + '...\n---'));
        console.log(chalk.green(`\n🎉 Enhancement complete! Backup saved to ${backupPath}`));
        
    } catch (error) {
        console.error(chalk.red('\n❌ Error:'), error.message);
        process.exit(1);
    }
}

main();
