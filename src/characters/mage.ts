import AL, {Character, MonsterName} from 'alclient';
import {BotCharacter, Bot} from "./character.js";


export class MageBot extends BotCharacter {
    constructor(bot: Bot, target: MonsterName | null) {
        super(bot, target);
    }

    async startBot(): Promise<Character> {
        const mage = await AL.Game.startMage(this.botName, this.botRegion, this.botServer);
        return this._startBot(mage);
    }
}
