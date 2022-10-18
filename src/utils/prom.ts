import client from 'prom-client';
import express from 'express';
import {Character} from "alclient";

const register = new client.Registry();
const levelGauge = new client.Gauge({
    name: 'level',
    help: 'Levels',
    labelNames: ['character', 'character_type'],
    registers: [register]
});
const xpGauge = new client.Gauge({
    name: 'xp',
    help: 'Total XP for Character',
    labelNames: ['character', 'character_type'],
    registers: [register]
});
const goldGauge = new client.Gauge({
    name: 'gold',
    help: 'Total Gold for Character',
    labelNames: ['character', 'character_type'],
    registers: [register]
});
const healthGauge = new client.Gauge({
    name: 'health',
    help: 'Health for Character',
    labelNames: ['character', 'character_type'],
    registers: [register]
});
const maxHealthGauge = new client.Gauge({
    name: 'max_health',
    help: 'Max Health for Character',
    labelNames: ['character', 'character_type'],
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
    const labels = {character: bot.name, character_type: bot.ctype};
    levelGauge.labels(labels).set(bot.level);
    xpGauge.labels(labels).set(bot.xp);
    goldGauge.labels(labels).set(bot.gold);
    healthGauge.labels(labels).set(bot.hp);
    maxHealthGauge.labels(labels).set(bot.max_hp);
}


export { run, updateStats };