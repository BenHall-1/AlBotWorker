import { Character } from "alclient";

const partyMembers = ["Elius"];

async function sendPartyInvite(bot: Character) {
    partyMembers.forEach(async (member) => {
        if (bot.partyData == null || !bot.partyData.list.includes(member)) {
            console.log(`${bot.name} is not in a party, sending party invite to ${partyMembers}...`);
            await bot.sendPartyInvite(member);
        }
    });
}

async function acceptPartyInvite(bot: Character) {
    if (bot.party === undefined) {
        console.log(`${bot.name} is not in a party, accepting party invite...`);
        await bot.acceptPartyInvite("Iqium");
    }
}

export { sendPartyInvite, acceptPartyInvite };