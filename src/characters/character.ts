import {Character, CharacterType, MonsterName, ServerIdentifier, ServerRegion, Tools} from "alclient";
import {updateStats} from "../utils/prom.js";

export interface Bot {
    name: string;
    type: CharacterType;
    region: ServerRegion;
    server: ServerIdentifier;
}

export abstract class BotCharacter {
    botName: string;
    botRegion: ServerRegion;
    botServer: ServerIdentifier;

    bot: Character | null;
    target: MonsterName | null;

    protected constructor(bot: Bot, target: MonsterName | null) {
        this.botName = bot.name;
        this.botRegion = bot.region;
        this.botServer = bot.server;

        this.bot = null;
        this.target = target;
    }

    async _startBot(bot: Character): Promise<Character> {
        this.bot = bot;
        await this.startLoops();
        return bot;
    }

    abstract startBot(): Promise<Character>

    async startLoops(): Promise<void> {
        // Attack Loop
        setInterval(async () => {
            await this.attack();
        }, 250);

        // Heal Loop
        setInterval(async () => {
            await this.heal();
        }, 1000);

        // Loot Loop
        setInterval(async () => {
            await this.loot();
        }, 1000);

        // Stats Loop
        setInterval(async () => {
            await this.updateStats();
        })
    }

    async heal(): Promise<void> {
        await this.regen_hp();
        await this.regen_mp();
    }

    async attack(): Promise<void> {
        if (!this.bot) return;
        if (!this.target) return;
        if (this.bot.isOnCooldown("attack")) return;

        let target = this.bot.getEntity({canWalkTo: true, type: this.target, withinRange: "attack"});

        if(!target) return;

        const attack = await this.bot.basicAttack(target.id);
        console.log(`${this.bot.name} Attacked ${target.name}_${target.id} for ${attack.damage} damage`);
    }

    async regen_hp(): Promise<void> {
        if (!this.bot) return;
        try {
            if (this.bot.hp == this.bot.max_hp) return;

            const potion = this.bot.locateItem("hpot0");
            if (!this.bot.isOnCooldown("regen_hp")){
                await this.bot.regenHP();
            }

            if(this.bot.isOnCooldown("use_hp")) return;

            await this.bot.useHPPot(potion);
            console.log(`${this.bot.name} has taken a HP potion. has ${this.bot.countItem("hpot0")}x HP potions left`);
        } catch (e) {
            console.log(e);
        }
    }

    async regen_mp(): Promise<void> {
        if (!this.bot) return;
        try {
            if(this.bot.mp == this.bot.max_mp) return;

            const potion = this.bot.locateItem("mpot0");
            if (this.bot.mp < (this.bot.max_mp - this.bot.mp_cost)) {
                if (!this.bot.isOnCooldown("regen_mp")) {
                    await this.bot.regenMP();
                }
                if (potion && !this.bot.isOnCooldown("use_mp")) {
                    await this.bot.useMPPot(potion)
                    console.log(`${this.bot.name} has taken a MP potion. has ${this.bot.countItem("mpot0")}x MP potions left`);
                }
            }
        } catch (e) {
            console.log(e);
        }
    }

    async loot(): Promise<void> {
        if (!this.bot) return;

        for (const chest of this.bot.chests.values()) {
            if(Tools.distance(this.bot, chest) > 800) {
                if (!this.bot.smartMoving){
                    await this.bot.smartMove(chest);
                }
            }

            await this.bot.openChest(chest.id);
        }
    }

    async updateStats(): Promise<void> {
        if (!this.bot) return;
        await updateStats(this.bot);
    }

}
