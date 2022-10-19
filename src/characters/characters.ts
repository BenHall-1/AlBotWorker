import { Character, Entity, MonsterName, Tools } from "alclient";
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
async function attack(bot: Character, targetName: MonsterName) {
    try {
        if (bot.isOnCooldown("attack")) return;

        let target = bot.getEntity({canWalkTo: true, type: targetName, withinRange: "attack"});
        if (!target) {
            await bot.smartMove(targetName);
            target = bot.getEntity({canWalkTo: true, type: targetName, withinRange: "attack"});
        }

        if(!target) return;

        const attack = await bot.basicAttack(target.id);
        console.log(`${bot.name} Attacked ${target.name}_${target.id} for ${attack.damage} damage`);
        await loot(bot);
    } catch (e) {
        console.log(e);
    }
}

// Method for looting
async function loot(bot: Character) {
    try {
    } catch(e) {
        console.error(e);
    }
}


export { runDefault, attack, loot };