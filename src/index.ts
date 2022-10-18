import AL, {Character, Merchant, ServerIdentifier, ServerRegion} from 'alclient';
import { run as runMage } from './characters/mage.js';
import { run as runWarrior } from './characters/warrior.js';
import { run as runPriest } from './characters/priest.js';
import {deployPotions, run as runMerchant} from './characters/merchant.js';
import { run as runPrometheus, updateStats } from './utils/prom.js';
import { handleParty } from './utils/party.js';

const bots = [
    {name: "Iqium", type: "merchant", region: "EU", server: "II"},
    {name: "Elius", type: "mage", region: "EU", server: "II"},
    {name: "Trornas", type: "warrior", region: "EU", server: "II"},
    {name: "Krudalf", type: "priest", region: "EU", server: "II"}
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
                case "warrior":
                    const warrior = await AL.Game.startWarrior(bot.name, bot.region as ServerRegion, bot.server as ServerIdentifier);
                    await runWarrior(warrior, botCharacters.get(bots.find((b) => b.type == "merchant")?.name ?? "") as Merchant);
                    botCharacters.set(warrior.name, warrior);
                    break;
                case "priest":
                    const priest = await AL.Game.startPriest(bot.name, bot.region as ServerRegion, bot.server as ServerIdentifier);
                    await runPriest(priest, botCharacters.get(bots.find((b) => b.type == "merchant")?.name ?? "") as Merchant);
                    botCharacters.set(priest.name, priest);
                    break;
            }
        }
        const merchants = bots.filter((b) => b.type == "merchant").map((b) => botCharacters.get(b.name));
        const nonMerchants = bots.filter((b) => b.type != "merchant").map((b) => botCharacters.get(b.name));

        handleParty(merchants[0], nonMerchants)

        // Update stats every 2 seconds
        setInterval(() => botCharacters.forEach((bot) => updateStats(bot)), 2000);

        // Deploy Potions
        setInterval(() => {
            merchants.forEach((merchant) => {
                deployPotions(merchant, nonMerchants);
            });
        }, 10000);
    } catch (e) {
        console.log(e);
    }
}

await run();