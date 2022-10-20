import AL, {
  Character, Merchant, Tools,
} from 'alclient';
import logger from '../utils/logger.js';
import { BotCharacter, Bot } from './character.js';

export class MerchantBot extends BotCharacter {
  constructor(bot: Bot) {
    super(bot, null);
  }

  async startBot(): Promise<Character> {
    const merchant = await AL.Game.startMerchant(this.botName, this.botRegion, this.botServer);
    return this.baseStartBot(merchant);
  }

  async buyHealthPotions(): Promise<void> {
    if (!this.bot) return;
    if (!this.bot.ready) return;
    try {
      if (this.bot.countItem('hpot0') > 400) return;
      if (this.bot.smartMoving) return;

      await this.bot.smartMove('main');

      const potsNeeded = 1000 - this.bot.countItem('hpot0');
      const potsCanAfford = Math.min(potsNeeded, this.bot.gold / AL.Game.G.items.hpot0.g);

      if (potsCanAfford < 1) return;

      await this.bot.buy('hpot0', potsCanAfford);
    } catch (e) {
      logger.error(e);
    }
  }

  async buyManaPotions(): Promise<void> {
    if (!this.bot) return;
    if (!this.bot.ready) return;
    try {
      if (this.bot.countItem('mpot0') > 400) return;
      if (this.bot.smartMoving) return;

      await this.bot.smartMove('main');

      const potsNeeded = 1000 - this.bot.countItem('mpot0');
      const potsCanAfford = Math.min(potsNeeded, this.bot.gold / AL.Game.G.items.mpot0.g);

      if (potsCanAfford < 1) return;

      await this.bot.buy('mpot0', potsCanAfford);
    } catch (e) {
      logger.error(e);
    }
  }

  async giveLuck(): Promise<void> {
    if (!this.bot) return;
    if (!this.bot.ready) return;
    try {
      const targets = this.bot.getPlayers({ canWalkTo: true, withinRange: 'mluck', isNPC: false });
      targets.forEach(async (target) => {
        if (!target.s.mluck) return;
        if (!this.bot!.isOnCooldown('mluck')) return;
        if (!target.name) return;

        const bot: Merchant = this.bot as Merchant;
        await bot.mluck(target.name);
      });
    } catch (e) {
      logger.error(e);
    }
  }

  async startLoops(): Promise<void> {
    // Start Default Loops
    await super.startLoops();

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
    if (!merchant.ready) return;

    const mPotItemLocation = merchant.locateItem('mpot0');
    const hPotItemLocation = merchant.locateItem('hpot0');
    bots.forEach(async (bot) => {
      if (!bot) return;

      let mPotToGive = 1000 - bot.countItem('mpot0');
      if (mPotToGive > 0) {
        if (merchant.countItem('mpot0') < mPotToGive) {
          mPotToGive = merchant.countItem('mpot0');
        }
        if (Tools.distance(merchant, bot) > 200 && !merchant.smartMoving) {
          await merchant.smartMove(bot);
        }
        await merchant.sendItem(bot.name, mPotItemLocation, mPotToGive);
        logger.info(`Gave ${mPotToGive}x mpot0 to ${bot.name}`);
      }

      let hPotToGive = 1000 - bot.countItem('hpot0');
      if (hPotToGive > 0) {
        if (merchant.countItem('hpot0') < hPotToGive) {
          hPotToGive = merchant.countItem('hpot0');
        }
        if (Tools.distance(merchant, bot) > 200 && !merchant.smartMoving) {
          await merchant.smartMove(bot);
        }
        await merchant.sendItem(bot.name, hPotItemLocation, hPotToGive);
        logger.info(`Gave ${hPotToGive}x hpot0 to ${bot.name}`);
      }
    });
  } catch (e) {
    logger.error(e);
  }
}

export { deployPotions };
