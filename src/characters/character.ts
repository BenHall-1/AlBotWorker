import {
  Character, CharacterType, Entity, MonsterName, ServerIdentifier, ServerRegion, Tools,
} from 'alclient';
import { updateStats } from '../utils/prom.js';
import logger from '../utils/logger.js';
import { getBots } from '../managers/botManager.js';
import * as db from '../managers/dbManager.js';

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

  loops: NodeJS.Timer[];

  constructor(bot: Bot, target: MonsterName | null) {
    this.botName = bot.name;
    this.botRegion = bot.region;
    this.botServer = bot.server;

    this.bot = null;
    this.target = target;
    this.loops = [];
  }

  async baseStartBot(bot: Character): Promise<Character> {
    this.bot = bot;
    logger.info(`${bot.ctype} logged in as '${bot.name}'`);
    await this.clearLoops();
    await this.startLoops();
    this.bot.socket.on('disconnect', (reason) => {
      logger.warn(`${this.botName} disconnected due to '${reason}', reconnecting in 15 seconds...`);
      setTimeout(() => this.startBot(), 15000);
    });
    return bot;
  }

  abstract startBot(): Promise<Character>;

  async clearLoops(): Promise<void> {
    for (const loop of this.loops) {
      clearInterval(loop);
      this.loops.splice(this.loops.indexOf(loop), 1);
    }
  }

  async startLoops(): Promise<void> {
    // Attack Loop
    const attackLoop = setInterval(async () => {
      await this.attack();
    }, 250);
    this.loops.push(attackLoop);

    // Heal Loop
    const healLoop = setInterval(async () => {
      await this.heal();
    }, 1000);
    this.loops.push(healLoop);

    // Loot Loop
    const lootLoop = setInterval(async () => {
      await this.loot();
    }, 1000);
    this.loops.push(lootLoop);

    // Stats Loop
    const statsLoop = setInterval(async () => {
      await this.updateStats();
    }, 2000);
    this.loops.push(statsLoop);
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

      let targetEntity: Entity;

      if (this.bot.ctype !== 'warrior') {
        targetEntity = getBots({ include: ['warrior'] })[0]?.getTargetEntity();
      } else {
        if (!this.bot.target || this.bot.getTargetEntity() === undefined) {
          targetEntity = this.bot.getEntity({ canWalkTo: true, type: this.target, withinRange: 'attack' });
        } else {
          targetEntity = this.bot.getTargetEntity();
        }
      }

      if (!targetEntity) {
        if (!this.bot.smartMoving) {
          await this.bot.smartMove(this.target);
        }
        return;
      }

      if (this.bot.mp < this.bot.mp_cost) {
        await this.regen_mp();
        return;
      }

      const attack = await this.bot.basicAttack(targetEntity.id);
      logger.debug(`${this.bot.name} Attacked ${targetEntity.name}_${targetEntity.id} for ${attack.damage} damage`);
      db.LogMonsterAttack(`${targetEntity.name}_${targetEntity.id}`, attack.damage ?? 0);
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
        this.bot?.openChest(chest.id).catch(() => {});
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
