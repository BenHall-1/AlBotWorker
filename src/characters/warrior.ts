import AL, {Character, MonsterName} from 'alclient';
import {Bot, BotCharacter} from "./character";

export class WarriorBot extends BotCharacter {
    constructor(bot: Bot, target: MonsterName | null) {
        super(bot, target);
    }

    async startBot(): Promise<Character> {
        const warrior = await AL.Game.startWarrior(this.botName, this.botRegion, this.botServer);
        return this._startBot(warrior);
    }
}
