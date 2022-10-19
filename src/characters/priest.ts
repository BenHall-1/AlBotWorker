import AL, { Character } from 'alclient';
import { BotCharacter } from './character.js';

export default class PriestBot extends BotCharacter {
  async startBot(): Promise<Character> {
    const priest = await AL.Game.startPriest(this.botName, this.botRegion, this.botServer);
    return this.baseStartBot(priest);
  }
}
