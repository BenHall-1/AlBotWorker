import {Merchant, MonsterName, Priest} from 'alclient';
import { attack, runDefault } from './characters.js';
import {sendMoney} from "../utils/money.js";

const targetMonster: MonsterName = "goo";

async function run(bot: Priest, merchant: Merchant | undefined) {
    try {
        await runDefault(bot);

        if (bot.ready) {
            await sendMoney(bot, merchant);
            await attack(bot, targetMonster);
        }

        setTimeout(async () => {
            await run(bot, merchant)
        }, 1000);
    } catch (e) {
        console.log(e);
    }
}

export { run };
