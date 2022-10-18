import AL, {Character, Mage, Merchant, ServerIdentifier, ServerRegion} from 'alclient';
import { run as runMage } from './characters/mage.js';
import {deployPotions, run as runMerchant} from './characters/merchant.js';
import { run as runPrometheus, setGold, setMageXp } from './utils/prom.js';

const bots = [
    {name: "Iqium", type: "merchant", region: "EU", server: "II"},
    {name: "Elius", type: "mage", region: "EU", server: "II"},
    {name: "Erhan", type: "mage", region: "EU", server: "II"}
];
const botCharacters: Map<string, Character> = new Map([]);

async function run() {
    try {
        await runPrometheus();

        await Promise.all([AL.Game.loginJSONFile("./credentials.json"), AL.Game.getGData()]);
        await AL.Pathfinder.prepare(AL.Game.G);

        for (const bot of bots) {
            switch (bot.type) {
                case "merchant":
                    const merchant = await AL.Game.startMerchant(bot.name, bot.region as ServerRegion, bot.server as ServerIdentifier);
                    await runMerchant(merchant);
                    botCharacters.set(merchant.name, merchant);
                    break;
                case "mage":
                    const mage = await AL.Game.startMage(bot.name, bot.region as ServerRegion, bot.server as ServerIdentifier);
                    await runMage(mage, botCharacters.get(bots.find((b) => b.type == "merchant")?.name ?? "") as Merchant);
                    botCharacters.set(mage.name, mage);
                    break;
            }
        }

        // Update stats every 5 seconds
        setInterval(() => {
            let gold = 0;
            let xp = 0;
            botCharacters.forEach((bot) => {
                gold += bot.gold;
                xp += bot.xp;
            });
            updateStats(gold, xp);
        }, 5000);

        // Deploy Potions
        setInterval(() => {
            const merchants = bots.filter((b) => b.type == "merchant").map((b) => botCharacters.get(b.name));
            const nonMerchants = bots.filter((b) => b.type != "merchant").map((b) => botCharacters.get(b.name));
            merchants.forEach((merchant) => {
                deployPotions(merchant, nonMerchants);
            });
        }, 10000);
    } catch (e) {
        console.log(e);
    }
}

async function updateStats(gold: number, xp: number) {
    await setGold(gold);
    await setMageXp(xp);
}

await run();