import AL, { Merchant } from 'alclient';
import { sendPartyInvite } from '../utils/party.js';
import { runDefault } from './characters.js';

async function run(bot: Merchant) {
    await runDefault(bot);
    
    if (bot.ready){
        await buyPotions(bot);
        // await sendPartyInvite(bot);
    }

    setTimeout(async () => {
        await run(bot)
    }, 1000);
}

async function buyPotions(bot: Merchant) {
    if ((bot.countItem("mpot0") < 400 )|| (bot.countItem("hpot0") < 400)){
        if (!bot.smartMoving) {
            await bot.smartMove("main");
        }
    }
    if (bot.countItem("mpot0") < 400 ) {
        const potCount = 1000 - bot.countItem("mpot0");
        const potMoney = Math.min(potCount, bot.gold / AL.Game.G.items.mpot0.g);
        if (potMoney > 0) { 
            await bot.buy("mpot0", potMoney);
        }
    }
    if (bot.countItem("hpot0") < 400 ) {
        const potCount = 1000 - bot.countItem("hpot0");
        const potMoney = Math.min(potCount, bot.gold / AL.Game.G.items.hpot0.g);
        if (potMoney > 0) { 
            await bot.buy("hpot0", potMoney);
        }
    }
}

export { run };
