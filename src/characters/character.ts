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

  bot: Character | null;

  target: MonsterName | null;

  busy: boolean = false;

  constructor(bot: Bot, target: MonsterName | null) {
    this.botName = bot.name;
    this.botRegion = bot.region;
    this.botServer = bot.server;

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

    // Stats Loop
    setInterval(async () => {
      await this.updateStats();
    }, 2000);
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

      const targetEntity = this.bot.getEntity({ canWalkTo: true, type: this.target, withinRange: 'attack' });

      if (!targetEntity && !this.bot.smartMoving) {
        await this.bot.smartMove(this.target);
        return;
      }

      if (this.bot.mp < this.bot.mp_cost) {
        await this.regen_mp();
        return;
      }

      const attack = await this.bot.basicAttack(targetEntity.id);
      logger.info(`${this.bot.name} Attacked ${targetEntity.name}_${targetEntity.id} for ${attack.damage} damage`);
    } catch (e: any) {
      logger.error(e);
    }
  }

  async regen_hp(): Promise<void> {
    if (!this.bot) return;

    if (this.bot.rip) {
      await this.bot.respawn();
    }

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
      for (const chest of this.bot.chests.values()) {
        if (Tools.distance(this.bot!, chest) > 800) {
          if (!this.bot!.smartMoving) {
            this.bot!.smartMove(chest).catch(() => {});
          }
        }
        this.bot!.openChest(chest.id).catch(() => {});
      }
    } catch (e) {
      logger.error(e);
    }
  }

  async updateStats(): Promise<void> {
    if (!this.bot) return;
    await updateStats(this.bot);
  }
}
