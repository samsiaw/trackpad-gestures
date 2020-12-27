/* REVIEW: Consider using the activeTab permission instead of specifying <all_urls> in 
content_scripts matches 
https://developer.chrome.com/docs/extensions/mv3/manifest/activeTab/
*/
/**
 * Returns true if mouse was moved left
 * @param {event} event 
 */
function movedLeft(event){
    // TODO: Add ability to set sensitivity later
    relMoveX = event.movementX;
    if (relMoveX < 0 && Math.abs(relMoveX)>15){
        return true;
     }
     return false;
}

function movedRight(event){
    relMoveX = event.movementX;
    if (relMoveX > 0 && Math.abs(relMoveX)>15){
        return true;
     }
     return false;
}

function movedUp(event){
    relMoveY = event.movementY;
    if (relMoveY < 0 && Math.abs(relMoveX)>15){
        return true;
     }
     return false;
}

function movedDown(event){
    relMoveY = event.movementY;
    if (relMoveY > 0 && Math.abs(relMoveX)>15){
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

/**
 * Checks for mouse movement (left) and executes a function if a 
 * required key is provided 
 * @param {event} event 
 * @param {string} key 
 * @param {function} callback 
 */
function cmdMsLeft(event, key, callback){
    if (keyPressed(event,key)){
        if( movedLeft(event)){
            callback();
        }
    }
}
function cmdMsRight(event,key, callback){
    if (keyPressed(event,key)){
        if( movedRight(event)){
            callback();
        }
    }
}
function cmdMsUp(event,key, callback){
    if (keyPressed(event,key)){
        if( movedUp(event)){
            callback();
        }
    }
}
function cmdMsDown(event, key, callback){
    if (keyPressed(event,key)){
        if( movedDown(event)){
            callback();
        }
    }
}
// TODO: Add round, triangular, L (up to down, down to up) path detection

// TODO: Add functions for performing tasks.

function newWindow(link = "https://google.com"){
    
}
function newTab(link = "://newtab"){
    // REVIEW: Check for browser type first
    //window.open(link); //Opens a new tab if client setting is to open popups as tabs
    browser = "chrome";
    link = browser + link;
    chrome.tabs.create({url: link});
}
function reloadTab(){
    window.open("");
}
function cloneTab(){
    window.open(" ");
}
function goBack(){
    window.history.back();
}
function goForward(){
    window.history.forward();
}

//() => document.addEventListener("mousemove", altAndMouseMove));

/*
Clone current tab , url = " " DONE
New tab , PARTIALLY DONE
Reload, url = "" DONE

window.history.
back()          DONE
forward()       DONE

New window = add third argument to open()   DONE

close tab       NOT DONE (can use chrome.tabs.remove())
        


*/