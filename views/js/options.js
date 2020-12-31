var map, trigger;
var all_cmds =[];
var all_ges = [];

var cmd_descr = {
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
var gesture_descr = {
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
    getCmdList();
    getGesList();
    console.log("DOM loaded");
    loadElements();
    //console.log(map);

    //gen_Select_elements(map);

})

function loadElements(){
    chrome.storage.sync.get("tpad_ges", (json)=>{
        //console.log(json);
         trigger = json["tpad_ges"]["trigger"];
         //console.log(`trig: ${trigger}`)
         gmap = json["tpad_ges"]["map"];
        //console.log(`M: ${map}`);
        gen_Select_elements(gmap);
    });
}
function getCmdList(){
    for (var cmd in cmd_descr){
        all_cmds.push(cmd);
    }
}
function getGesList(){
    for (var ges in gesture_descr){
        all_ges.push(ges);
    }
}
function gen_Select_elements(map){
    //console.log(map);
    all_ges.forEach((ges)=>{
        let sel = document.createElement('select');
        sel.id = ges;
        gen_Option_tags(sel);
        //console.log("done with option tags")
        let label = document.createElement('label');
        label.htmlFor = sel.id;
        label.innerHTML = gesture_descr[ges];
        inner = document.getElementById("inner");
        inner.append(label, sel);
      
        sel.value = map[ges];
        sel.addEventListener("change", saveNewCmd);
    });

}
function gen_Option_tags(parent){ // Cmds are option elements
    all_cmds.forEach((cmd)=>{
    let opt = document.createElement('option');
    //console.log(cmd_descr)
    opt.innerHTML = cmd_descr[cmd];
    opt.value = cmd;
    parent.appendChild(opt);
    });
}
function saveNewCmd(){
    //TODO: Add changing trigger item
    // remap json
    // el is a select html element 
    if (!localStorage.getItem("updatingDb")){
    console.log("saving new");
    let c = this.value; //cmd or key (ctrl/alt)
    let g = this.id; // ges or 'trigger'
    
    chrome.storage.sync.get("tpad_ges", (gmap)=>{
        let newMap = gmap["tpad_ges"]['map'];
        newMap[g] = c;
           
        console.log(`new map: ${newMap}`);
        chrome.storage.sync.set({"tpad_ges":{ "map":newMap}}, ()=>{
            console.log(`new map in set: ${newMap}`);
            //console.log("Done setting new value");
        })
    });  
    }
    else{
        return;
    }
}
    
