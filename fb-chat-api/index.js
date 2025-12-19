"use strict";

const utils = require("./utils");
const cheerio = require("cheerio");
const log = require("npmlog");

let checkVerified = null;
log.maxRecordSize = 100;

/* ================= OPTIONS ================= */

function setOptions(globalOptions, options) {
	for (const key of Object.keys(options)) {
		switch (key) {
			case "pauseLog":
				if (options.pauseLog) log.pause();
				break;
			case "online":
			case "selfListen":
			case "listenEvents":
			case "listenTyping":
			case "updatePresence":
			case "forceLogin":
			case "autoMarkDelivery":
			case "autoMarkRead":
			case "autoReconnect":
			case "emitReady":
				globalOptions[key] = Boolean(options[key]);
				break;
			case "logLevel":
				log.level = options.logLevel;
				globalOptions.logLevel = options.logLevel;
				break;
			case "logRecordSize":
				log.maxRecordSize = options.logRecordSize;
				globalOptions.logRecordSize = options.logRecordSize;
				break;
			case "pageID":
				globalOptions.pageID = options.pageID.toString();
				break;
			case "userAgent":
				globalOptions.userAgent = options.userAgent;
				break;
			case "proxy":
				if (typeof options.proxy === "string") {
					globalOptions.proxy = options.proxy;
					utils.setProxy(options.proxy);
				} else {
					delete globalOptions.proxy;
					utils.setProxy();
				}
				break;
			default:
				log.warn("setOptions", "Unknown option:", key);
		}
	}
}

/* ================= BUILD API ================= */

function buildAPI(globalOptions, html, jar) {
	const cookies = jar.getCookies("https://www.facebook.com");
	const objCookie = {};

	cookies.forEach(c => {
		const [k, v] = c.cookieString().split("=");
		objCookie[k] = v;
	});

	if (!objCookie.c_user) {
		throw { error: "Cannot get userID (c_user missing)" };
	}

	// 🔥 AVATAR FIX (CRITICAL)
	let userID = objCookie.c_user;
	let i_userID = objCookie.i_user || userID;

	log.info("login", `Logged in as ${userID}`);

	const clientID = (Math.random() * 2147483648 | 0).toString(16);

	let mqttEndpoint = null;
	let region = "ASH";
	let irisSeqID = null;

	const match =
		html.match(/"endpoint":"(.*?)".*?"iris_seq_id":"(.*?)"/) ||
		html.match(/endpoint:"(.*?)".*?irisSeqID:"(.*?)"/);

	if (match) {
		mqttEndpoint = match[1].replace(/\\\//g, "/");
		irisSeqID = match[2];
		try {
			region = new URL(mqttEndpoint).searchParams.get("region") || "ASH";
		} catch {}
	}

	const ctx = {
		userID,
		i_userID,
		jar,
		clientID,
		globalOptions,
		loggedIn: true,

		// GraphQL safe
		access_token: "NONE",
		clientMutationId: 0,

		// MQTT
		mqttClient: null,
		lastSeqId: irisSeqID,
		syncToken: null,

		wsReqNumber: 0,
		wsTaskNumber: 0,
		reqCallbacks: {},

		mqttEndpoint,
		region,
		firstListen: true
	};

	const api = {
		setOptions: setOptions.bind(null, globalOptions),
		getAppState() {
			return utils.getAppState(jar).filter(
				(v, i, a) => a.findIndex(t => t.key === v.key) === i
			);
		}
	};

	const apiFuncNames = [
		"addUserToGroup",
		"changeNickname",
		"changeThreadEmoji",
		"changeThreadColor",
		"createNewGroup",
		"deleteMessage",
		"getCurrentUserID",
		"getFriendsList",
		"getThreadHistory",
		"getThreadInfo",
		"getUserInfo",
		"listenMqtt",
		"logout",
		"markAsRead",
		"sendMessage",
		"sendTypingIndicator",
		"setMessageReaction",
		"unsendMessage",
		"uploadAttachment"
	];

	const defaultFuncs = utils.makeDefaults(html, userID, ctx);
	apiFuncNames.forEach(
		fn => (api[fn] = require("./src/" + fn)(defaultFuncs, api, ctx))
	);

	return api;
}

/* ================= LOGIN HELPER ================= */

function loginHelper(loginData, globalOptions, callback) {
	const jar = utils.getJar();

	// 🔥 STABLE MOBILE UA (AVATAR SAFE)
	globalOptions.userAgent =
		"Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

	let main = Promise.resolve();

	if (loginData.appState) {
		loginData.appState.forEach(c => {
			jar.setCookie(
				`${c.key}=${c.value}; domain=${c.domain}; path=${c.path};`,
				"https://facebook.com"
			);
		});
	}

	main = main
		.then(() => utils.get("https://www.facebook.com/", jar, null, globalOptions))
		.then(res => buildAPI(globalOptions, res.body, jar))
		.then(api => callback(null, api))
		.catch(err => callback(err));
}

/* ================= EXPORT ================= */

module.exports = function login(loginData, options, callback) {
	if (typeof options === "function") {
		callback = options;
		options = {};
	}

	const globalOptions = {
		selfListen: false,
		listenEvents: false,
		listenTyping: false,
		updatePresence: false,
		forceLogin: false,
		autoMarkDelivery: true,
		autoMarkRead: false,
		autoReconnect: true,
		emitReady: false
	};

	setOptions(globalOptions, options);
	loginHelper(loginData, globalOptions, callback);
};
