import AL from 'alclient';
import { run as runMage } from './characters/mage.js';
import { run as runMerchant } from './characters/merchant.js';
import { run as runPrometheus, setGold, setMageXp } from './utils/prom.js';

async function run() {
    runPrometheus();

    await Promise.all([AL.Game.loginJSONFile("./credentials.json"), AL.Game.getGData()]);
    await AL.Pathfinder.prepare(AL.Game.G);

    // Merchant Bot
    let merchantBot = await AL.Game.startMerchant("Iqium", "EU", "II");
    console.log(`Logged in as ${merchantBot.name}!`);
    await runMerchant(merchantBot);

    // Mage Bot
    let mageBot = await AL.Game.startMage("Elius", "EU", "II");
    console.log(`Logged in as ${mageBot.name}!`);
    await runMage(mageBot);

    // Update stats every 5 seconds
    setInterval(() => {
        const gold = mageBot.gold + merchantBot.gold;
        const xp = mageBot.xp + merchantBot.xp;
        updateStats(gold, xp);
    }, 5000);
}

async function updateStats(gold: number, xp: number) {
    setGold(gold);
    setMageXp(xp);
}

run();