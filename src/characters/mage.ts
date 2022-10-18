import {Mage, Merchant, MonsterName} from 'alclient';
import { attack, runDefault } from './characters.js';
import {sendMoney} from "../utils/money.js";

const targetMonster: MonsterName = "goo";

async function run(bot: Mage, merchant: Merchant | undefined) {
    try {
        await runDefault(bot);

        if (bot.ready) {
            await sendMoney(bot, merchant);
            // await acceptPartyInvite(bot);

            const target = bot.getEntity({canWalkTo: true, type: targetMonster, withinRange: "attack"})
            await attack(bot, target);
        }

        setTimeout(async () => {
            await run(bot, merchant)
        }, 1000);
    } catch (e) {
        console.log(e);
    }
}

export { run };
