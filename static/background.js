//TODO: Receive messages from contentScript and fireoff commands here
//XXX: Send feedback/response after receiving messages
/*cmd = {
    newt: newTab,
    newbgt: newBgTab,
    closet: closeTab,
    reloadt: reloadTab,
    back: goBack,
    forward: goForward,
    stopload: stopLoad
}*/
default_mapping = {
    map:{
    trigger: "alt",
    newt: "msLU",
    newbgt: "msRU",
    closet: "msD",
    reocloset: "msU",
    reloadt: "msDiaLRU",
    back: "msL",
    forward: "msR",
    stopload: "msDiaRLD"
    }
}
cmd_descr = {
    newt : "Open New Tab",
    newbgt: "Open New Background Tab",
    closet: "Close Tab",
    reocloset: "Reopen Recently Closed Tab",
    reloadt: "Reload Tab",
    back: "Back",
    forward: "Forward",
    stopload: "Stop Loading Current Tab"
}
gesture_descr = {
    "msLU": "mouse Left Up",
    "msRU": "mouse Right Up",
    "msD": "mouse Down",
    "msU": "mouse Up",
    "msDiaLRU": "mouse Diagonal Left to Right (Up)",
    "msL": "mouse Left",
    "msR": "mouse Right",
    "msDiaRLD": "mouse Diagonal Right to Left (Down)"
}
var mapping;
//on chrome update, extension update, or extension install
chrome.runtime.onInstalled.addListener(() => {
    // Set the settings for commands and their gestures
    
   
    chrome.storage.sync.get("tpad_ges", (obj)=>{
       mapping = obj["tpad_ges"];
        alert(obj["tpad_ges"]);
    });
    if (mapping === undefined){
        mapping = JSON.stringify(default_mapping);
        chrome.storage.sync.set({"tpad_ges": mapping});
    }
    chrome.tabs.create({url : "./views/options.html"});
});

chrome.runtime.onMessage.addListener(
    (request, sender, respond) => {
        console.log(`background: ${request.msg}`);
    
});

