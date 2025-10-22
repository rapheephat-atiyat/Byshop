const { BYSHOP_API_KEY } = require("../config/config.json");
const { PrismaClient } = require('../generated/prisma');
const Logger = require("./Logger");

const prisma = new PrismaClient();

class Byshop {
    #KEY_API;
    constructor() {
        this.BASE_URL = "https://byshop.me/api";

        this.CHECKMONEY_URL = `${this.BASE_URL}/checkmoney`;
        this.GET_PRODUCT_URL = `${this.BASE_URL}/product`;
        this.BUY_URL = `${this.BASE_URL}/buy`;

        // ------------------OTP ZONE --------------------
        this.OTP_DISNEY_URL = `${this.BASE_URL}/otp_disney`;
        this.OTP_TRUEID = `${this.BASE_URL}/otp_trueid`;
        this.OTP_AISPLAY = `${this.BASE_URL}/otp_aisplay`;
        this.OTP_BEINSPORTS = `${this.BASE_URL}/otp_beinsports`;
        // ------------------OTP ZONE --------------------
        this.#KEY_API = BYSHOP_API_KEY;
    }

    get money() {
        return fetch(this.CHECKMONEY_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                keyapi: this.#KEY_API
            })
        }).then(res => {
            if (!res.ok) throw new Error(`Byshop - checkMoney: ${res.status} ${res.statusText}`);
            return res.json();
        }).catch(err => {
            Logger.error("Byshop - checkMoney", err);
            return 0;
        });
    }


    /**
     * 
     * @param {Object} param0 
     * @param {string} param0.id
     * @param {string} param0.userId
     * @returns {Promise<{ success: boolean, message: string, data: Object }>}
     */
    async buyProduct({ id, userId }) {
        if (!id || !userId) return { success: false, message: "Missing id or userId", data: [] }
        try {
            const formData = new FormData();
            formData.append("id", id);
            formData.append("keyapi", this.#KEY_API);
            formData.append("username_customer", userId);

            const response = await fetch(this.BUY_URL, {
                method: "POST",
                body: formData
            });

            const data = await response.json();

            if (data.status != "success") return { success: false, message: data.message, data: [] };
            const cleanInfo = this.#stripHtmlButKeepLinks(data.info);
            return {
                success: true, message: data.message, data: {
                    ...data,
                    info: cleanInfo
                }
            };
        } catch (err) {
            Logger.error("Byshop while buying -> Structures/Byshop.js")
            return { success: false, data: [] }
        }
    }

    /**
     * 
     * @param {Object} param0
     * @param {string} [param0.id] - รหัสสินค้า
     * @param {string} [param0.category] - หมวดหมู่สินค้า
     * @returns {Promise<Object[]|null>} - โทดทีขี้เกียจทำแล้ว 555555 
     */
    async getProduct({ id, category } = {}) {
        const params = new URLSearchParams();
        if (id) params.append("id", id);
        if (category) params.append("category", category);

        const url = params.toString() ? `${this.GET_PRODUCT_URL}?${params.toString()}` : this.GET_PRODUCT_URL;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Byshop - getProduct: ${response.status} ${response.statusText}`);
            return await response.json();
        } catch (err) {
            Logger.error("Byshop - getProduct", err);
            return null;
        }
    }

    #stripHtmlButKeepLinks(html) {
        const linkFormatted = html.replace(
            /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1[^>]*?>(.*?)<\/a>/gi,
            (match, quote, href, text) => `${text.trim()} (${href})`
        );
        const strippedText = linkFormatted.replace(/<[^>]*>/g, '');
        return strippedText.replace(/\s{2,}/g, ' ').trim();
    }
}

module.exports = Byshop;