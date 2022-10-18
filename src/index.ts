import AL, {Character, Merchant, ServerIdentifier, ServerRegion} from 'alclient';
import { run as runMage } from './characters/mage.js';
import {deployPotions, run as runMerchant} from './characters/merchant.js';
import { run as runPrometheus, updateStats } from './utils/prom.js';

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

        // Update stats every 2 seconds
        setInterval(() => botCharacters.forEach((bot) => updateStats(bot)), 2000);

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

await run();