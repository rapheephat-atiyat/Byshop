const { PermissionFlagsBits, CommandInteraction, Client, EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const { ADMIN, Emoji } = require('../config/config.json');
const Logger = require("../Structures/Logger");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("store")
        .setDescription("แสดงร้านค้า")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    /**
     * 
     * @param {CommandInteraction} interaction 
     * @param {Client} client 
     */
    async execute(interaction, client) {
        if (!ADMIN.includes(interaction.user.id)) return interaction.reply({ content: "STOP! RIGHT THERE CRIMINAL SCUM! YOU VIOLATED THE LAW! 😎😎", flags: ["Ephemeral"] });

        const component = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId("category")
                    .setPlaceholder("กรุณาเลือกหมวดหมู่แอปสตรีมมิ่ง..")
                    .addOptions(
                        {
                            label: "Netflix",
                            emoji: Emoji["Netflix"] || "❔",
                            value: "netflix"
                        },
                        {
                            label: "Youtube Premium",
                            emoji: Emoji["YouTube"] || "❔",
                            value: "youtube"
                        },
                        {
                            label: "Disney+ Hotstar",
                            emoji: Emoji["Disney"] || "❔",
                            value: "disney"
                        },
                        {
                            label: "MONOMAX",
                            emoji: Emoji["Monomax"] || "❔",
                            value: "monomax"
                        },
                        {
                            label: "HBO MAX",
                            emoji: Emoji["Max"] || "❔",
                            value: "max"
                        },
                        {
                            label: "Amazon Prime Video",
                            emoji: Emoji["Prime"] || "❔",
                            value: "prime"
                        },
                        {
                            label: "VIU Premium",
                            emoji: Emoji["VIU"] || "❔",
                            value: "viu"
                        },
                        {
                            label: "iQIYI GOLD",
                            emoji: Emoji["Iqiyi"] || "❔",
                            value: "iqiyi"
                        },
                        {
                            label: "WeTV VIP",
                            emoji: Emoji["Wetv"] || "❔",
                            value: "wetv"
                        },
                        {
                            label: "TrueID+",
                            emoji: Emoji["TrueId"] || "❔",
                            value: "trueid"
                        },
                        {
                            label: "Bilibili",
                            emoji: Emoji["Bilibili"] || "❔",
                            value: "Bilibili "
                        },
                        {
                            label: "CH3 Plus",
                            emoji: Emoji["CH3"] || "❔",
                            value: "ch3"
                        },
                        {
                            label: "YOUKU VIP",
                            emoji: Emoji["Youku"] || "❔",
                            value: "youku"
                        },
                        {
                            label: "oneD",
                            emoji: Emoji["OneD"] || "❔",
                            value: "oneD"
                        },
                        {
                            label: "test",
                            emoji: "❔",
                            value: "TEST"
                        },
                    )
            )

        const embed = new EmbedBuilder()
            .setTitle("ร้านค้าแอปสตรีมมิ่ง")
            .setColor("Aqua")
            .setImage("https://umd-today.files.svdcdn.com/production/es/heroes/streaming_animated_1920x1080.gif")
            .setFooter({ text: "Rapheephat Aiyat" })

        Logger.info(`${interaction.user.tag} used /store command`);
        interaction.reply({ content: "success", flags: ["Ephemeral"] });
        return await interaction.channel.send({ embeds: [embed], components: [component] });
    }
}