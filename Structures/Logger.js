const { cyan, yellow, red, green } = require('console-log-colors');

class Logger {
    static info(...args) {
        console.log(cyan(`[ INFO ] ${new Date().toLocaleString("TH-th")}`), ...args);
    }
    static warn(...args) {
        console.log(yellow(`[ INFO ] ${new Date().toLocaleString("TH-th")}`), ...args);
    }
    static error(...args) {
        console.log(red(`[ ERROR ] ${new Date().toLocaleString("TH-th")}`), ...args);
    }
    static success(...args) {
        console.log(green(`[ SUCCESS ] ${new Date().toLocaleString("TH-th")}`), ...args);
    }
}

module.exports = Logger;