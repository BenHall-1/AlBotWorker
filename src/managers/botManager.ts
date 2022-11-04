import { Character, CharacterType } from 'alclient';

export interface BotFilter {
  include?: CharacterType[];
  exclude?: CharacterType[];
}

const bots: Map<string, Character> = new Map([]);

export function addBot(bot: Character): void {
  bots.set(bot.name, bot);
}

export function getBots(filter: BotFilter | null = null) {
  if (filter === null) {
    return [...bots.values()];
  }
  return [...bots.values()].filter((bot) => {
    if (filter.include !== undefined && filter.include.length > 0) {
      return filter.include.includes(bot.ctype);
    }
    if (filter.exclude !== undefined) {
      return !filter.exclude.includes(bot.ctype);
    }

    return true;
  });
}

export function getBotByType(type: CharacterType): Character {
  return getBots({ include: [type] })[0];
}

export function getBotsByType(type: CharacterType): Character[] {
  return getBots({ include: [type] });
}

export function removeBot(botName: string): void {
  bots.delete(botName);
}
