import { Character, Entity, Tools } from "alclient";
import { regen_mp } from '../utils/regen.js';

async function runDefault(bot: Character) {
    if (bot.rip){
        console.log(`${bot.name} is dead`);
        try{
            await bot.respawn();
        } catch (e){
            console.error(e);
        }
    }

    if (bot.ready) {
        await regen_mp(bot);
    }
}


// Method for attacking
async function attack(bot: Character, target: Entity) {
    if (target) {
        if (!bot.isOnCooldown("attack")) {
            try {
                const attack = await bot.basicAttack(target.id);
                console.log(`Attacked ${target.name}_${target.id} for ${attack.damage} damage`);
            } catch (e) {
                console.error(e);
            }
        }
    } else {
        try{
            if (!bot.smartMoving){
                await bot.smartMove(target);
            }
        } catch (e){
            console.error(e);
        }
    }

    // Log how much gold the bot has 
    console.log(`${bot.name} has ${bot.gold} gold`);

    await loot(bot);
}

// Method for looting
async function loot(bot: Character) {
    try {
        bot.chests.forEach(async (chest) => {
            if(Tools.distance(bot, chest) > 800) {
                if (!bot.smartMoving){
                    await bot.smartMove(chest);
                }
            }
            
            await bot.openChest(chest.id);
        })
    } catch(e) {
        console.error(e);
    }
}


export { runDefault, attack, loot };