import AL, {
  Character, ItemName, Merchant, Tools,
} from 'alclient';
import { getBots } from '../managers/botManager.js';
import logger from '../utils/logger.js';
import { BotCharacter, Bot } from './character.js';

const itemsToKeep: ItemName[] = ['slimestaff', 'gslime', 'beewings', 'scroll0', 'scroll1', 'seashell', 'gem0', 'stand0', 'candy1', 'hpot0', 'mpot0'];
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

      this.bot.buy('hpot0', potsCanAfford).catch(() => {});
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

      this.bot.buy('mpot0', potsCanAfford).catch(() => {});
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

  async collectGold(): Promise<void> {
    if (!this.bot) return;
    if (!this.bot.ready) return;
    const characters = getBots({ exclude: ['merchant'] });
    logger.info(`Starting gold collection for ${this.bot.name}`);

    if (Tools.distance(this.bot, characters[0]) > 400) {
      if (!this.bot.smartMoving) {
        await this.bot.smartMove(characters[0]);
      }
    }

    let goldCollected = 0;

    const updateGold = (gold: number) => {
      goldCollected += gold;
    };

    for (const char of characters) {
      char.sendGold(this.bot!.id, char.gold)
        .then((gold) => {
          logger.info(`${char.name} sent ${gold} gold to ${this.bot?.name ?? 'unknown'}`);
          updateGold(gold);
        })
        .catch(() => {});
    }

    if (goldCollected > 0) {
      logger.info(`${this.bot.name} collected ${goldCollected} gold`);
    }
  }

  async collectItems(): Promise<void> {
    if (!this.bot) return;
    if (!this.bot.ready) return;
    if (this.bot.isFull()) return;
    const characters = getBots({ exclude: ['merchant'] });
    logger.info(`Starting item collection for ${this.bot.name}`);

    if (Tools.distance(this.bot, characters[0]) > 400) {
      if (!this.bot.smartMoving) {
        await this.bot.smartMove(characters[0]);
      }
    }

    let itemsCollected = 0;

    const updateItems = (items: number) => {
      itemsCollected += items;
    };

    for (const char of characters) {
      const items = char.items.filter((c) => c !== null && !itemsDontSend.includes(c.name));

      for (const item of items) {
        if (!item) continue;

        const invItem = char.locateItem(item.name);

        updateItems(item.q ?? 1);

        char.sendItem(this.bot.id, invItem, item.q)
          .then(() => logger.info(`${item.q ?? 1}x ${item.name} sent to ${this.bot?.name ?? 'merchant'}`))
          .catch(() => {});
      }
    }

    if (itemsCollected > 0) {
      logger.info(`${this.bot.name} collected ${itemsCollected} items`);
    }
  }

  async sellItems(): Promise<void> {
    if (!this.bot) return;
    if (!this.bot.ready) return;
    const items = this.bot.items.filter((c) => c !== null && !itemsToKeep.includes(c.name));

    for (const item of items) {
      if (!item) continue;

      const invItem = this.bot.locateItem(item.name);
      this.bot.sell(invItem, item.q)
        .then((sold) => logger.info(`${item.q ?? 1}x ${item.name} was ${sold ? 'sold' : 'not sold'} by ${this.bot?.name ?? 'merchant'}`))
        .catch(() => {});
    }
  }

  async upgrade(): Promise<void> {
    if (!this.bot) return;
    if (!this.bot.ready) return;
    if (this.bot.isFull()) {
      logger.warn(`${this.bot.name}'s inventory is full`);
      return;
    }
    try {
      if (!this.bot.smartMoving) {
        await this.bot.smartMove('scrolls');
      }

      if (this.bot.gold < 1000000) return;

      await this.processUpgrade('slimestaff');
    } catch (e) {
      logger.error(e);
    }
  }

  async performHousekeeping(): Promise<void> {
    if (!this.bot) return;
    if (!this.bot.ready) return;
    try {
      await this.collectGold();
      await this.collectItems();
      await this.sellItems();
      await this.upgrade();
    } catch (e) {
      logger.error(e);
    }
  }

  async startLoops(): Promise<void> {
    // Start Default Loops
    await super.startLoops();

    // Buy Items Loop
    const itemsLoop = setInterval(async () => {
      await this.buyHealthPotions();
      await this.buyManaPotions();
    }, 1000);
    this.loops.push(itemsLoop);

    // Give Luck Loop
    const luckLoop = setInterval(async () => {
      await this.giveLuck();
    }, 250);
    this.loops.push(luckLoop);

    // Housekeeping Loop
    const housekeepingLoop = setInterval(async () => {
      await this.performHousekeeping();
    }, 120000);
    this.loops.push(housekeepingLoop);
  }

  async processUpgrade(
    item: ItemName,
    iteration: number = 1,
  ): Promise<void> {
    try {
      if (!this.bot) return;
      if (this.bot.gold < 1000000) return;
      if (iteration === 10) return;
      if (this.busy || !this.bot.ready) {
        await this.processUpgrade(item);
        return;
      }
      if (!this.bot.smartMoving) {
        await this.bot.smartMove('scrolls');
      }
      if (this.bot.locateItems(item).length > 2) {
        const lowestItem = this.bot.locateItem(item, undefined, { returnLowestLevel: true });
        const scrollType: ItemName = this.bot.items[lowestItem]?.level ?? 0 > 4 ? 'scroll1' : 'scroll0';

        if (!this.bot.canBuy(scrollType)) return;
        logger.warn(`Processing Upgrades (${iteration}/10)`);

        logger.debug(`Buying 1x ${scrollType}`);
        this.bot.buy(scrollType, 1).then(() => {
          if (!this.bot) return;
          const scrollPos = this.bot.locateItem(scrollType);

          this.bot.massProduction().catch(() => {});
          this.bot.useMPPot(this.bot.locateItem('mpot0')).catch(() => {});
          this.bot.upgrade(lowestItem, scrollPos).then((upgradeSuccessful) => {
            if (upgradeSuccessful) {
              logger.info(`Upgraded ${item} to ${this.bot?.items[lowestItem]?.level ?? 'unknown'}`);
            } else {
              logger.info(`Upgrade Failed (lost 1x ${item})`);
            }

            this.processUpgrade(item, iteration + 1);
          });
        }).catch((e) => logger.error(`Failed to buy 1x ${scrollType}: ${e}`));
      }
    } catch (e) {
      logger.error(e);
    }
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
