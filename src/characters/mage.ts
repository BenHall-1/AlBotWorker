import AL, { Character } from 'alclient';
import { BotCharacter } from './character.js';

export default class MageBot extends BotCharacter {
  async startBot(): Promise<Character> {
    const mage = await AL.Game.startMage(this.botName, this.botRegion, this.botServer);
    return this.baseStartBot(mage);
  }
}
