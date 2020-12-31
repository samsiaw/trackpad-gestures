var map;
var trigger; 
var all_cmds =[];
var all_ges = [];
alert("hey");
getCmdList();
getGesList();
cmd_descr = {
    newt : "Open New Tab",
    newbgt: "Open New Background Tab",
    closet: "Close Tab",
    reocloset: "Reopen Recently Closed Tab",
    reloadt: "Reload Tab",
    back: "Back",
    forward: "Forward",
    neww: "Open New Window",
    closew: "Close Active Window",
    home: "Go Home"
}
gesture_descr = {
    "msD": "mouse Down",
    "msU": "mouse Up",
    "msRU": "mouse Diagonal Left to Right (Up)",
    "msRD": "mouse Diagonal Left to Right (Down)",
    "msL": "mouse Left",
    "msR": "mouse Right",
    "msLD": "mouse Diagonal Right to Left (Down)",
    "msLU": "mouse Diagonal Right to Left (Up)"
}
document.addEventListener("DOMContentLoaded", ()=>{
    alert("DOM loaded");
    getData();
    

})

function getData(){
    chrome.storage.sync.get("tpad_ges", (json)=>{
        trigger = json["tpad_ges"]["trigger"];
        map = json["tpad_ges"]["map"];
    });
}
function getCmdList(){
    for (var cmd in JSON.stringify(cmd_descr)){
        all_cmds.push(cmd);
    }
}
function getGesList(){
    for (var ges in JSON.stringify(gesture_descr)){
        all_ges.push(ges);
    }
}
function gen_Select_elements(){
    all_ges.forEach((ges)=>{
        let sel = document.createElement('select');
        sel.id = ges;
        gen_Option_tags(sel);
        let label = document.createElement('label');
        label.htmlFor = sel.id;
        label.innerHTML = gesture_descr[ges];
        inner = document.getElementById("inner");
        inner.append(label, sel);
    });

}
function gen_Option_tags(parent){ // Cmds are option elements
    all_cmds.forEach((cmd)=>{
    let opt = document.createElement('option');
    opt.innerHTML = cmd_descr[cmd];
    opt.value = cmd;
    parent.appendChild(opt);
    });
}
function saveNewCmd(el){
    //TODO: Add changing trigger item
    // remap json
    // el is a select html element 
    let cmd = el.value;
    let ges = el.id;
    let newMap = map[ges] = cmd;
    
    chrome.storage.sync.set({"tpad_ges":{"trigger":trigger, "map":newMap}}, ()=>{
        getData();
    })
}