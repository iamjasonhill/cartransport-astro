import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execPromise = promisify(exec);

// Configuration
const CONTENT_DIR = path.join(__dirname, '../src/content/routes');
const OLLAMA_MODEL = 'llama3'; // Using llama3 as it's the latest available
const MAX_CONTENT_LENGTH = 4000; // Limit content length to avoid token limits

async function checkOllama() {
    try {
        console.log(chalk.blue('🔍 Checking Ollama installation...'));
        await execPromise('ollama --version');
        console.log(chalk.green('✅ Ollama is installed and accessible'));
        return true;
    } catch (error) {
        console.error(chalk.red('❌ Ollama is not installed or not in PATH'));
        console.error(chalk.yellow('Please install Ollama from https://ollama.ai/download'));
        return false;
    }
}

async function checkModel() {
    try {
        console.log(chalk.blue(`🔍 Checking for model ${OLLAMA_MODEL}...`));
        const { stdout } = await execPromise('ollama list');
        const hasModel = stdout.includes(OLLAMA_MODEL);
        if (hasModel) {
            console.log(chalk.green(`✅ Model ${OLLAMA_MODEL} is available`));
            return true;
        } else {
            console.error(chalk.red(`❌ Model ${OLLAMA_MODEL} is not available`));
            console.log(chalk.blue('Available models:'));
            console.log(stdout);
            return false;
        }
    } catch (error) {
        console.error(chalk.red('❌ Error checking models:', error.message));
        return false;
    }
}

async function enhanceContent(text) {
    // Truncate content if too long to avoid token limits
    const truncatedText = text.length > MAX_CONTENT_LENGTH 
        ? text.substring(0, MAX_CONTENT_LENGTH) + '... [content truncated]'
        : text;

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
        const { stdout, stderr } = await execPromise(
            `ollama run ${OLLAMA_MODEL} '${prompt.replace(/\n/g, ' ').replace(/'/g, "'")}'`,
            { 
                maxBuffer: 1024 * 1024 * 10, // 10MB buffer
                timeout: 120000 // 2 minute timeout
            }
        );
        
        if (stderr) {
            console.warn(chalk.yellow('⚠️ Ollama stderr:'), stderr);
        }
        
        return stdout.trim();
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
                
                console.log(chalk.green(`✅ Successfully enhanced ${file}`));
                console.log(chalk.gray(`   Backup saved to ${backupPath}`));
                
            } catch (error) {
                console.error(chalk.red(`❌ Error processing ${file}:`), error.message);
                console.error(chalk.gray(error.stack));
                
                // Ask if user wants to continue with other files
                const readline = await import('readline/promises');
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
        console.error(chalk.gray(error.stack));
        process.exit(1);
    }
}

// Run the script
processFiles();
