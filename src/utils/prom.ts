import client from 'prom-client';
import express from 'express';
import {Character} from "alclient";

const register = new client.Registry();
const levelGauge = new client.Gauge({
    name: 'level',
    help: 'Levels',
    registers: [register]
});
const xpGauge = new client.Gauge({
    name: 'xp',
    help: 'Total XP for Character',
    registers: [register]
});
const goldGauge = new client.Gauge({
    name: 'gold',
    help: 'Total Gold for Character',
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

async function updateStats(bot: Character) {
    levelGauge.set({character: bot.name}, bot.level);
    xpGauge.set({character: bot.name}, bot.xp);
    goldGauge.set({character: bot.name}, bot.gold);
}


export { run, updateStats };