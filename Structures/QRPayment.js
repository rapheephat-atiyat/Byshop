const config = require("../config/config.json");
const { PrismaClient } = require('../generated/prisma');
const Logger = require("./Logger");

const prisma = new PrismaClient();

/**
 * @typedef {Object} QRPaymentResponse
 * @property {number} code
 * @property {string} message
 * @property {QRPaymentData[]} data
 */

/**
 * @typedef {Object} QRPaymentData
 * @property {string} from
 * @property {string} to
 * @property {number} toType
 * @property {string} id
 * @property {string} createdTime
 * @property {string} deliveredTime
 * @property {string} text
 * @property {boolean} hasContent
 * @property {number} contentType
 * @property {QRPaymentContentMetadata} contentMetadata
 * @property {number} sessionId
 */


/**
 * @typedef {Object} QRPaymentContentMetadata
 * @property {string} FLEX_VER
 * @property {string} BOT_CHECK
 * @property {string} FLEX_JSON
 * @property {string} BOT_TRACK
 * @property {string} ALT_TEXT - 'รายการเงินเข้า เข้าบัญชี xxx-x-x5008-x วันที่ 12 ต.ค. 68 เวลา 20:36  น. จำนวนเงิน 1.00  บาท ยอดเงินคงเหลือ 1.37  บาท'
 * @property {string} seq
 */

/**
 * - คลาสนี้สร้างโดย FB: Rapheephat Atiyat
 */
class QRPayment {
    #apiURL;
    #headers;
    #body;
    constructor() {
        this.promtpayIO = "https://promptpay.io";
        this.#apiURL = "https://line-chrome-gw.line-apps.com/api/talk/thrift/Talk/TalkService/getRecentMessagesV2";
        this.#headers = {
            "content-type": "application/json",
            "x-hmac": config.payment.promtpay["x-hmac"],
            "x-line-access": config.payment.promtpay["x-line-access"],
            "x-line-chrome-version": "3.7.1",
        }
        this.#body = [config.payment.promtpay.chatID, 50];
    }

    /**
     * 
     * @param {Object} param0 
     * @param {string} param0.transaction
     * @returns {import("../generated/prisma").Transaction}
     */
    async #getTransaction({ transaction }) {
        const trans = await prisma.transaction.findUnique({
            where: { id: transaction }
        });
        return trans;
    }

    /**
     * 
     * @param {Object} param0 
     * @param {string} param0.transaction
     */
    async confirmTransaction({ transaction }) {
        try {
            const response = await this.#fetchRecentMessages();
            if (!response?.data) {
                return { success: false };
            }

            const transac = await this.#getTransaction({ transaction });
            if (!transac) {
                return { success: false };
            }

            const createdTimeMs = transac.createdAt.getTime();
            const TEN_MINUTES_MS = 10 * 60 * 1000;


            const filtered = response.data.filter(msg => {
                const msgTimeMs = Number(msg.createdTime);
                return msgTimeMs >= createdTimeMs && msgTimeMs <= createdTimeMs + TEN_MINUTES_MS;
            });

            if (!filtered.length) {
                return { success: false };
            }

            const flex = JSON.parse(filtered[0].contentMetadata.FLEX_JSON)
            const bubble = flex.contents[0].body.contents;
            const title = bubble[0].contents[1].contents[0].text;
            const date = bubble[0].contents[1].contents[1].text;
            const account = bubble[2].contents[0].contents[1].text;
            const amountText = bubble[2].contents[1].contents[1].text;

            const amountNumber = parseFloat(amountText.replace(/[^0-9.]/g, ''));

            if (amountNumber === transac.amount && title === "รายการเงินเข้า") {
                await prisma.transaction.update({
                    where: {
                        id: transac.id
                    },
                    data: {
                        status: "COMPLETED",
                    }
                });
                return {
                    success: true,
                    data: { title, date, account, amount: amountText }
                };
            } else {
                return { success: false };
            }
        } catch (err) {
            Logger.error("Error in confirmTransaction:", err)
            return { success: false };
        }
    }

    /**
     * 
     * @returns {QRPaymentResponse}
     */
    async #fetchRecentMessages() {
        const res = await fetch(this.#apiURL, {
            "headers": this.#headers,
            "body": JSON.stringify(this.#body),
            "method": "POST"
        });

        const data = await res.json();
        console.log(data);

        return data;
    }

    async #findOrCreateUser(userId) {
        let user = await prisma.user.findUnique({
            where: { discordId: userId },
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    discordId: userId,
                },
            });
            Logger.info("New user created:", user.id)
        }

        return user;
    }

    /**
     * สร้างธุรกรรม By Rapheephat Atiyat 😎🤨😏
     * @param {Object} param0
     * @param {string} param0.userId - ไอดีลูกค้า
     * @param {number} param0.baseAmount  - ยอดเงิน
     * @returns {{ success: boolean, transaction: string, createdAt: string, expireAtUnix: string, img: string }}
     */
    async createTransaction({ userId, baseAmount }) {
        try {
            if (!userId || !baseAmount) throw new Error("Missing userId or amount");
            const user = await this.#findOrCreateUser(userId);

            const pendingTx = await prisma.transaction.findMany({
                where: {
                    status: "PENDING",
                    amount: {
                        gte: baseAmount,
                        lt: baseAmount + 1
                    }
                },
                select: { amount: true },
                orderBy: { amount: "asc" }
            });

            const used = pendingTx.map(tx => Number(tx.amount.toFixed(2)));
            let amount = baseAmount;
            const maxStep = 99;
            let found = false;

            for (let i = 0; i <= maxStep; i++) {
                const testAmount = Number((baseAmount + i * 0.01).toFixed(2));
                if (!used.includes(testAmount)) {
                    amount = testAmount;
                    found = true;
                    break;
                }
            }

            if (!found) {
                return { success: false, transaction: undefined, createdAt: undefined, expireAtUnix: undefined, img: undefined };
            }

            const transaction = await prisma.transaction.create({
                data: {
                    userId: user.id,
                    amount,
                    status: "PENDING",
                },
            });
            const expireAt = new Date(transaction.createdAt.getTime() + 10 * 60 * 1000);
            const unixTimestamp = Math.floor(expireAt.getTime() / 1000)
            return { success: true, transaction: transaction.id, createdAt: transaction.createdAt, expireAtUnix: unixTimestamp, img: `${this.promtpayIO}/${config.payment.promtpay.number}/${amount}` };
        } catch (err) {
            throw err;
        }
    }
}

module.exports = QRPayment;