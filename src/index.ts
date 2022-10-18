import AL, {Character, Mage, Merchant, ServerIdentifier, ServerRegion} from 'alclient';
import { run as runMage } from './characters/mage.js';
import { run as runMerchant } from './characters/merchant.js';
import { run as runPrometheus, setGold, setMageXp } from './utils/prom.js';

const bots = [
    {name: "Iqium", type: "merchant", region: "EU", server: "II"},
    {name: "Elius", type: "mage", region: "EU", server: "II"}
];
const botCharacters: Map<string, Character> = new Map([]);

async function run() {
    await runPrometheus();

    await Promise.all([AL.Game.loginJSONFile("./credentials.json"), AL.Game.getGData()]);
    await AL.Pathfinder.prepare(AL.Game.G);

    for (const bot of bots) {
        switch(bot.type) {
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

        console.log("Statistics:");

        botCharacters.forEach((bot) => {
            gold += bot.gold;
            xp += bot.xp;
            console.log(`Gold for ${bot.name}: ${bot.gold}`);
            console.log(`XP for ${bot.name}: ${bot.xp}`);
        });

        console.log(``);
        console.log(`Total Gold: ${gold}`);
        console.log(`Total XP: ${xp}`);
        console.log("===============");
        updateStats(gold, xp);
    }, 5000);
}

async function updateStats(gold: number, xp: number) {
    await setGold(gold);
    await setMageXp(xp);
}

await run();