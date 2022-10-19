import AL, { Character } from 'alclient';
import { BotCharacter } from './character.js';

export default class WarriorBot extends BotCharacter {
  async startBot(): Promise<Character> {
    const warrior = await AL.Game.startWarrior(this.botName, this.botRegion, this.botServer);
    return this.baseStartBot(warrior);
  }
}
