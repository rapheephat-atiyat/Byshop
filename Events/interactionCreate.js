const Logger = require("../Structures/Logger");

/** @param {import("../Structures/Bot")} client */

module.exports = (client) => {
    client.on("interactionCreate", async (interaction) => {
        try {
            if(!interaction.isCommand()) return;
            const command = client.commands.get(interaction.commandName);
            if(!command) return interaction.reply({ content: "This command is not available", flags: ["Ephemeral"] });
            await command.execute(interaction, client);
        } catch (err) {
            Logger.error("interactionCreate Event", err);
            return interaction.reply({ content: "There was an error while executing this interaction!", flags: ["Ephemeral"] });
        }
    });
};
