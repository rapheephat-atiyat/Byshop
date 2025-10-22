const { payment } = require("../config/config.json");
const Logger = require("../Structures/Logger");

/**
 * @typedef {Object} TMResponse
 * @property {Object} status 
 * @property {string} status.message
 * @property {string} status.code
 * @property {Object} data
 * @property {Voucher} voucher
 * @property {Object} owner_profile
 * @property {string} owner_profile.full_name - ชื่อเจ้าของอั่งเปา
 * @property {Object} redeemer_profile
 * @property {string} redeemer_profile.mobile_number
 * @property {Object} my_ticket
 * @property {string} my_ticket.mobile
 * @property {number} my_ticket.update_date
 * @property {string} my_ticket.amount_baht
 * @property {string} my_ticket.full_name
 * @property {string} my_ticket.profile_pic
 * @property {any} tickets
 */

/**
 * @typedef {Object} Voucher
 * @property {string} voucher_id
 * @property {string} amount_baht - ยอดเงินในอั่งเปา (ไม่ใช่ยอดที่รับนะจ๊ะ)
 * @property {string} redeemed_amount_baht - ยอดเงินที่คุณได้รับไป
 * @property {number} member - จำนวนคนที่รับได้
 * @property {string} status
 * @property {string} link
 * @property {string} detail
 * @property {number} expire_date
 * @property {string} type
 * @property {number} redeemed
 * @property {number} available
 */

class Truemoney {
    #PHONE_NUMERO;
    #API_BASE_URL;
    constructor() {
        this.#PHONE_NUMERO = payment.truemoney.number;
        this.#API_BASE_URL = `https://gift.truemoney.com/campaign/vouchers`
    }

    #extractCode(urlOrCode) {
        const match = urlOrCode.match(/[?&]v=([a-zA-Z0-9]+)/);
        return match ? match[1] : urlOrCode;
    }

    /**
     * 
     * @param {Object} param0 
     * @param {string} param0.voucher - ลิ้งซองอั่งเปา หรือ code อั่งเปา
     * @param {number} param0.amount - จำนวนเงินที่ต้องการเช็ค
     * @returns {Promise<boolean>} - true = สำเร็จ, false = ไม่สำเร็จ
     */
    async redeem({ voucher, amount }) {
        const voucherCode = this.#extractCode(voucher);
        const redeemUrl = `${this.#API_BASE_URL}/${voucherCode}/redeem`;
        try {
            const response = await fetch(redeemUrl, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    mobile: this.#PHONE_NUMERO,
                    voucher_hash: voucher
                })
            });

            /** @type {TMResponse}  */
            const { status, voucher } = await response.json();
            return status?.code === "SUCCESS" && status?.message === "success" && Number(voucher?.redeemed_amount_baht) >= Number(amount);
        } catch (err) {
            Logger.error("Error while redeem code /Structures/Truemoney.js")
        }
    }
}

module.exports = { Truemoney }