import { Character } from "alclient";

const partyMembers = ["Elius", "Trornas", "Krudalf"];

async function handleParty(owner: Character | undefined, bots: (Character | undefined)[]) {
    try {
        if (!owner) return;

        for (const bot of bots) {
            if (!bot) continue;
            console.log(`${owner.name} is not in a party, sending party invite to ${bot.name}...`);
            await owner.sendPartyInvite(bot.name);
            await bot.acceptPartyInvite(owner.name);
            console.log(`${bot.name} joined the party of ${bot.party ?? 'no one'}`);
        }
    } catch (e) {
        console.log(e);
    }
}

export { handleParty };