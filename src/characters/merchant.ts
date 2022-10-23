import AL, {
  Character, ItemName, Merchant, Tools,
} from 'alclient';
import { getBots } from '../managers/botManager.js';
import logger from '../utils/logger.js';
import { BotCharacter, Bot } from './character.js';

const itemsToKeep: ItemName[] = ['slimestaff', 'gslime', 'beewings', 'hpamulet', 'scroll0', 'seashell', 'ringsj', 'gem0', 'stand0', 'candy1', 'hpot0', 'mpot0'];
const itemsDontSend: ItemName[] = ['hpot0', 'mpot0'];

export class MerchantBot extends BotCharacter {
  bot: Merchant | null;

  constructor(bot: Bot) {
    super(bot, null);
    this.bot = null;
  }

  async startBot(): Promise<Character> {
    const merchant = await AL.Game.startMerchant(this.botName, this.botRegion, this.botServer);
    this.bot = merchant;
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
      for (const target of targets) {
        if (target.s.mluck) continue;
        if (!this.bot!.isOnCooldown('mluck')) continue;
        if (!target.name) continue;

        this.bot.mluck(target.name).catch(() => {});
      }
    } catch (e) {
      logger.error(e);
    }
  }

  async collectSellAndUpgrade(): Promise<void> {
    if (!this.bot) return;
    if (!this.bot.ready) return;
    if (!this.bot.isFull) {
      logger.warn(`${this.bot.name}'s inventory is full`);
      return;
    }
    try {
      const characters = getBots({ exclude: ['merchant'] });
      for (const char of characters) {
        if (!this.bot) return;
        if (Tools.distance(this.bot, char) > 400) {
          if (!this.bot.smartMoving) {
            this.bot.smartMove(char);
          }
        }

        char.sendGold(this.bot.id, char.gold)
          .then((gold) => logger.info(`${char.name} sent ${gold} gold to ${this.bot?.name ?? 'unknown'}`))
          .catch(() => {});

        const items = char.items.filter((c) => c !== null && !itemsDontSend.includes(c.name));

        for (const item of items) {
          if (!item) continue;
          const invItem = char.locateItem(item.name);
          char.sendItem(this.bot.id, invItem, item.q)
            .then(() => logger.info(`${item.q ?? 1}x ${item.name} sent to ${this.bot?.name ?? 'merchant'}`))
            .catch(() => {});
        }
      }

      for (const item of this.bot.items) {
        if (!item) continue;
        if (itemsToKeep.includes(item.name)) continue;
        const itemLocation = this.bot.locateItem(item.name);

        this.bot.sell(itemLocation, item.q)
          .then(() => logger.info(`${item.q ?? 1}x ${item.name} sold by ${this.bot?.name ?? 'merchant'}`))
          .catch(() => {});
      }

      if (!this.bot.smartMoving) {
        await this.bot.smartMove('scrolls');
      }

      if (this.bot.gold < 1000000) return;

      const scrollCount = this.bot.countItem('scroll0');
      if (scrollCount < 20) {
        await this.bot.buy('scroll0', 20 - scrollCount);
      }

      await this.processUpgrade('slimestaff');
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

    // Collect and Sell Items Loop
    setInterval(async () => {
      await this.collectSellAndUpgrade();
    }, 60000);
  }

  async processUpgrade(item: ItemName, iteration: number = 1): Promise<void> {
    setTimeout(async () => {
      if (!this.bot) return;
      if (this.busy || !this.bot.ready) {
        await this.processUpgrade(item);
        return;
      }
      if (!this.bot.smartMoving) {
        await this.bot.smartMove('scrolls');
      }
      logger.warn('Processing Upgrades');
      if (this.bot.locateItems(item).length > 3) {
        const lowestItem = this.bot.locateItem(item, undefined, { returnLowestLevel: true });
        let scrollPos = 0;

        if (this.bot.items[lowestItem]?.level ?? 0 > 4) {
          if (this.bot.countItem('scroll1') === 0) {
            await this.bot.buy('scroll1', 1);
          }
          scrollPos = this.bot.locateItem('scroll1');
        } else if (this.bot.countItem('scroll1') === 0) {
          await this.bot.buy('scroll0', 1);
          scrollPos = this.bot.locateItem('scroll0');
        }

        this.busy = true;
        if (this.bot.countItem('scroll0') === 0) return;

        this.bot.useMPPot(this.bot.locateItem('mpot0')).catch(() => {});
        this.bot.massProduction().catch(() => {});

        try {
          const success = await this.bot.upgrade(lowestItem, scrollPos);

          if (success) {
            logger.info(`Upgraded ${item} to ${this.bot?.items[lowestItem]?.level ?? 'unknown'}`);
          } else {
            logger.info('Failed to upgrade item (lost the item)');
          }
        } catch (e) {
          logger.error(e);
          return;
        }
        this.busy = false;
        if (iteration === 30) return;
        await this.processUpgrade(item, iteration + 1);
      }
    }, 2000);
  }
}

async function deployPotions(merchant: Character | undefined, bots: (Character | undefined)[]) {
  try {
    if (!merchant) return;
    if (!merchant.ready) return;

    const mPotItemLocation = merchant.locateItem('mpot0');
    const hPotItemLocation = merchant.locateItem('hpot0');
    for (const bot of bots) {
      if (!bot) continue;

      let mPotToGive = 1000 - bot.countItem('mpot0');
      if (mPotToGive > 0) {
        if (merchant.countItem('mpot0') < mPotToGive) {
          mPotToGive = merchant.countItem('mpot0');
        }
        if (Tools.distance(merchant, bot) > 200 && !merchant.smartMoving) {
          merchant.smartMove(bot).catch(() => {});
        }
        merchant.sendItem(bot.name, mPotItemLocation, mPotToGive)
          .then(() => logger.info(`Gave ${mPotToGive}x mpot0 to ${bot.name}`))
          .catch(() => {});
      }

      let hPotToGive = 1000 - bot.countItem('hpot0');
      if (hPotToGive > 0) {
        if (merchant.countItem('hpot0') < hPotToGive) {
          hPotToGive = merchant.countItem('hpot0');
        }
        if (Tools.distance(merchant, bot) > 200 && !merchant.smartMoving) {
          merchant.smartMove(bot).catch(() => {});
        }
        merchant.sendItem(bot.name, hPotItemLocation, hPotToGive)
          .then(() => logger.info(`Gave ${hPotToGive}x hpot0 to ${bot.name}`))
          .catch(() => {});
      }
    }
  } catch (e) {
    logger.error(e);
  }
}

export { deployPotions };
