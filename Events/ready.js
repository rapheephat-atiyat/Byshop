const Logger = require("../Structures/Logger");

/** @param {import("../Structures/Bot")} client */

module.exports = (client) => {
    client.on("clientReady", () => {
        Logger.success(`${client.user.tag} is now online!`);
    });
};
