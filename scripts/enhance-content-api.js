import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import fetch from 'node-fetch';
import readline from 'readline/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONTENT_DIR = path.join(__dirname, '../src/content/routes');
const OLLAMA_MODEL = 'llama3';
const OLLAMA_API_URL = 'http://localhost:11434/api/generate';
const MAX_CONTENT_LENGTH = 3000; // Keep it under token limits

async function checkOllama() {
    try {
        console.log(chalk.blue('🔍 Checking Ollama API...'));
        const response = await fetch('http://localhost:11434/api/tags');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log(chalk.green('✅ Ollama API is running'));
        return true;
    } catch (error) {
        console.error(chalk.red('❌ Could not connect to Ollama API'), error.message);
        console.error(chalk.yellow('Make sure Ollama is running: ollama serve'));
        return false;
    }
}

async function checkModel() {
    try {
        console.log(chalk.blue(`🔍 Checking for model ${OLLAMA_MODEL}...`));
        const response = await fetch('http://localhost:11434/api/tags');
        const data = await response.json();
        const hasModel = data.models.some(m => m.name.startsWith(OLLAMA_MODEL));
        
        if (hasModel) {
            console.log(chalk.green(`✅ Model ${OLLAMA_MODEL} is available`));
            return true;
        } else {
            console.error(chalk.red(`❌ Model ${OLLAMA_MODEL} is not available`));
            console.log(chalk.blue('Available models:'));
            console.log(data.models.map(m => `- ${m.name}`).join('\n'));
            return false;
        }
    } catch (error) {
        console.error(chalk.red('❌ Error checking models:'), error.message);
        return false;
    }
}

async function enhanceContent(text) {
    // Clean and prepare the content
    const cleanText = text
        .replace(/\s+/g, ' ')
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .trim();

    // Truncate if too long
    const truncatedText = cleanText.length > MAX_CONTENT_LENGTH 
        ? cleanText.substring(0, MAX_CONTENT_LENGTH) + '... [content truncated]'
        : cleanText;

    const prompt = `You are a professional content editor for a car transport company. 
    Please enhance the following content about car transport services. 
    - Make it more engaging and professional
    - Add proper HTML structure with h2, h3, and p tags
    - Ensure good readability and flow
    - Keep the tone professional but friendly
    - Add relevant section headers where appropriate
    - Focus on benefits to the customer
    - Include calls to action where appropriate
    - Don't include any explanations, just return the enhanced content
    
    Here's the content to enhance:
    ${truncatedText}`;

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
        return result.response.trim();
    } catch (error) {
        console.error(chalk.red('❌ Error calling Ollama:'), error.message);
        throw error;
    }
}

async function processFiles() {
    try {
        // Check if Ollama is available
        const isOllamaAvailable = await checkOllama();
        if (!isOllamaAvailable) {
            process.exit(1);
        }

        // Check if model is available
        const isModelAvailable = await checkModel();
        if (!isModelAvailable) {
            console.log(chalk.blue(`\nTo install the model, run: ollama pull ${OLLAMA_MODEL}`));
            process.exit(1);
        }

        const files = await fs.readdir(CONTENT_DIR);
        const jsonFiles = files.filter(file => file.endsWith('.json') && !file.endsWith('.bak'));
        
        if (jsonFiles.length === 0) {
            console.log(chalk.yellow('ℹ️  No JSON files found in the content directory'));
            return;
        }

        console.log(chalk.blue(`\nFound ${jsonFiles.length} files to process`));
        
        for (const file of jsonFiles) {
            const filePath = path.join(CONTENT_DIR, file);
            console.log(chalk.blue(`\n📄 Processing ${file}...`));
            
            try {
                // Read the file
                const fileContent = await fs.readFile(filePath, 'utf-8');
                const data = JSON.parse(fileContent);
                
                if (!data.content) {
                    console.warn(chalk.yellow(`⚠️  No content found in ${file}, skipping`));
                    continue;
                }
                
                console.log(chalk.blue('📝 Original content preview:'));
                console.log(chalk.gray('---\n' + data.content.substring(0, 200) + '...\n---'));
                
                // Enhance the content
                const enhancedContent = await enhanceContent(data.content);
                
                // Create a backup
                const backupPath = `${filePath}.${Date.now()}.bak`;
                await fs.writeFile(backupPath, fileContent, 'utf-8');
                
                // Update the content
                data.content = enhancedContent;
                
                // Save the enhanced content
                await fs.writeFile(
                    filePath,
                    JSON.stringify(data, null, 2),
                    'utf-8'
                );
                
                console.log(chalk.green('✅ Successfully enhanced content'));
                console.log(chalk.gray(`   Backup saved to ${backupPath}`));
                
                // Show preview of enhanced content
                console.log(chalk.blue('✨ Enhanced content preview:'));
                console.log(chalk.gray('---\n' + enhancedContent.substring(0, 200) + '...\n---'));
                
                // Ask if user wants to continue
                const rl = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout
                });
                
                const answer = await rl.question('Continue with next file? (y/n) ');
                rl.close();
                
                if (answer.toLowerCase() !== 'y') {
                    console.log(chalk.yellow('\nProcessing stopped by user'));
                    break;
                }
                
            } catch (error) {
                console.error(chalk.red(`❌ Error processing ${file}:`), error.message);
                
                const rl = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout
                });
                
                const answer = await rl.question('Continue with other files? (y/n) ');
                rl.close();
                
                if (answer.toLowerCase() !== 'y') {
                    console.log(chalk.yellow('\nProcessing stopped by user'));
                    process.exit(1);
                }
            }
        }
        
        console.log(chalk.green('\n🎉 All files processed successfully!'));
    } catch (error) {
        console.error(chalk.red('\n❌ Error processing files:'), error.message);
        process.exit(1);
    }
}

// Run the script
processFiles();
