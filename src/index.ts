import AL, {Character, Merchant, MonsterName, ServerIdentifier, ServerRegion} from 'alclient';
import { MageBot } from './characters/mage.js';
import { WarriorBot } from './characters/warrior.js';
import { PriestBot } from './characters/priest.js';
import {deployPotions, run as runMerchant} from './characters/merchant.js';
import { run as runPrometheus } from './utils/prom.js';
import { handleParty } from './utils/party.js';
import {Bot} from "./characters/character.js";

const bots: Bot[] = [
    {name: "Iqium", type: "merchant", region: "EU", server: "II"},
    {name: "Elius", type: "mage", region: "EU", server: "II"},
    {name: "Trornas", type: "warrior", region: "EU", server: "II"},
    {name: "Krudalf", type: "priest", region: "EU", server: "II"}
];
const botCharacters: Map<string, Character> = new Map([]);
const targetMonster: MonsterName = "goo";

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
                    const mage = await new MageBot(bot, targetMonster).startBot();
                    botCharacters.set(bot.name, mage);
                    break;
                case "warrior":
                    const warrior = await new WarriorBot(bot, targetMonster).startBot();
                    botCharacters.set(bot.name, warrior);
                    break;
                    break;
                case "priest":
                    const priest = await new PriestBot(bot, targetMonster).startBot();
                    botCharacters.set(bot.name, priest);
                    break;
            }
        }
        const merchants = bots.filter((b) => b.type == "merchant").map((b) => botCharacters.get(b.name));
        const nonMerchants = bots.filter((b) => b.type != "merchant").map((b) => botCharacters.get(b.name));

        await handleParty(merchants[0], nonMerchants);

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