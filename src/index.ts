import AL from 'alclient';
import { run as runMage } from './characters/mage.js';
import { run as runPrometheus } from './utils/prom.js';

async function run() {
    runPrometheus();

    await Promise.all([AL.Game.loginJSONFile("./credentials.json"), AL.Game.getGData()]);
    await AL.Pathfinder.prepare(AL.Game.G)

    let mageBot = await AL.Game.startMage("Elius", "EU", "II");
    console.log(`Logged in as ${mageBot.name}!`);
    await runMage(mageBot);
}

run();