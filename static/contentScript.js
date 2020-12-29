// REVIEW: Send messages to background_scripts to access chrome.tabs


let abs = Math.abs
var trigger = "alt"; //TODO: Get trigger from background.js
const sensitivity = 15;
const lim = 10;
const gesture_pause = 1000; //Min Time between successful successive gestures
//alert("contentScriptInserted");

/*chrome.runtime.sendMessage({msg: "trig"}, (response)=>{
    trigger = response.trigger !== undefined ? response.trigger: "alt";
    alert(`trigger set to ${trigger}`);
});*/


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
        if (response["msg"] !== "success"){
            console.log(response["msg"]);
        }
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
    setTimeout(()=>{localStorage.removeItem("gesDis")}, gesture_pause);
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
            //alert("Can use Ges");
            if (abs(relMoveX)>sensitivity && abs(relMoveY)<lim){
                if (relMoveX > 0){ // ms Right
                    disGes();
                    alert("ms Right");
                    sendMess("msR");
                    return;
                }

                if (relMoveX < 0){ //ms Left
                    disGes();
                    alert("ms left");
                    sendMess("msL");
                    return;
                }
        }
            if (abs(relMoveY)>sensitivity && abs(relMoveX)<lim){
                if (relMoveY < 0 ){ //ms Up
                    disGes();
                    alert("ms up");
                    sendMess("msU");
                    return;
                }
                if (relMoveY > 0 ){ //ms Down
                    disGes();
                    alert("ms down");
                    sendMess("msD");
                    return;
                }
        }
            if (abs(relMoveY)>sensitivity && abs(relMoveX)>sensitivity){
                if (relMoveX < 0){ // Right to left
                    if (relMoveY > 0){ // ms Diagonal Right to left Downwards
                        disGes();
                        alert("Diagonal right to left - downwards");
                        sendMess("msDiaRLD");
                        return;
                    }
                    if (relMoveY < 0){ // ms Dia RL U
                        disGes();
                        alert("Diagonal right to left - upwards");
                        sendMess("msDiaRLU");
                        return;
                    }
                }
                if (relMoveX > 0){ // left to right
                    if (relMoveY < 0){ // ms Diagonal Left to Right Upwards
                        disGes();
                        alert("Diagonal left to right - upwards");
                        sendMess("msDiaLRU");
                        return;
                    }
                    if (relMoveY > 0){ // ms Diagonal Left to Right Downwards
                        disGes();
                        alert("Diagonal left to right - downwards");
                        sendMess("msDiaLRD");
                        return;
                    }

                }
                
            }
        }
    }
});