import AL, {Character, Merchant, MonsterName, Tools} from 'alclient';
import {BotCharacter, Bot} from "./character.js";


export class MageBot extends BotCharacter {
    constructor(bot: Bot, target: MonsterName | null) {
        super(bot, target);
    }

    async startBot(): Promise<Character> {
        const merchant = await AL.Game.startMerchant(this.botName, this.botRegion, this.botServer);
        return this._startBot(merchant);
    }

    async buyHealthPotions(): Promise<void> {
        if (!this.bot) return;
        if (this.bot.countItem("hpot0") > 400) return;

        await this.bot.smartMove("main");

        const potsNeeded = 1000 - this.bot.countItem("hpot0");
        const potsCanAfford = Math.min(potsNeeded, this.bot.gold / AL.Game.G.items.hpot0.g);

        if (potsCanAfford < 1) return;

        await this.bot.buy("hpot0", potsCanAfford);
    }

    async buyManaPotions(): Promise<void> {
        if (!this.bot) return;
        if (this.bot.countItem("mpot0") > 400) return;

        await this.bot.smartMove("main");

        const potsNeeded = 1000 - this.bot.countItem("mpot0");
        const potsCanAfford = Math.min(potsNeeded, this.bot.gold / AL.Game.G.items.mpot0.g);

        if (potsCanAfford < 1) return;

        await this.bot.buy("mpot0", potsCanAfford);
    }

    async giveLuck(): Promise<void> {
        if (!this.bot) return;

        const targets = this.bot.getPlayers({ canWalkTo: true, withinRange: "mluck", isNPC: false });
        for (const target of targets) {
            if (!target.s.mluck) continue;
            if (!this.bot.isOnCooldown("mluck")) continue;
            if (!target.name) continue;

            const bot: Merchant = this.bot as Merchant;
            await bot.mluck(target.name);
        }
    }

    async startLoops(): Promise<void> {
        await this.startLoops();

        // Buy Items Loop
        setInterval(async () => {
            await this.buyHealthPotions();
            await this.buyManaPotions();
        }, 1000);

        // Give Luck Loop
        setInterval(async () => {
            await this.giveLuck();
        }, 250);
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

export { deployPotions };
