/* REVIEW: Consider using the activeTab permission instead of specifying <all_urls> in 
content_scripts matches 
https://developer.chrome.com/docs/extensions/mv3/manifest/activeTab/
*/
const rel = 10;
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
/**
 * Returns true if mouse was moved left
 * @param {event} event 
 */
function movedLeft(event){
    // TODO: Add ability to set sensitivity later
    relMoveX = event.movementX;
    if (relMoveX < 0 && Math.abs(relMoveX)>rel && canUseGes()){
        disGes();
        return true;
        
     }
     return false;
}

function movedRight(event){
    relMoveX = event.movementX;
    if (relMoveX > 0 && Math.abs(relMoveX)>rel && canUseGes()){
        disGes();
        return true;
     }
     return false;
}

function movedUp(event){
    relMoveY = event.movementY;
    if (relMoveY < 0 && Math.abs(relMoveX)>15 && canUseGes()){
        disGes();
        return true;
     }
     return false;
}

function movedDown(event){
    relMoveY = event.movementY;
    if (relMoveY > 0 && Math.abs(relMoveX)>15 && canUseGes()){
        disGes();
        return true;
     }
     return false;
}
/**
 * Checks whether the ctrl or alt key has been pressed. 
 * @param {event} event 
 * @param {string} key 
 */
function keyPressed(event, key){
    if (key === "ctrl"){
        return event.ctrlKey;
    }
    if (key === "alt"){
        return event.altKey;
    }
}



//() => document.addEventListener("mousemove", altAndMouseMove));

/*
Clone current tab , url = " " DONE
New tab , PARTIALLY DONE
Reload, url = "" DONE

window.history.
back()          DONE
forward()       DONE

New window = use chrome.windows.create({state: "maximized"}) DONE (background script);

close tab       NOT DONE (can use chrome.tabs.remove())

*/
