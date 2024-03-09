var scoutDatabase = {}
var isDatabaseImported = false

browser.browserAction.onClicked.addListener(() => {
    let creating = browser.tabs.create({
        url: "../control-panel/control-panel.html",
    });
});

const filter = { urls: ["https://twitter.com/*"], properties: ["status"] };
browser.tabs.onUpdated.addListener(handleUpdated, filter);

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "getDB") {
        sendResponse({ status: isDatabaseImported, database: scoutDatabase });
    } else if (message.type === 'setDB') {
        scoutDatabase = message.data
        isDatabaseImported = true
        sendResponse(true);
    } else if (message.type === "addPost") {
        if (!Object.keys(scoutDatabase).includes(message.author)) {
            scoutDatabase[message.author] = {}}
        scoutDatabase[message.author][message.tweetId] = message.data
    } else if (message.type === "removePost") {
        delete scoutDatabase[message.author][message.tweetId]
    }
});

function handleUpdated(tabId, changeInfo, tabInfo) {
    if (changeInfo.status === 'complete') {
        browser.tabs.sendMessage(tabId, true)
    }
}
