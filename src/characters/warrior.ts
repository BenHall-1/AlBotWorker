import AL, { Character, Warrior } from 'alclient';
import { BotCharacter } from './character.js';

export default class WarriorBot extends BotCharacter {
  async startBot(): Promise<Character> {
    const warrior = await AL.Game.startWarrior(this.botName, this.botRegion, this.botServer);
    return this.baseStartBot(warrior);
  }

  async startLoops(): Promise<void> {
    await super.startLoops();

    const tauntLoop = setInterval(async () => {
      await this.taunt();
    }, 1000);
    this.loops.push(tauntLoop);
  }

  async taunt(): Promise<void> {
    if (!this.bot) return;
    if (!this.bot.rip) return;
    if (!this.bot.ready) return;

    const warrior: Warrior = this.bot as Warrior;

    const { target } = this.bot;
    if (!target) return;

    if (this.bot.isOnCooldown('taunt')) return;

    await warrior.taunt(target);
  }
}
