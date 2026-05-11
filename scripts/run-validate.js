import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

console.log('> Running validation suite');

// Command to run: build, lint, typecheck, and test
const command = 'npm run build:only && npm run lint && npm run check-any && npm run test';

const child = spawn(command, {
    cwd: rootDir,
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe']
});

const write = (data) => {
    process.stdout.write(data);
};

const writeErr = (data) => {
    process.stderr.write(data);
};

child.stdout.on('data', write);
child.stderr.on('data', writeErr);

child.on('close', (code) => {
    if (code !== 0) {
        process.stderr.write(`\n**❌ Validation Failed with exit code: ${code}**\n`);
    } else {
        process.stdout.write(`\n**✅ Validation Passed via run-validate.js**\n`);
    }
    process.exit(code);
});
