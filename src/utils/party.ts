import { Character } from 'alclient';
import logger from './logger.js';

export default async function handleParty(
  owner: Character | undefined,
  bots: (Character | undefined)[],
) {
  try {
    if (!owner) return;

    bots.forEach(async (bot) => {
      if (!bot) return;
      logger.info(`${owner.name} is not in a party, sending party invite to ${bot.name}...`);
      await owner.sendPartyInvite(bot.name);
      await bot.acceptPartyInvite(owner.name);
      logger.info(`${bot.name} joined the party of ${bot.party ?? 'no one'}`);
    });
  } catch (e) {
    logger.error(e);
  }
}
