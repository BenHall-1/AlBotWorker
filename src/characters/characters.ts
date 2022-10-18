import { Character, Entity, Tools } from "alclient";
import {regen_hp, regen_mp} from '../utils/regen.js';

async function runDefault(bot: Character) {
    try {
        if (bot.rip) {
            console.log(`${bot.name} is dead`);
            await bot.respawn();
        }

        if (bot.ready) {
            await regen_hp(bot);
            await regen_mp(bot);
        }
    } catch (e) {
        console.log(e);
    }
}


// Method for attacking
async function attack(bot: Character, target: Entity) {
    try {
        if (bot.isOnCooldown("attack")) return;
        if (!target) {
            await bot.smartMove(target);
        }

        const attack = await bot.basicAttack(target.id);
        console.log(`Attacked ${target.name}_${target.id} for ${attack.damage} damage`);
        await loot(bot);
    } catch (e) {
        console.log(e);
    }
}

// Method for looting
async function loot(bot: Character) {
    try {
        for (const chest of bot.chests.values()) {
            if(Tools.distance(bot, chest) > 800) {
                if (!bot.smartMoving){
                    await bot.smartMove(chest);
                }
            }

            await bot.openChest(chest.id);
        }
    } catch(e) {
        console.error(e);
    }
}


export { runDefault, attack, loot };