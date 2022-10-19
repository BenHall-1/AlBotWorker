import {
  Character, CharacterType, MonsterName, ServerIdentifier, ServerRegion, Tools,
} from 'alclient';
import { updateStats } from '../utils/prom.js';
import logger from '../utils/logger.js';

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

  merchantBotName: string | null;

  bot: Character | null;

  target: MonsterName | null;

  constructor(bot: Bot, merchantBotName: string | null, target: MonsterName | null) {
    this.botName = bot.name;
    this.botRegion = bot.region;
    this.botServer = bot.server;
    this.merchantBotName = merchantBotName;

    this.bot = null;
    this.target = target;
  }

  async baseStartBot(bot: Character): Promise<Character> {
    this.bot = bot;
    await this.startLoops();
    return bot;
  }

  abstract startBot(): Promise<Character>;

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

    // Send Money Loop
    setInterval(async () => {
      await this.sendMoney();
    }, 1000);

    // Stats Loop
    setInterval(async () => {
      await this.updateStats();
    });
  }

  async heal(): Promise<void> {
    await this.regen_hp();
    await this.regen_mp();
  }

  async attack(): Promise<void> {
    if (!this.bot) return;
    if (!this.bot.ready) return;
    try {
      if (!this.target) return;
      if (this.bot.isOnCooldown('attack')) return;

      const target = this.bot.getEntity({ canWalkTo: true, type: this.target, withinRange: 'attack' });

      if (!target) return;

      const attack = await this.bot.basicAttack(target.id);
      logger.info(`${this.bot.name} Attacked ${target.name}_${target.id} for ${attack.damage} damage`);
    } catch (e) {
      logger.error(e);
    }
  }

  async regen_hp(): Promise<void> {
    if (!this.bot) return;
    if (!this.bot.ready) return;
    try {
      if (this.bot.hp === this.bot.max_hp) return;

      const potion = this.bot.locateItem('hpot0');
      if (!this.bot.isOnCooldown('regen_hp')) {
        await this.bot.regenHP();
      }

      if (this.bot.isOnCooldown('use_hp')) return;

      await this.bot.useHPPot(potion);
      logger.info(`${this.bot.name} has taken a HP potion. has ${this.bot.countItem('hpot0')}x HP potions left`);
    } catch (e) {
      logger.error(e);
    }
  }

  async regen_mp(): Promise<void> {
    if (!this.bot) return;
    if (!this.bot.ready) return;
    try {
      if (this.bot.mp === this.bot.max_mp) return;

      const potion = this.bot.locateItem('mpot0');
      if (this.bot.mp < (this.bot.max_mp - this.bot.mp_cost)) {
        if (!this.bot.isOnCooldown('regen_mp')) {
          await this.bot.regenMP();
        }
        if (potion && !this.bot.isOnCooldown('use_mp')) {
          await this.bot.useMPPot(potion);
          logger.info(`${this.bot.name} has taken a MP potion. has ${this.bot.countItem('mpot0')}x MP potions left`);
        }
      }
    } catch (e) {
      logger.error(e);
    }
  }

  async loot(): Promise<void> {
    if (!this.bot) return;
    if (!this.bot.ready) return;
    try {
      Array.from(this.bot.chests.values()).forEach(async (chest) => {
        if (Tools.distance(this.bot!, chest) > 800) {
          if (!this.bot!.smartMoving) {
            await this.bot!.smartMove(chest);
          }
        }
        await this.bot!.openChest(chest.id);
      });
    } catch (e) {
      logger.error(e);
    }
  }

  async sendMoney(): Promise<void> {
    if (!this.bot) return;
    try {
      if (!this.merchantBotName) return;
      if (this.bot.gold < 5000) return;

      await this.bot.sendGold(this.merchantBotName, this.bot.gold);
      logger.info(`${this.bot.name} has over 5,000 gold, depositing ${this.bot.gold} gold in ${this.merchantBotName}'s account`);
    } catch (e) {
      logger.error(e);
    }
  }

  async updateStats(): Promise<void> {
    if (!this.bot) return;
    await updateStats(this.bot);
  }
}
