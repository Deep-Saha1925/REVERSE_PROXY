import fs from 'node:fs/promises'
import {parse} from 'yaml';

// READ CONFIGURATION 
async function parseYamlConfig(filePath){
    const configFileContent = await fs.readFile(filePath, 'utf8');

    const configParsed = parse(configFileContent);
    return JSON.stringify(configParsed);

}