import client from 'prom-client';
import express from 'express';

const register = new client.Registry();
const goldCounter = new client.Gauge({
    name: 'gold',
    help: 'Gold Collected',
    registers: [register]
});


async function run() {
    register.setDefaultLabels({
        app: 'adventureland-bot'
    });
    client.collectDefaultMetrics({ register });

    const app = express();

    app.get('/metrics', async (req: any, res: any) => {
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
    });
    app.listen(3000, () => {
        console.log("Started metrics server on port 3000");
    } );
}

async function setGold(g: number) {
    goldCounter.set(g);
}

export { run, setGold };