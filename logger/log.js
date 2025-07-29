const { colors } = require('../func/colors.js');
const moment = require("moment-timezone");

// Set a default character (e.g., '✨' or '➜') or leave empty if intentional
const characters = '➜'; // You can change this to any symbol or leave as ''

const getCurrentTime = () => colors.gray(moment().tz("Asia/Ho_Chi_Minh").format("HH:mm:ss DD/MM/YYYY"));

function logError(prefix, message, ...errors) {
    if (message === undefined) {
        message = prefix;
        prefix = "ERROR";
    }
    console.log(`${getCurrentTime()} ${colors.redBright(`${characters} ${prefix}:`)} ${message}`);
    for (let err of errors) {
        if (typeof err === "object" && !err.stack) {
            err = JSON.stringify(err, null, 2);
        }
        console.log(`${getCurrentTime()} ${colors.redBright(`${characters} ${prefix}:`)} ${err}`);
    }
}

module.exports = {
    err: logError,
    error: logError,
    warn: function (prefix, message) {
        if (message === undefined) {
            message = prefix;
            prefix = "WARN";
        }
        console.log(`${getCurrentTime()} ${colors.yellowBright(`${characters} ${prefix}:`)} ${message}`);
    },
    info: function (prefix, message) {
        if (message === undefined) {
            message = prefix;
            prefix = "INFO";
        }
        console.log(`${getCurrentTime()} ${colors.greenBright(`${characters} ${prefix}:`)} ${message}`);
    },
    success: function (prefix, message) { // Fixed spelling from "SUCCES" to "success"
        if (message === undefined) {
            message = prefix;
            prefix = "SUCCESS";
        }
        console.log(`${getCurrentTime()} ${colors.cyanBright(`${characters} ${prefix}:`)} ${message}`);
    },
    master: function (prefix, message) {
        if (message === undefined) {
            message = prefix;
            prefix = "MASTER";
        }
        console.log(`${getCurrentTime()} ${colors.hex("#eb6734", `${characters} ${prefix}:`)} ${message}`);
    },
    dev: (...args) => {
        if (!["development", "production"].includes(process.env.NODE_ENV)) return;
        try {
            throw new Error();
        } catch (err) {
            const at = err.stack.split('\n')[2];
            let position = at.slice(at.indexOf(process.cwd()) + process.cwd().length + 1);
            position.endsWith(')') ? position = position.slice(0, -1) : null;
            console.log(`\x1b[36m${position} =>\x1b[0m`, ...args);
        }
    }
};
