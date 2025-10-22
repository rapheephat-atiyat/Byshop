const { Client } = require("discord.js");
const config = require("../config/config.json");
const Logger = require("./Logger");
const fs = require("fs");
const cron = require('node-cron');
const { cleanupExpiredTransactions } = require('../-DO-NOT-TOUCH/cleanup');

/**
 * @typedef {Object} SlashCommand
 * @property {import("discord.js").SlashCommandBuilder} data
 * @property {(interaction: import("discord.js").Interaction, client: import("discord.js").Client) => Promise<void>} execute
 */

class Bot extends Client {
    #TOKEN;
    constructor() {
        super({
            intents: [
                "Guilds",
                "GuildMessages",
                "MessageContent",
            ]
        });
        this.commands = new Map();
        this.#TOKEN = config.TOKEN;

    }

    /**
     * ตั้งเวลา Cron Job สำหรับตรวจสอบธุรกรรมหมดอายุทุก 5 นาที
     */
    #startScheduler() {
        Logger.info('Initializing Transaction Cleanup Scheduler...');
        cleanupExpiredTransactions();

        cron.schedule('*/5 * * * *', async () => {
            Logger.info('Cron Job Running: Checking for expired transactions...');
            try {
                await cleanupExpiredTransactions();
            } catch (error) {
                Logger.error('Cron Scheduler Error:', error);
            }
        });

        Logger.info('Transaction cleanup is active and running every 5 minutes.');
    }

    async #loadCommands() {
        const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));
        for (const file of commandFiles) {
            /**
             * @type {SlashCommand}
             */
            const command = require(`../Commands/${file}`);
            this.commands.set(command.data.name, command);
        }
    }

    async #loadEvents() {
        const eventFiles = fs.readdirSync("./events").filter(f => f.endsWith(".js"));
        for (const file of eventFiles) {
            const event = require(`../events/${file}`);
            if (typeof event === "function") event(this);
            delete require.cache[require.resolve(`../events/${file}`)];
            Logger.info(`Event Loaded: ${file}`);
        }
    }

    async registerCommands() {
        const commandArray = Array.from(this.commands.values()).map(cmd => cmd.data.toJSON());
        await this.application.commands.set(commandArray);
    }

    async start() {
        this.#loadCommands();
        this.#loadEvents();
        await this.login(this.#TOKEN);

        this.once("clientReady", async () => {
            await this.registerCommands();
            this.#startScheduler();
        });
    }
}

module.exports = Bot;