import AL, {Character, Merchant, Tools} from 'alclient';
import { runDefault } from './characters.js';

async function run(bot: Merchant) {
    await runDefault(bot);
    
    if (bot.ready){
        await buyPotions(bot);
        await giveLuck(bot);
    }

    setTimeout(async () => {
        await run(bot)
    }, 1000);
}

async function giveLuck(bot: Merchant) {
    try {
        const targets = bot.getPlayers({canWalkTo: true, withinRange: "mluck", isNPC: false});
        for (const target of targets) {
            if (!target.s.mluck) continue;
            if (!bot.isOnCooldown("mluck")) continue;
            if (!target.name) continue;

            await bot.mluck(target.name);
        }
    } catch(e) {
        console.log(e);
    }
}

async function buyPotions(bot: Merchant) {
    try {
        if ((bot.countItem("mpot0") < 400) || (bot.countItem("hpot0") < 400)) {
            if (!bot.smartMoving) {
                await bot.smartMove("main");
            }
        }
        if (bot.countItem("mpot0") < 400) {
            const potsCount = 1000 - bot.countItem("mpot0");
            const potsToBuy = Math.min(potsCount, bot.gold / AL.Game.G.items.mpot0.g);
            if (potsToBuy >= 1) {
                await bot.buy("mpot0", potsToBuy);
            }
        }
        if (bot.countItem("hpot0") < 400) {
            const potsCount = 1000 - bot.countItem("hpot0");
            const potsToBuy = Math.min(potsCount, bot.gold / AL.Game.G.items.hpot0.g);
            if (potsToBuy >= 1) {
                await bot.buy("hpot0", potsToBuy);
            }
        }
    } catch (e) {
        console.log(e);
    }
}

async function deployPotions(merchant: Character | undefined, bots: (Character | undefined)[]) {
    try {
        if (!merchant) return;

        const mPotItemLocation = merchant.locateItem("mpot0");
        const hPotItemLocation = merchant.locateItem("hpot0");
        for (const bot of bots) {
            if(!bot) return;

            let mPotToGive = 1000 - bot.countItem("mpot0");
            if (mPotToGive > 0) {
                if (merchant.countItem("mpot0") < mPotToGive) {
                    mPotToGive = merchant.countItem("mpot0");
                }
                if (Tools.distance(merchant, bot) > 200 && !merchant.smartMoving) {
                    await merchant.smartMove(bot)
                }
                await merchant.sendItem(bot.name, mPotItemLocation, mPotToGive);
                console.log(`Gave ${mPotToGive}x mpot0 to ${bot.name}`);
            }

            let hPotToGive = 1000 - bot.countItem("hpot0");
            if (hPotToGive > 0) {
                if (merchant.countItem("hpot0") < hPotToGive) {
                    hPotToGive = merchant.countItem("hpot0");
                }
                if (Tools.distance(merchant, bot) > 200 && !merchant.smartMoving) {
                    await merchant.smartMove(bot)
                }
                await merchant.sendItem(bot.name, hPotItemLocation, hPotToGive);
                console.log(`Gave ${hPotToGive}x hpot0 to ${bot.name}`);
            }
        }
    } catch (e) {
        console.log(e);
    }
}

export { run, deployPotions };
