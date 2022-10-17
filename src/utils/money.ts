import { Character } from "alclient";

async function sendMoney(bot: Character) {
    console.log(`${bot.name} has over 1,000 gold, sending money to Iqium...`);
    await bot.sendGold("Iqium", bot.gold);
}
