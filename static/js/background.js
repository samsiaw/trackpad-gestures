//TODO: Receive messages from contentScript and fireoff commands here
//XXX: Send feedback/response after receiving messages
//XXX: currently supporting 9 commands for 8 gestures
// Keep gestures constant
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
    home: home
}
default_mapping = {
    "map":{
    "trigger": "alt",
    "msL": "back",
    "msR": "forward",
    "msU": "newt",
    "msD": "closet",
    "msRU": "newbgt",
    "msLU": "home",
    "msRD": "reloadt",
    "msLD": "neww"
    }
}

var mapping;
//on chrome update, extension update, or extension install
chrome.runtime.onInstalled.addListener(() => {
    // Set the settings for commands and their gestures
    
    chrome.storage.sync.get("tpad_ges", (obj)=>{
       mapping = obj["tpad_ges"];
        //alert(obj["tpad_ges"]);
    });
    if (mapping === undefined){
        mapping = default_mapping;//JSON.stringify(default_mapping);
        chrome.storage.sync.set({"tpad_ges": mapping});
    }
    //chrome.tabs.create({url : "./views/options.html"});
});

chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
        chrome.storage.sync.get("tpad_ges", (obj)=>{
        mapping = obj["tpad_ges"];
        r_msg = request.msg;
        //console.log(`mapping: ${mapping}`);
        let command = mapping['map'][`${r_msg}`];
        console.log(`b: command ${command}`);
        
        cmd[`${command}`](); //Call function

        return true; // (keeps the sendResonse func valid)
    });
          
});

function newTab(){
    chrome.tabs.create({active: true});
    console.log("new tab created");
}
function newBgTab(){
    chrome.tabs.create({active: false});
    console.log("new bg tab");
}
function singleTab(cmd){
    chrome.tabs.query({active: true, currentWindow: true}, (arrayTabs)=>{
        let tab = arrayTabs[0];
        if (cmd === "reload"){
            chrome.tabs.update(tab.id, {url: tab.url});
        }
        else if (cmd === "close"){
            chrome.tabs.remove(tab.id);
        }
    })
}
function closeTab(){
    singleTab("close");
    console.log("tab closed");
}
function reloadTab(){
    singleTab("reload");
    console.log("tab reloaded");
}

function reopenClosed(){
    chrome.sessions.restore();
    console.log("restored tab");
}
function newWindow(){
    chrome.windows.create({state: 'maximized'});
    console.log("New window created");
}
function closeWindow(){
     chrome.windows.getCurrent({}, (windowObj)=>{
        chrome.windows.remove(windowObj.id);
        console.log("Window closed");
    });
}
function injectScript(script){
    chrome.tabs.query({active: true, currentWindow: true}, (tabsArr)=>{
        chrome.tabs.executeScript(tabsArr[0].id, {code : script});
    })
}
function back(){
   injectScript("window.history.back()");
    console.log("back");
}
function forward(){
    injectScript("window.history.forward()");
    console.log("forward");
}
function home(){
    chrome.tabs.query({active: true, currentWindow: true}, (tabsArr)=>{
        chrome.tabs.update(tabsArr[0].id, {url : "about:newtab"});
    })
    console.log("Navigated to home tab");
}