import { Character } from "alclient";

async function regen_mp(bot: Character) {
    try {

        const mpot = bot.locateItem("mpot0");
        if (bot.mp < (bot.max_mp - bot.mp_cost)) {
            if (!bot.isOnCooldown("regen_mp")) {
                await bot.regenMP();
            }
            if (mpot && !bot.isOnCooldown("use_mp")) {
                await bot.useMPPot(mpot)
                console.log(`${bot.name} has taken a MP potion. has ${bot.countItem("mpot0")}x MP potions left`);
            }
        }
    } catch (e) {
        console.log(e);
    }
}

async function regen_hp(bot: Character) {
    try {
        if (bot.hp == bot.max_hp) return;

        const hpot = bot.locateItem("hpot0");
        if (!bot.isOnCooldown("regen_hp")){
            await bot.regenHP();
        }

        if(bot.isOnCooldown("use_hp")) {
            console.log(`${bot.name} is on cooldown for using HP potions (${bot.getCooldown("use_hp")} left)`);
        } else {
            await bot.useHPPot(hpot);
            console.log(`${bot.name} has taken a HP potion. has ${bot.countItem("hpot0")}x HP potions left`);
        }
    } catch (e) {
        console.log(e);
    }
}

export { regen_mp, regen_hp };