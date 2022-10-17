import AL, { Mage, MonsterName } from 'alclient';
import { attack, runDefault } from './characters.js';
import { setGold } from '../utils/prom.js';

const targetMonster: MonsterName = "goo";

async function run(bot: Mage) {
    setGold(bot.gold);
    await runDefault(bot);
    
    if (bot.ready){
        const target = bot.getEntity({ canWalkTo: true, type: targetMonster, withinRange: "attack"})
        await attack(bot, target);
    }

    setTimeout(async () => {
        await run(bot)
    }, 1000);
}

export { run };
