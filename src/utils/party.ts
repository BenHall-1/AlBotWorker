import { Character } from "alclient";

const partyMembers = ["Elius"];

async function sendPartyInvite(bot: Character) {
    try {
        for (const member of partyMembers) {
            if (bot.partyData == null || !bot.partyData.list.includes(member)) {
                console.log(`${bot.name} is not in a party, sending party invite to ${member}...`);
                await bot.sendPartyInvite(member);
            }
        }
    } catch (e) {
        console.log(e);
    }
}

async function acceptPartyInvite(bot: Character) {
    try {
        if (bot.party === undefined) {
            console.log(`${bot.name} is not in a party, accepting party invite...`);
            await bot.acceptPartyInvite("Iqium");
        }
    } catch (e) {
        console.log(e);
    }
}

export { sendPartyInvite, acceptPartyInvite };