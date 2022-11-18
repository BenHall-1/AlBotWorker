import AL, { MonsterName } from 'alclient';
import MageBot from './characters/mage.js';
import WarriorBot from './characters/warrior.js';
import PriestBot from './characters/priest.js';
import { deployPotions, MerchantBot } from './characters/merchant.js';
import { run as runPrometheus } from './utils/prom.js';
import handleParty from './utils/party.js';
import { Bot } from './characters/character.js';
import logger from './utils/logger.js';
import { addBot, getBotByType, getBots } from './managers/botManager.js';
import { batchCreate } from './managers/dbManager.js';

async function handleExit() {
  logger.info('Exiting...');
  await Promise.all(getBots().map((bot) => bot.disconnect()));
  process.exit(0);
}

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
const targetMonster: MonsterName = 'squig';

async function run() {
  try {
    await runPrometheus();

    await Promise.all([
      AL.Game.login(process.env.EMAIL!, process.env.PASSWORD),
      AL.Game.getGData(),
    ]);
    await AL.Pathfinder.prepare(AL.Game.G);

    for (const bot of bots) {
      switch (bot.type) {
        case 'merchant': {
          new MerchantBot(bot).startBot()
            .then((char) => addBot(char))
            .catch(() => {});
          break;
        }
        case 'mage': {
          new MageBot(bot, targetMonster).startBot()
            .then((char) => addBot(char))
            .catch(() => {});
          break;
        }
        case 'warrior': {
          new WarriorBot(bot, targetMonster).startBot()
            .then((char) => addBot(char))
            .catch(() => {});
          break;
        }
        case 'priest': {
          new PriestBot(bot, targetMonster).startBot()
            .then((char) => addBot(char))
            .catch(() => {});
          break;
        }
        default: {
          logger.error(`Unknown bot type: ${bot.type}`);
          break;
        }
      }
    }

    const merchant = getBotByType('merchant');
    const nonMerchants = getBots({ exclude: ['merchant'] });

    await handleParty(merchant, nonMerchants);

    // Deploy Potions
    setInterval(() => {
      deployPotions(merchant, nonMerchants);
    }, 60000);

    // Run Database Queries
    setInterval(async () => {
      await batchCreate();
    }, 60000);
  } catch (e) {
    logger.error(e);
    process.exit(1);
  }

  process.on('SIGINT', () => handleExit());
  process.on('SIGQUIT', () => handleExit());
  process.on('SIGTERM', () => handleExit());
}

await run();
