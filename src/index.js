import { program } from 'commander';
import path from 'node:path';
import { parseYamlConfig, validateConfig } from './config.js';

async function main() {
    program.option('--config <path>', 'Path to config file');

    program.parse(); // cleaner

    const options = program.opts();

    if (!options.config) {
        console.error("❌ Please provide --config");
        process.exit(1);
    }

    const configPath = path.resolve(process.cwd(), options.config);

    console.log("Using config:", configPath);

    try {
        const parsedConfig = await parseYamlConfig(configPath);
        const validatedConfig = await validateConfig(parsedConfig);

        console.log("Valid Config:");
        console.dir(validatedConfig, { depth: null });

    } catch (err) {
        console.error("Error:", err.message);
    }
}

main();