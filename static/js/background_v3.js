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

const defaultMapping = [0, 1, 4, 3, 5, 6, 8, 9];
const defaultThreshold = 5;
const defaultKeyID = 0;
var mapping = undefined;
var threshold = undefined;
var keyID = undefined;
var storage = {};
var theme = false; // False for Dark Theme

const MANIFEST = chrome.runtime.getManifest();

chrome.runtime.onInstalled.addListener((details) => {
    // if (details.reason === chrome.runtime.onInstalledReason.INSTALL){ // TODO: This works, (INSTALL, UPDATE, CHROME_UPDATE, SHARED_MODULE_UPDATE)
      if (details.reason === chrome.runtime.OnInstalledReason.INSTALL || details.reason === chrome.runtime.OnInstalledReason.UPDATE){
        console.log("new install / update");
        // console.log(chrome.runtime);
        // console.log(chrome.runtime.getURL('/static/js/contentScript.js'));
        // console.log(MANIFEST);

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
          mapping = data.mapping ?? defaultMapping;
        });

        let thresholdPromise = chrome.storage.sync.get(["threshold"]);
        thresholdPromise.then((data) => {
            threshold = data.threshold ?? defaultThreshold;
        });
        let keyPromise = chrome.storage.sync.get(["key"]);
        keyPromise.then((data) => {
            keyID = data.key ?? defaultKeyID;
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
            console.log('storage set');
          });
  
          if (chrome.runtime.openOptionsPage){
            chrome.runtime.openOptionsPage();
          } else {
            chrome.tabs.create({ url: chrome.runtime.getURL("../../views/options.html")});
          }
        });
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
async function injectScript(func) { // v3
  tab = await getActiveTab();
  if (tab){
    chrome.scripting.executeScript({target: {tabID: tab.id}, func: func });
  } else {
    console.warn("injectScript: Couldn't get active tab");
  }
}
// function injectCode(code) { // v2
//   chrome.tabs.query({ active: true, currentWindow: true }, (tabsArr) => {
//     chrome.tabs.executeScript( tabId = tabsArr[0].id, {code: code});
//   });
// }

function back() {
  injectScript(() => window.history.back()).then(() => {
    console.log("back");
  }); //v3
  // injectCode("window.history.back()"); //v2
}
function forward() {
  injectScript(() => window.history.forward()).then(() => {
    console.log("forward");
  }); //v3
  // injectCode('window.history.forward()'); //v2
}
function home() {
  getActiveTab().then((tab) => {
    if (tab){
      chrome.tabs.update({target: {tabID: tab.id}, url: "about:newtab" }); //v3
      console.log("Navigated to home tab");
    } else {
      console.log("home: cannot find active tab");
    }
  })
}

// TODO:
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {

  }
})