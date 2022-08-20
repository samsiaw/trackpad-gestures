//XXX: currently supporting 10 commands for 8 gestures
const commands = [
  newTab,
  newBgTab,
  closeTab,
  reopenClosed,
  reloadTab,
  back,
  forward,
  newWindow,
  closeWindow,
  home,
];

const MSG_TYPE = Object.freeze({
    GESTURE: 0,
    threshold: 1,
    KEY: 2,
});

const KEY_TYPE = Object.freeze({
  ALT: 0,
  CTRL: 1,
});

const default_mapping = [0, 1, 4, 3, 5, 6, 8, 9];
const default_threshold = 5;
const default_key = "alt";
var mapping = undefined;
var threshold = undefined;
var keyID = undefined;
var storage = undefined;
var theme = false; // False for Dark Theme

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === chrome.runtime.onInstalledReason.INSTALL){
        // Remove previous versions' storage
        chrome.storage.sync.get("tpad_ges", (obj) => {
            chrome.storage.sync.remove("tpad_ges");
        });

        chrome.tabs.query({}, (tabs) => {
          tabs.forEach((tab) => {
            chrome.tabs.executeScript(tabId= tab.id, {file: "./contentScript.js"});
          });
        });
        
        chrome.storage.sync.get("mapping", (data) => {
          mapping = data.mapping ?? default_mapping;
        });
        chrome.storage.sync.get("threshold", (data) => {
            threshold = data.threshold ?? default_threshold;
        });
        chrome.storage.sync.get("key", (data) => {
            keyID = data.key ?? default_key;
        });
        chrome.storage.sync.get("theme", (data) => {
            theme = data.theme !== undefined ? data.theme : theme
        });

        const new_storage = {
          mapping,
          threshold,
          keyID,
          theme,
        };
        Object.assign(storage, new_storage);
        chrome.storage.sync.set({ storage });

        if (chrome.runtime.openOptionsPage){
          chrome.runtime.openOptionsPage();
        } else {
          chrome.tabs.create({ url: chrome.runtime.getURL("../../views/options.html")});
        }
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const msg_type = message.type;
    switch (msg_type) {
        case MSG_TYPE.GESTURE:       
            chrome.storage.sync.get("mapping", (data) => {
              mapping = data.mapping;
              storage = Object.assign(storage ? storage : {}, {mapping});
            });
            const command = storage.mapping[message.gesture_id];
            command ? command() : undefined;
            // console.log(`b: command ${command}`);
            break;
        
        case MSG_TYPE.threshold: 
            chrome.storage.sync.get("threshold", (data) => {
                threshold = data.threshold;
                storage = Object.assign(storage ?? {}, {threshold});
            });
            // TODO: Send the new threshold value to all tabs
        
        case MSG_TYPE.KEY:
            chrome.storage.sync.get("key", (data) => {
                key = data.key;
                storage = Object.assign(storage ?? {}, {key});
            });
            // TODO: Send the new key value to all tabs

    };


    return true; // (keeps sendResonse func valid)
  
});

function newTab() {
  chrome.tabs.create({ active: true });
  console.log("new tab created");
}
function newBgTab() {
  chrome.tabs.create({ active: false });
  console.log("new bg tab");
}
function singleTab(cmd) {
  chrome.tabs.query({ active: true, currentWindow: true }, (arrayTabs) => {
    let tab = arrayTabs[0];
    if (cmd === "reload") {
      chrome.tabs.update(tab.id, { url: tab.url });
    } else if (cmd === "close") {
      chrome.tabs.remove(tab.id);
    }
  });
}
function closeTab() {
  singleTab("close");
  console.log("tab closed");
}
function reloadTab() {
  singleTab("reload");
  console.log("tab reloaded");
}

function reopenClosed() {
  chrome.sessions.restore();
  console.log("restored tab");
}
function newWindow() {
  chrome.windows.create({ state: "maximized" });
  console.log("New window created");
}
function closeWindow() {
  chrome.windows.getCurrent({}, (windowObj) => {
    chrome.windows.remove(windowObj.id);
    console.log("Window closed");
  });
}
// function injectScript(func) {
//   chrome.tabs.query({ active: true, currentWindow: true }, (tabsArr) => {
//     chrome.scripting.executeScript({target: {tabID: tabsArr[0].id}, func: func });
//   });
// }
function injectCode(code) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabsArr) => {
    chrome.tabs.executeScript( tabId = tabsArr[0].id, {code: code});
  });
}

function back() {
  // injectScript(window.history.back); //v3
  injectCode("window.history.back()"); //v2
  console.log("back");
}
function forward() {
  // injectScript(window.history.forward); //v3
  injectCode('window.history.forward()'); //v2
  console.log("forward");
}
function home() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabsArr) => {
    // chrome.tabs.update({target: {tabID: tabsArr[0].id}, url: "about:newtab" }); //v3
    chrome.tabs.update(tabsArr[0].id, { url: "about:newtab" }); //v2
  });
  console.log("Navigated to home tab");
}
