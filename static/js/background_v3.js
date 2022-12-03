//XXX: currently supporting 10 commands for 8 gestures
const COMMANDS = [
  newTab,
  newBgTab,
  closeTab,
  reOpenClosedRecentlyClosed,
  reloadTab,
  back,
  forward,
  newWindow,
  closeWindow,
  navigateToHome,
];

const MSGTYPE = Object.freeze({
    GESTURE: 0,
    THRESHOLD: 1,
    KEY: 2,
    STATUS: 3,
});

const KEYID = Object.freeze({
  ALT: 0,
  CTRL: 1,
});

const defaultMapping = [0, 1, 4, 3, 5, 6, 8, 9];
const defaultThreshold = 15;
const defaultKeyID = 0; // Default key = 'alt'
var mapping = undefined;
var threshold = undefined;
var keyID = undefined;
var storage = {};
var theme = false; // False for Dark Theme

const MANIFEST = chrome.runtime.getManifest();

chrome.runtime.onInstalled.addListener((details) => {
    // if (details.reason === chrome.runtime.onInstalledReason.INSTALL){ // XXX: (INSTALL, UPDATE, CHROME_UPDATE, SHARED_MODULE_UPDATE)
      if (details.reason === chrome.runtime.OnInstalledReason.INSTALL || details.reason === chrome.runtime.OnInstalledReason.UPDATE){
        console.log("new install / update");

        // Remove previous versions' storage
        chrome.storage.sync.remove("tpad_ges");
        
        // Inject the content script when extension is newly installed / updated.
        // Manifest handles injecting script on each creation of a new tab
        // chrome.tabs.query({}, (tabs) => {
        //   tabs.forEach((tab) => {
        //     chrome.scripting.executeScript({target: {tabId: tab.id} , files: ['static/js/contentScript.js']});
        //   });
        // }); // TODO: Why 'could not load file'??
        
        let mappingPromise = chrome.storage.sync.get(["mapping"]);
        mappingPromise.then((data) => {
          mapping = data.mapping !== undefined ? data.mapping : defaultMapping;
        });

        let thresholdPromise = chrome.storage.sync.get(["threshold"]);
        thresholdPromise.then((data) => {
            threshold = data.threshold !== undefined ? data.threshold : defaultThreshold;
        });

        let keyPromise = chrome.storage.sync.get(["keyID"]);
        keyPromise.then((data) => {
            keyID = data.keyID !== undefined ? data.keyID : defaultKeyID;
        });
        let themePromise = chrome.storage.sync.get(["theme"]);
        keyPromise.then((data) => {
            theme = data.theme !== undefined ? data.theme : theme
        });
        
        Promise.all([mappingPromise, keyPromise, thresholdPromise, themePromise]).then((data) => {
          // All data received. Store it and open Options page
          Object.assign(storage, {
            mapping,
            threshold,
            keyID,
            theme,
          });

          chrome.storage.sync.set(storage).then(() => {
            console.log(storage);
          });
  
          if (chrome.runtime.openOptionsPage){
            chrome.runtime.openOptionsPage();
          } else {
            chrome.tabs.create({ url: chrome.runtime.getURL("../../views/options.html")});
          }
        });
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => { // XXX: Possible cross-site scripting from websites. investigate https://developer.chrome.com/docs/extensions/mv3/messaging/#cross-site-scripting
    switch (message.type) {
        case MSGTYPE.GESTURE:
            chrome.storage.sync.get(["mapping"]).then((data) => {
              mapping = data.mapping;
              let commandID = mapping[message.value];
              let action = commandID !== undefined ? COMMANDS[commandID] : undefined;

              if (action !== undefined){
                action();
                sendResponse({type: MSGTYPE.STATUS, value: true}); // Tell extension you executed the command
              } else {
                sendResponse({type: MSGTYPE.STATUS, value: false}); // Tell extension you could not execute the command
              }

              });
            break;
        
        case MSGTYPE.THRESHOLD: // A tab is requesting threshold value
            chrome.storage.sync.get(["threshold"]).then((data) => {
                threshold = data.threshold;
                sendResponse({type: MSGTYPE.THRESHOLD, value: threshold});
            });
            break;
        
        case MSGTYPE.KEY: // A tab is requesting key id
            chrome.storage.sync.get(["keyID"]).then((data) => {
                keyID = data.keyID;
                sendResponse({type: MSGTYPE.KEY, value: keyID});
            });
            break;
    };
    return true; // (keeps sendResonse func valid)
  
});

async function getActiveTab() {
  // let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function newTab() {
  chrome.tabs.create({ active: true });
  console.log("new tab created");
}
function newBgTab() {
  chrome.tabs.create({ active: false });
  console.log("new bg tab");
}
function updateActiveTab(cmd) {
  getActiveTab().then((tab) => {
    if (tab){
      if (cmd === "reload") {
        chrome.tabs.update(tab.id, { url: tab.url });
      } else if (cmd === "close") {
        chrome.tabs.remove(tab.id);
      } else if (cmd === "home") {
        chrome.tabs.update(tab.id,{ url: "about:newtab" }); //v3
      }
    } else {
      console.log("updateActiveTab: no active tab detected");
    }
  });
}

function closeTab() {
  updateActiveTab("close");
  console.log("tab closed");
}
function reloadTab() {
  updateActiveTab("reload");
  console.log("tab reloaded");
}
function navigateToHome() {
  updateActiveTab("home");
  console.log("home");
}

function reOpenClosedRecentlyClosed() {
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
async function injectScript(func) { // v3
  tab = await getActiveTab();
  if (tab){
    chrome.scripting.executeScript({target: {tabId: tab.id}, func: func });
  } else {
    console.warn("injectScript: Couldn't get active tab");
  }
}

function back() {
  injectScript(() => window.history.back()).then(() => {
    console.log("back");
  }); //v3
}
function forward() {
  injectScript(() => window.history.forward()).then(() => {
    console.log("forward");
  }); //v3
}

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    // TODO: When a value is updated, tell all tabs that it's been updated? OR Decide whether tabs should individually ask for updated value...
  }
})