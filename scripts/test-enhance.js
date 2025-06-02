import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const TEST_FILE = path.join(__dirname, '../src/content/routes/test-route.json');
const OLLAMA_MODEL = 'llama3';
const OLLAMA_API_URL = 'http://localhost:11434/api/generate';

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

async function testEnhance() {
    try {
        console.log(chalk.blue('\n🚀 Starting test enhancement...'));
        
        // Check if test file exists
        try {
            await fs.access(TEST_FILE);
        } catch (error) {
            console.error(chalk.red(`❌ Test file not found: ${TEST_FILE}`));
            return;
        }
        
        console.log(chalk.blue(`📄 Found test file: ${TEST_FILE}`));
        
        // Read the test file
        const fileContent = await fs.readFile(TEST_FILE, 'utf-8');
        const data = JSON.parse(fileContent);
        
        console.log(chalk.blue('\n📝 Original content:'));
        console.log(chalk.gray('---\n' + data.content + '\n---\n'));
        
        // Create a simple test prompt
        const testPrompt = `Just respond with "TEST SUCCESSFUL" if you can read this.`;
        
        console.log(chalk.blue('🔄 Testing Ollama API...'));
        
        try {
            const response = await fetch(OLLAMA_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: OLLAMA_MODEL,
                    prompt: testPrompt,
                    stream: false
                })
            });
            
            if (!response.ok) {
                const error = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, body: ${error}`);
            }
            
            const result = await response.json();
            
            console.log(chalk.green('✅ Ollama response:'));
            console.log(chalk.gray('---\n' + result.response + '\n---'));
            
            console.log(chalk.green('\n🎉 Test completed successfully! Ollama is working correctly.'));
            
        } catch (error) {
            console.error(chalk.red('❌ Error calling Ollama:'), error.message);
            if (error.stderr) {
                console.error(chalk.red('Ollama stderr:'), error.stderr);
            }
            throw error;
        }
        
    } catch (error) {
        console.error(chalk.red('\n❌ Test failed:'), error.message);
        process.exit(1);
    }
}

// Run the test
async function main() {
    try {
        const isOllamaAvailable = await checkOllama();
        if (!isOllamaAvailable) {
            process.exit(1);
        }

        const isModelAvailable = await checkModel();
        if (!isModelAvailable) {
            console.log(chalk.blue(`\nTo install the model, run: ollama pull ${OLLAMA_MODEL}`));
            process.exit(1);
        }
        
        await testEnhance();
    } catch (error) {
        console.error(chalk.red('\n❌ Fatal error:'), error);
        process.exit(1);
    }
}

main();
