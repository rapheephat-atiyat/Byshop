const { PrismaClient } = require('../generated/prisma');
const Logger = require('../Structures/Logger');
const prisma = new PrismaClient();

/**
 * @returns {Promise<number>}
 */
async function cleanupExpiredTransactions() {
    const TEN_MINUTES_MS = 10 * 60 * 1000;
    const tenMinutesAgo = new Date(Date.now() - TEN_MINUTES_MS);

    try {
        const result = await prisma.transaction.updateMany({
            where: {
                status: 'PENDING',
                createdAt: {
                    lt: tenMinutesAgo,
                },
            },
            data: {
                status: 'FAILED',
            },
        });

        const count = result.count;
        if (count > 0) {
            Logger.warn(`Cleanup: Updated ${count} expired PENDING transactions to FAILED.`);
        }

        return count;

    } catch (error) {
        Logger.error('Error during expired transaction cleanup:', error);
        return 0;
    }
}

module.exports = { cleanupExpiredTransactions };