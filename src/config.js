import fs from 'node:fs/promises'
import {parse} from 'yaml';
import {rootConfigSchema} from './configSchema.js';

// READ CONFIGURATION 
export async function parseYamlConfig(filePath){
    const configFileContent = await fs.readFile(filePath, 'utf8');
    const configParsed = parse(configFileContent);
    return configParsed;

}

export async function validateConfig(config){
    const validatedConfig = await rootConfigSchema.parseAsync(config);
    return validatedConfig;
}