import {Character, Merchant, Tools} from "alclient";

async function sendMoney(bot: Character, merchant: Merchant | undefined) {
    try {
        if (merchant === undefined) return;
        if (bot.gold < 1000) return;

        if (!merchant.smartMoving && Tools.distance(merchant, bot) > 200) {
            await merchant.smartMove(bot);
        }

        console.log(`${bot.name} has over 1,000 gold, sending ${bot.gold} gold to ${merchant.name}...`);
        await bot.sendGold(merchant.name, bot.gold);
    } catch (e) {
        console.log(`An error occurred whilst sending money to ${merchant?.name}: ${e}`);
    }
}

export { sendMoney };