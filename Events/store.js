const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ContainerBuilder, Colors, MediaGalleryBuilder, MediaGalleryItemBuilder, SectionBuilder, ThumbnailBuilder, TextDisplayBuilder, ButtonBuilder, ButtonStyle, SeparatorBuilder, SeparatorSpacingSize, ModalBuilder, LabelBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const Logger = require("../Structures/Logger");
const Byshop = require("../Structures/Byshop");
const QRPayment = require("../Structures/QRPayment");
const { Truemoney } = require("../Structures/Truemoney");
const { TOTAL_PRICE, Emoji } = require("../config/config.json");

const byshop = new Byshop();
const qrpayment = new QRPayment();
const truemoney = new Truemoney();

/** @param {import("../Structures/Bot")} client */
module.exports = (client) => {
    client.on("interactionCreate", async (interaction) => {
        if (interaction.isStringSelectMenu() && interaction.customId === "category") {
            await interaction.deferUpdate();
            const selected = interaction.values[0];

            const products = await byshop.getProduct({ category: selected });
            if (products.length === 0) return interaction.followUp({ content: "ไม่พบสินค้าในหมวดหมู่นี้", flags: ["Ephemeral"] });

            const embed = new EmbedBuilder()
                .setColor("Aqua")
                .setTitle(`หมวดหมู่: ${products[0].category}`)
                .setDescription("> กรุณาเลือกสินค้าที่ต้องการซื้อจากด้านล่างนี้\n *ราคาสินค้าอาจมีการเปลี่ยนแปลง โปรดตรวจสอบอีกครั้งก่อนชำระเงิน*")
                .setThumbnail(`https://images.weserv.nl/?url=${encodeURIComponent(products[0].img.replace(/^https?:\/\//, ""))}`)
                .setFooter({ text: "Made by: Rapheephat Aiyat", iconURL: `https://images.weserv.nl/?url=${encodeURIComponent(products[0].img.replace(/^https?:\/\//, ""))}` });

            const options = products.map(p => {
                return {
                    label: p.name,
                    emoji: Emoji[p.category] || "❔",
                    description: `ราคา: ${TOTAL_PRICE[p.id]} บาท`,
                    value: p.id.toString(),
                }
            })

            const component = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId("product")
                        .setPlaceholder("กรุณาเลือกสินค้า..")
                        .addOptions(options)
                )
            return interaction.followUp({ embeds: [embed], components: [component], flags: ["Ephemeral"] });
        }

        if (interaction.isStringSelectMenu() && interaction.customId === "product") {
            await interaction.deferUpdate();
            const id = interaction.values[0];

            const product = await byshop.getProduct({ id: id });
            if (product.length === 0) return interaction.followUp({ content: "ไม่พบสินค้านี้", flags: ["Ephemeral"] });

            const container = new ContainerBuilder()
                .setAccentColor(product[0].stock == 0 ? Colors.Red : Colors.Aqua)
                .addSectionComponents(
                    new SectionBuilder()
                        .setThumbnailAccessory(
                            new ThumbnailBuilder()
                                .setURL(`https://images.weserv.nl/?url=${encodeURIComponent(product[0].img.replace(/^https?:\/\//, ""))}`)
                        )
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`# ${product[0].name}`),
                            new TextDisplayBuilder().setContent(product[0].stock == 0 ? "😅 *ขออภัยขณะนี้สินค้าหมด*" : `😁 *สินค้าคงเหลือ ${product[0].stock}*`),
                            new TextDisplayBuilder().setContent(`- *ราคา \`${TOTAL_PRICE[id]}\` บาท*\n*-โปรดเลือกช่องทางการชำระเงินด้านล่าง-*`),
                        )
                )
                .addActionRowComponents(
                    new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId("payment")
                                .setDisabled(product[0].stock == 0)
                                .setPlaceholder("โปรดเลือกช่องทางการชำระเงิน")
                                .addOptions(
                                    {
                                        label: "Truemoney wallet (ซองอั่งเปา)",
                                        description: "ฟรีค่าธรรมเนียม",
                                        value: `${id};truewallet`
                                    },
                                    {
                                        label: "QR PromptPay (พร้อมเพย์)",
                                        description: "ฟรีค่าธรรมเนียม",
                                        value: `${id};qrpromtpay`
                                    },
                                    {
                                        label: "Slip (ยืนยันด้วยสลิป)",
                                        description: "เร็วๆนี้",
                                        value: `${id};slip`
                                    },
                                ),
                        ),
                )

            interaction.editReply({ embeds: [], components: [container], flags: ["IsComponentsV2"] })
        }

        if (interaction.isStringSelectMenu() && interaction.customId === "payment") {
            const [id, method] = interaction.values[0].split(";");

            if (method === "qrpromtpay") {
                await interaction.deferUpdate();
                const res = await qrpayment.createTransaction({ userId: interaction.user.id, baseAmount: TOTAL_PRICE[id] });
                if (!res.success);

                const container = new ContainerBuilder()
                    .setAccentColor(Colors.DarkBlue)
                    .addMediaGalleryComponents(
                        new MediaGalleryBuilder()
                            .addItems(
                                new MediaGalleryItemBuilder()
                                    .setURL(res.img),
                            ),
                    )
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`⚠️ *โปรดชำระเงินภายใน <t:${res.expireAtUnix}:R>*`),
                        new TextDisplayBuilder().setContent(`⚠️ *หากชำระเงินแล้วกรุณากด แจ้งโอนเงิน*`),
                    )
                    .addSeparatorComponents(
                        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
                    )
                    .addActionRowComponents(
                        new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setStyle(ButtonStyle.Success)
                                    .setLabel("แจ้งโอนเงิน")
                                    .setEmoji("✅")
                                    .setCustomId(`qr;${res.transaction};${id};confirm`),
                            ),
                    )

                interaction.editReply({ components: [container], flags: ["IsComponentsV2"] })
            }

            if (method === "truewallet") {
                const price = TOTAL_PRICE[id]
                console.log(price);

                const modal = new ModalBuilder()
                    .setCustomId(`tw;${id}`)
                    .setTitle("🧧 ชำระเงินด้วยอั่งเปา")

                const voucherInput = new LabelBuilder()
                    .setLabel("ซองอั่งเปา")
                    .setDescription(`⚠️ ยอดเงินต้องเท่ากับหรือมากกว่า ${price} บาท`)
                    .setTextInputComponent(
                        new TextInputBuilder()
                            .setCustomId("voucher")
                            .setMinLength(74)
                            .setMaxLength(74)
                            .setRequired(true)
                            .setStyle(TextInputStyle.Short)
                    )

                modal.addLabelComponents(voucherInput);
                interaction.showModal(modal);
            }
        }

        if (interaction.isModalSubmit() && interaction.customId.startsWith("tw")) {
            await interaction.deferUpdate();
            const [_, id] = interaction.customId.split(";");

            const voucher = await interaction.fields.getTextInputValue("voucher");
            const success = await truemoney.redeem({ voucher, amount: TOTAL_PRICE[id] });

            if (success) {
                const itemResponse = await byshop.buyProduct({ id, userId: interaction.user.id });
                if (itemResponse.success) {
                    const container = new ContainerBuilder()
                        .setAccentColor(Colors.Aqua)
                        .addSectionComponents(
                            new SectionBuilder()
                                .setThumbnailAccessory(
                                    new ThumbnailBuilder()
                                        .setURL(`https://images.weserv.nl/?url=${encodeURIComponent(itemResponse.data.img.replace(/^https?:\/\//, ""))}`)
                                )
                                .addTextDisplayComponents(
                                    new TextDisplayBuilder().setContent(`*หากเกิดปัญหากรุณาติดต่อแอดมิน*`),
                                    new TextDisplayBuilder().setContent(`# ✅ สั่งซื้อสำเร็จ | ${itemResponse.data.orderid}`),
                                )
                        )
                        .addSeparatorComponents(
                            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
                        )
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`*การสั่งซื้อนี้จะถูกบันทึกไว้ในประวัติการซื้อ*`),
                            new TextDisplayBuilder().setContent(`\`\`\`${itemResponse.data.info}\`\`\``),
                        )


                    return interaction.editReply({ components: [container], flags: ["IsComponentsV2"] });
                }
            }
            return interaction.followUp({ content: `ทำรายการไม่สำเร็จโปรดตรวจสอบความถูกต้อง`, flags: ["Ephemeral"] })
        }

        if (interaction.isButton() && interaction.customId.startsWith("qr")) {
            await interaction.deferUpdate();
            const [_, transaction, id, __] = interaction.customId.split(";");
            const response = await qrpayment.confirmTransaction({ transaction });
            
            if (response.success) {
                const itemResponse = await byshop.buyProduct({ id, userId: interaction.user.id });
                if (itemResponse.success) {
                    const container = new ContainerBuilder()
                        .setAccentColor(Colors.Aqua)
                        .addSectionComponents(
                            new SectionBuilder()
                                .setThumbnailAccessory(
                                    new ThumbnailBuilder()
                                        .setURL(`https://images.weserv.nl/?url=${encodeURIComponent(itemResponse.data.img.replace(/^https?:\/\//, ""))}`)
                                )
                                .addTextDisplayComponents(
                                    new TextDisplayBuilder().setContent(`*หากเกิดปัญหากรุณาติดต่อแอดมิน*`),
                                    new TextDisplayBuilder().setContent(`# ✅ สั่งซื้อสำเร็จ | ${itemResponse.data.orderid}`),
                                )
                        )
                        .addSeparatorComponents(
                            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
                        )
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`*การสั่งซื้อนี้จะถูกบันทึกไว้ในประวัติการซื้อ*`),
                            new TextDisplayBuilder().setContent(`\`\`\`${itemResponse.data.info}\`\`\``),
                        )


                    return interaction.editReply({ components: [container], flags: ["IsComponentsV2"] });
                }
            }
        }
    });
};
