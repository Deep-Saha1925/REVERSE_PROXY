import { program } from 'commander';
import path from 'node:path';
import { parseYamlConfig, validateConfig } from './config.js';
import cluster from 'node:cluster';
import os from 'node:os';

class CreateServerConfig {
    constructor(port, workerCount) {
        this.port = port;
        this.workerCount = workerCount;
    }
}

async function createServer(config) {
    const {workerCount} = config;
    const workers = new Array(workerCount);

    if(cluster.isPrimary){
        console.log('Master process!!');

        for(let i=0; i<workerCount; i++){
            cluster.fork();
            console.log(`Worker node spinned: ${i}`);
        }
    }else{
        console.log(`Worker node`);
        
    }
}

async function main() {
    program.option('--config <path>', 'Path to config file');
    program.parse(); // cleaner

    const options = program.opts();

    // if (!options.config) {
    //     console.error("Please provide --config");
    //     process.exit(1);
    // }
    // const configPath = path.resolve(process.cwd(), options.config);
    // console.log("Using config:", configPath);
    // try {
    //     const parsedConfig = await parseYamlConfig(configPath);
    //     const validatedConfig = await validateConfig(parsedConfig);

    //     console.log("Valid Config:");
    //     console.dir(validatedConfig, { depth: null });

    // } catch (err) {
    //     console.error("Error:", err.message);
    // }

    if(options && 'config' in options){
        const validatedConfig = validateConfig(await parseYamlConfig(options.config));

        await createServer(new CreateServerConfig((await validatedConfig).server.listen, (await validatedConfig).server.workers ?? os.cpus().length))
    }
}

main();