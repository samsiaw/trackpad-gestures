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
var all_keys = ['alt'];
var key_descr = {
    "alt": "Alt Key"
}
document.addEventListener("DOMContentLoaded", ()=>{
    getCmdList();
    getGesList();
    console.log("DOM loaded");
    loadElements("mappings");

    document.querySelector("#nav-map").addEventListener("click", ()=>{
        loadElements("mappings");
    });
    document.querySelector("#nav-trig").addEventListener("click", ()=>{
        loadElements("trigger");
    });
    document.querySelector("#nav-git").addEventListener("click", ()=>{
        chrome.tabs.create({url: "https://github.com/tkYank/trackpad-gestures"});
    });

})

function loadElements(which){
    chrome.storage.sync.get("tpad_ges", (json)=>{
         trigger = json["tpad_ges"]["trigger"];
         gmap = json["tpad_ges"]["map"];

        if (which ==="mappings"){
        mappings_page(gmap);
        }
        else if (which ==="trigger"){
        trigger_page(gmap);
        }
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
function mappings_page(map){
    
    gen_Headers(["Gesture", "Icon", "Command"]);

    all_ges.forEach((ges)=>{
        let tr = document.createElement("tr");
        let td = document.createElement("td");
        let td2 = document.createElement("td");
        let td3 = document.createElement("td");
        let img = document.createElement("img");

        td2.appendChild(img);
        img.src = `../../views/icons/${ges}.svg`;
        console.log(img.src);

        tr.append(td, td2, td3);
        let select = document.createElement('select');
        select.id = ges;
        gen_Option_tags(select);
 
        let label = document.createElement('label');
        label.htmlFor = select.id;
        label.innerHTML = gesture_descr[ges];
        
        td.appendChild(label);
        td3.appendChild(select);
        document.querySelector("table").appendChild(tr);
      
        select.value = map[ges];
        select.addEventListener("change", saveNewCmd);
    });
}
function trigger_page(map){
    gen_Headers(["Trigger", "Ctrl/Alt"]);

    //XXX: Currently supporting only alt key
    let tr2 = document.createElement("tr");
    let td = document.createElement("td");
    let td2 = document.createElement("td");
    tr2.append(td, td2);

    let select = document.createElement('select');
    select.id = "trigger";
    gen_Options_trig(select);

    let label = document.createElement('label');
    label.htmlFor = select.id;
    label.innerHTML = "Key";
    
    td.appendChild(label);
    td2.appendChild(select);
    document.querySelector("table").appendChild(tr2);
    
    select.value = map["trigger"];
    select.addEventListener("change", saveNewCmd);
}
function gen_Option_tags(parent){
    all_cmds.forEach((cmd)=>{
    let opt = document.createElement('option');
    
    opt.innerHTML = cmd_descr[cmd];
    opt.value = cmd;
    parent.appendChild(opt);
    });
}
function saveNewCmd(){

    if (!localStorage.getItem("updatingDb")){
    console.log("saving new");
    let c = this.value; //cmd or key (ctrl/alt)
    let g = this.id; // ges or 'trigger'
    
    chrome.storage.sync.get("tpad_ges", (gmap)=>{
        let newMap = gmap["tpad_ges"]['map'];
        newMap[g] = c;
    
        chrome.storage.sync.set({"tpad_ges":{ "map":newMap}}, ()=>{
        })
    });  
    }
    else{
        return;
    }
}

function gen_Options_trig(parent){
    //Support only ctrl / alt
    all_keys.forEach((key)=>{
    let opt = document.createElement('option');
    //console.log(cmd_descr)
    opt.innerHTML = key_descr[key];
    opt.value = key;
    parent.appendChild(opt);
    });
}
function gen_Headers(h_strings){
    let el = document.querySelector("table");
    el.parentNode.removeChild(el);

    var table = document.createElement("table");
    let tr = document.createElement("tr");

    h_strings.forEach((h_str)=>{
        let th = document.createElement("th");
        tr.appendChild(th);
        th.innerHTML = h_str;
    });

    table.appendChild(tr);
    document.querySelector("body").appendChild(table);
}