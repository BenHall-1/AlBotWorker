import AL, { Character } from 'alclient';
import client from 'prom-client';
import express from 'express';
import logger from './logger.js';

const register = new client.Registry();

async function run() {
  register.setDefaultLabels({
    app: 'adventureland-bot',
  });

  const app = express();

  app.get('/metrics', async (req: any, res: any) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });
  app.listen(3000, () => {
    logger.info('Started metrics server on port 3000');
  });
}

function newGauge(name: string, help: string): client.Gauge<'character' | 'character_type'> {
  return new client.Gauge({
    name,
    help,
    labelNames: ['character', 'character_type'],
    registers: [register],
  });
}

const levelGauge = newGauge('level', 'The level of the character');
const xpGauge = newGauge('xp', 'The xp of the character');
const xpNeededGauge = newGauge('xp_needed', 'The xp needed for the character to level up');
const maxDamageGauge = newGauge('max_damage', 'The maximum damage the character can do');
const goldGauge = newGauge('gold', 'The gold of the character');
const healthGauge = newGauge('health', 'The health of the character');
const maxHealthGauge = newGauge('max_health', 'The max health of the character');
const manaGauge = newGauge('mana', 'The mana of the character');
const maxManaGauge = newGauge('max_mana', 'The max mana of the character');

async function updateStats(bot: Character) {
  const labels = { character: bot.name, character_type: bot.ctype };
  levelGauge.labels(labels).set(bot.level);
  xpGauge.labels(labels).set(bot.xp);
  xpNeededGauge.labels(labels).set((AL.Game.G.levels[bot.level + 1] ?? 0) - bot.xp);
  maxDamageGauge.labels(labels).set(bot.attack);
  goldGauge.labels(labels).set(bot.gold);
  healthGauge.labels(labels).set(bot.hp);
  maxHealthGauge.labels(labels).set(bot.max_hp);
  manaGauge.labels(labels).set(bot.mp);
  maxManaGauge.labels(labels).set(bot.max_mp);
}

export { run, updateStats };
