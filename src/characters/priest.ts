import AL, {Character, MonsterName} from 'alclient';
import {BotCharacter, Bot} from "./character.js";

export class PriestBot extends BotCharacter {
    constructor(bot: Bot, target: MonsterName | null) {
        super(bot, target);
    }

    async startBot(): Promise<Character> {
        const priest = await AL.Game.startPriest(this.botName, this.botRegion, this.botServer);
        return this._startBot(priest);
    }
}
