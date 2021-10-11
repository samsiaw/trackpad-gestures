let abs = Math.abs
var trigger = "alt"; 
const sensitivity = 15;
const lim = 10;
const gesture_hold_timer = 300; //Min Time between successful successive gestures
const cookie = "gesDis";
localStorage.removeItem(cookie);

function keyPressed(event, key){
    if (key === "alt"){
        return event.altKey;
    }
}

/* Sends messages to the extension's background scripts */
function sendMess(str){
    chrome.runtime.sendMessage({msg: str}, (response)=>{

       mess = response.msg;
       console.log(`script: ${mess}`);
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

function disGes(){ // Disable Gesture [Sets gesture tick and a timeout to remove the tick]
    localStorage["gesDis"] = true;
    setTimeout(()=>{localStorage.removeItem("gesDis")}, gesture_hold_timer);
}
document.addEventListener("mousemove", (event)=>{
    
    if (keyPressed(event, trigger)){
        
        var relMoveX = event.movementX;
        var relMoveY = event.movementY;

        if (canUseGes()){
            
            if (abs(relMoveX)>sensitivity && abs(relMoveY)<lim){
                if (relMoveX > 0){ // ms Right, ms ==> mouse
                    disGes();
                    
                    sendMess("msR");
                    return;
                }

                 else { //ms Left
                    disGes();
                  
                    sendMess("msL");
                    return;
                }
        }
            if (abs(relMoveY)>sensitivity && abs(relMoveX)<lim){
                if (relMoveY < 0 ){ //ms Up
                    disGes();
               
                    sendMess("msU");
                    return;
                }
                else { //ms Down
                    disGes();
                   
                    sendMess("msD");
                    return;
                }
        }
            if (abs(relMoveY)>sensitivity && abs(relMoveX)>sensitivity){
                if (relMoveX < 0){ // Right to left
                    if (relMoveY > 0){ // ms Diagonal Right to left Downwards
                        disGes();
                
                        sendMess("msLD");
                        return;
                    } else { 
                        disGes();
                       
                        sendMess("msLU");
                        return;
                    }
                }
                else { // left to right
                    if (relMoveY < 0){ // ms Diagonal Left to Right Upwards
                        disGes();
                   
                        sendMess("msRU");
                        return;
                    }
                    else { // ms Diagonal Left to Right Downwards
                        disGes();
                    
                        sendMess("msRD");
                        return;
                    }

                }
                
            }
        }
    }
});
