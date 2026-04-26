import { ConfigSchemaType, rootConfigSchema } from './configSchema.js';
import cluster from 'node:cluster';
import http from 'node:http';

export class CreateServerConfig {
    constructor(port, workerCount, config) {
        this.port = port;
        this.workerCount = workerCount;
        this.config = config
    }
}

export async function createServer(config) {
    const {workerCount} = config;
    const workers = new Array(workerCount);

    // MASTER NODE
    if(cluster.isPrimary){
        console.log('Master process!!');

        for(let i=0; i<workerCount; i++){
            cluster.fork({config: JSON.stringify(config.config)});
            console.log(`Worker node spinned: ${i}`);
        }


        const server = http.createServer((req, res) => {

        })


    }else{
        console.log(`Worker node`);
        const config = await rootConfigSchema.parseAsync(JSON.parse(process.env.config));
        
    }
}