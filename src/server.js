import { rootConfigSchema } from './configSchema.js';
import cluster from 'node:cluster';
import http from 'node:http';
import { workerMessageSchema, workerMessageReplySchema } from './serverSchema.js';

export class CreateServerConfig {
    constructor(port, workerCount, config) {
        this.port = port;
        this.workerCount = workerCount;
        this.config = config;
    }
}

export async function createServer(config) {
    const { workerCount, port } = config;

    // MASTER NODE
    if (cluster.isPrimary) {
        console.log('Master process!!');

        const WORKER_POOL = [];

        for (let i = 0; i < workerCount; i++) {
            const w = cluster.fork({
                config: JSON.stringify(config.config)
            });
            WORKER_POOL.push(w);
            console.log(`Worker node spinned: ${i}`);
        }

        const server = http.createServer((req, res) => {

            const idx = Math.floor(Math.random() * WORKER_POOL.length);
            const worker = WORKER_POOL[idx];

            if (!worker) {
                res.writeHead(500);
                res.end("Worker not found");
                return;
            }

            const payload = {
                requestType: 'HTTP',
                headers: req.headers,
                body: null,
                url: `${req.url}`
            };

            worker.once('message', async (workerReply) => {
                const reply = await workerMessageReplySchema.parseAsync(JSON.parse(workerReply));

                if (reply.errorCode) {
                    res.writeHead(parseInt(reply.errorCode));
                    res.end(reply.error);
                } else {
                    res.writeHead(200);
                    res.end(reply.data);
                }
            });

            worker.send(JSON.stringify(payload));
        });

        server.listen(port, () => {
            console.log(`Reverse proxy listening on PORT ${port}`);
        });

    } else {
        // WORKER NODE
        console.log(`Worker node`);

        const configParsed = await rootConfigSchema.parseAsync(
            JSON.parse(process.env.config)
        );

        process.on('message', async (msg) => {
            const messageValidated = await workerMessageSchema.parseAsync(JSON.parse(msg));

            const requestURL = messageValidated.url;

            const rule = configParsed.server.rules.find(e => e.path === requestURL);

            if (!rule) {
                const reply = {
                    errorCode: '404',
                    error: 'Rule not found'
                };
                process.send(JSON.stringify(reply));
                return;
            }

            const upstreamID = rule.upstreams[0];

            const upstream = configParsed.server.upstreams.find(e => e.id === upstreamID);

            if (!upstream) {
                const reply = {
                    errorCode: '500',
                    error: 'Upstream not found'
                };
                process.send(JSON.stringify(reply));
                return;
            }

            let upstreamUrl = upstream.url;
            if (!upstreamUrl.startsWith('http')) {
                upstreamUrl = 'http://' + upstreamUrl;
            }

            const urlObj = new URL(upstreamUrl);

            const proxyReq = http.request({
                hostname: urlObj.hostname,
                port: urlObj.port || 80,
                path: requestURL,
                method: 'GET'
            }, (proxyRes) => {

                let body = '';

                proxyRes.on('data', (chunk) => {
                    body += chunk;
                });

                proxyRes.on('end', () => {
                    const reply = {
                        data: body
                    };

                    process.send(JSON.stringify(reply));
                });
            });

            proxyReq.on('error', (err) => {
                const reply = {
                    errorCode: '500',
                    error: err.message
                };
                process.send(JSON.stringify(reply));
            });

            proxyReq.end();
        });
    }
}