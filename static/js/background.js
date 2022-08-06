//XXX: currently supporting 10 commands for 8 gestures
cmd = {
  newt: newTab,
  newbgt: newBgTab,
  closet: closeTab,
  reloadt: reloadTab,
  reocloset: reopenClosed,
  neww: newWindow,
  closew: closeWindow,
  back: back,
  forward: forward,
  home: home,
};
default_mapping = {
  map: {
    trigger: "alt",
    msL: "back",
    msR: "forward",
    msU: "newt",
    msD: "closet",
    msRU: "newbgt",
    msLU: "home",
    msRD: "reloadt",
    msLD: "neww",
  },
};
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
const default_threshold = 15;
const default_key = "alt";
var mapping = undefined;
var threshold = undefined;
var key = undefined;
var storage = undefined;

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === chrome.runtime.onInstalledReason.INSTALL){
        // Remove previous version storage
        chrome.storage.sync.get("tpad_ges", (obj) => {
            chrome.storage.sync.remove("tpad_ges");
        });

        //TODO: On installed, inject content script code into all tabs, to prevent reloading before it pages begin to work
        chrome.storage.sync.get("mapping", (data) => {
          mapping = data.mapping ?? default_mapping;
        });
        chrome.storage.sync.get("threshold", (data) => {
            threshold = data.threshold ?? default_threshold;
        });
        chrome.storage.sync.get("key", (data) => {
            key = data.key ?? default_key;
        });

        const new_storage = {
          mapping,
          threshold,
          key,
        };
        Object.assign(storage, new_storage);
        chrome.storage.sync.set({ storage });
        chrome.tabs.create({ url: "../../views/options.html" });
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
function injectScript(script) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabsArr) => {
    chrome.tabs.executeScript(tabsArr[0].id, { code: script });
  });
}
function back() {
  injectScript("window.history.back()");
  console.log("back");
}
function forward() {
  injectScript("window.history.forward()");
  console.log("forward");
}
function home() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabsArr) => {
    chrome.tabs.update(tabsArr[0].id, { url: "about:newtab" });
  });
  console.log("Navigated to home tab");
}
