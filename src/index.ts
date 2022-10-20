import AL, { MonsterName } from 'alclient';
import MageBot from './characters/mage.js';
import WarriorBot from './characters/warrior.js';
import PriestBot from './characters/priest.js';
import { deployPotions, MerchantBot } from './characters/merchant.js';
import { run as runPrometheus } from './utils/prom.js';
import handleParty from './utils/party.js';
import { Bot } from './characters/character.js';
import logger from './utils/logger.js';
import { addBot, getBots } from './managers/botManager.js';

const bots: Bot[] = [
  {
    name: 'Iqium', type: 'merchant', region: 'EU', server: 'II',
  },
  {
    name: 'Elius', type: 'mage', region: 'EU', server: 'II',
  },
  {
    name: 'Trornas', type: 'warrior', region: 'EU', server: 'II',
  },
  {
    name: 'Krudalf', type: 'priest', region: 'EU', server: 'II',
  },
];
const targetMonster: MonsterName = 'goo';

async function run() {
  try {
    await runPrometheus();

    await Promise.all([AL.Game.loginJSONFile('./credentials.json'), AL.Game.getGData()]);
    await AL.Pathfinder.prepare(AL.Game.G);

    bots.forEach(async (bot) => {
      switch (bot.type) {
        case 'merchant': {
          const merchant = await new MerchantBot(bot).startBot();
          addBot(merchant);
          break;
        }
        case 'mage': {
          const mage = await new MageBot(bot, targetMonster).startBot();
          addBot(mage);
          break;
        }
        case 'warrior': {
          const warrior = await new WarriorBot(bot, targetMonster).startBot();
          addBot(warrior);
          break;
        }
        case 'priest': {
          const priest = await new PriestBot(bot, targetMonster).startBot();
          addBot(priest);
          break;
        }
        default: {
          logger.error(`Unknown bot type: ${bot.type}`);
          break;
        }
      }
    });

    const merchants = getBots({ include: ['merchant'] });
    const nonMerchants = getBots({ exclude: ['merchant'] });

    await handleParty(merchants[0], nonMerchants);

    // Deploy Potions
    setInterval(() => {
      getBots({ include: ['merchant'] }).forEach((merchant) => {
        deployPotions(merchant, nonMerchants);
      });
    }, 10000);
  } catch (e) {
    logger.error(e);
  }
}

await run();
