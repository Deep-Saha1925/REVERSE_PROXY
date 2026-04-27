import { ConfigSchemaType, rootConfigSchema } from './configSchema.js';
import cluster, {Worker} from 'node:cluster';
import http from 'node:http';
import { workerMessageSchema, workerMessageReplySchema } from './serverSchema.js';

export class CreateServerConfig {
    constructor(port, workerCount, config) {
        this.port = port;
        this.workerCount = workerCount;
        this.config = config
    }
}

export async function createServer(config) {
    const {workerCount, port} = config;
    const workers = new Array(workerCount);

    // WORKER ARRAY
    const WORKER_POOL = []



    // MASTER NODE
    if(cluster.isPrimary){
        console.log('Master process!!');

        for(let i=0; i<workerCount; i++){
            const w = cluster.fork({config: JSON.stringify(config.config)});
            WORKER_POOL.push(w);
            console.log(`Worker node spinned: ${i}`);
        }

        const server = http.createServer((req, res) => {

            // choosing random worker
            const idx = Math.floor(Math.random() * WORKER_POOL.length);
            const worker = WORKER_POOL.at(idx);

            if(!worker){
                throw new Error("Worker not found!!");
            }

            //assign task to worker
            // req.on('data', )

            const payload = {
                requestType: 'HTTP',
                headers: req.headers,
                body: null,
                url: `${req.url}`
            };
            
            worker.send(JSON.stringify(payload))
            worker.on('message', async (workerReply) => {
                const reply = await workerMessageReplySchema.parseAsync(JSON.parse(workerReply));

                if(reply.errorCode){
                    res.writeHead(parseInt(reply.errorCode));
                    res.end(reply.error);
                    return;
                }else{
                    res.writeHead(200);
                    res.end(reply.data);
                    return;
                }
            })
        });

        server.listen(config.port, ()=> {
            console.log(`Reverse proxy lstening on PORT ${port}`);
        })
    }else{
        console.log(`Worker node`);
        const config = await rootConfigSchema.parseAsync(JSON.parse(process.env.config));
     
        process.on('message', async (msg) => {
            const messageValidated = await workerMessageSchema.parseAsync(JSON.parse(msg));

            // Now parse the path and redirect it to its node by configuration
            const requestURL = messageValidated.url;
            const rule = config.server.rules.find(e => e.path === requestURL)

            if(!rule){
                const reply = {
                    errorCode: '404',
                    error: 'Rule not found'
                };
                process.send(JSON.stringify(reply))
            }

            const upstreamID = rule.upstreams[0];
            const upstream = config.server.upstreams.find(e => e.id === upstreamID) 

            if(!upstream){
                const reply = {
                    errorCode: '500',
                    error: 'Upstream not found'
                };
                process.send(JSON.stringify(reply))
            }

            // REVERSE PROXY
            http.request({host: upstream?.url, path: requestURL}, (proxyRes) => {
                let body = '';

                proxyRes.on('data', (chunk) => {
                    body += chunk
                });

                proxyRes.on('end', () => {
                    const reply = {
                        data: body
                    }

                    process.send(JSON.stringify(reply));
                });
            });
        })
    }
}