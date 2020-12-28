// REVIEW: Send messages to background_scripts to access chrome.tabs
// XXX: Map cmd names to their functions
// Detect gesture and send message to background tab to execute
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
cmd = {
    newt: newTab,
    newbgt: newBgTab,
    closet: closeTab,
    reloadt: reloadTab,
    back: goBack,
    forward: goForward,
    stopload: stopLoad
}
let abs = Math.abs
const trigger;
const sensitivity = 10;
const lim = 5;

chrome.runtime.sendMessage({msg: "trig"}, (response)={
    trigger = response.trigger !== undefined ? response.trigger, "alt";
});

function keyPressed(event, key){
    if (key === "ctrl"){
        return event.ctrlKey;
    }
    if (key === "alt"){
        return event.altKey;
    }
}


function sendMess(str){
    chrome.runtime.sendMessage({msg: str}, (response)={
        //Add an instruction for the response
    });
}

/* Gestures */
/* Temporary hold on gestures to prevent same gesture firing multiple times */
function canUseGes(){
    if (localStorage["gesDis"] === undefined){
        return true;
    }
    return false;
}
function disGes(){
    localStorage["gesDis"] = true;
    setTimeout(()=>{localStorage.removeItem("gesDis")}, 500);
}
document.addEventListener("mousemove", (event)=>{
    // Detect gesture 
    // Check gesture-cmd map to know which command to send
    // Send message to background script
    if (keyPressed(event, trigger)){
        console.log(`${trigger} pressed`);
        relMoveX = event.movementX;
        relMoveY = event.movementY;
        
        if (canUseGes()){
            if (abs(relMoveX)>sensitivity && abs(relMoveY)<lim){
                if (relMoveX > 0){ // ms Right
                    disGes();
                    sendMess("msR");
                    return;
                }

                if (relMoveX < 0){ //ms Left
                    disGes();
                    sendMess("msL");
                    return;
                }
        }
            if (abs(relMoveY)>sensitivity && abs(relMoveX)<lim){
                if (relMoveY > 0 ){ //ms Up
                    disGes();
                    sendMess("msU");
                    return;
                }
                if (relMoveY < 0 ){ //ms Down
                    disGes();
                    sendMess("msD");
                    return;
                }
        }
            if (abs(relMoveY)>sensitivity && abs(relMoveX)>sensitivity){
                if (relMoveX < 0 && relMoveY > 0){ // ms Diagonal Right to left Downwards
                    disGes();
                    alert("Diagonal right to left - downwards");
                    sendMess("msDiaRLD");
                    return;
                }
                if (relMove > 0 && relMoveY < 0){ // ms Diagonal Left to Right Upwards
                    disGes();
                    alert("Diagonal left to right - upwards");
                    sendMess("msDiaLRU");
                    return;
                }
            }
        }
    }
});