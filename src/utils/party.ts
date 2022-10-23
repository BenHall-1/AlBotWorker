import { Character } from 'alclient';
import logger from './logger.js';

export default async function handleParty(
  owner: Character | undefined,
  bots: (Character | undefined)[],
) {
  try {
    if (!owner) return;

    for (const bot of bots) {
      if (!bot) return;
      logger.info(`${owner.name} is not in a party, sending party invite to ${bot.name}...`);
      owner.sendPartyInvite(bot.name)
        .then(() => bot.acceptPartyInvite(owner.name)
          .then(() => logger.info(`${bot.name} joined the party of ${bot.party ?? 'no one'}`))
          .catch(() => {}))
        .catch(() => {});
    }
  } catch (e) {
    logger.error(e);
  }
}
