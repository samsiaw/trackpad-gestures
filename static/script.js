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


    /**
     * Checks for mouse movement (left) and executes a function if a 
     * required key is provided 
     * @param {event} event 
     * @param {string} key 
     * @param {function} callback 
     */
    cmdMsLeft(event, key, callback){
        if (keyPressed(event,key)){
            if( movedLeft(event)){
                callback();
                
            }
        }
    }
    cmdMsRight(event,key, callback){
        if (keyPressed(event,key)){
            if( movedRight(event)){
                callback();
            }
        }
    }
    cmdMsUp(event,key, callback){
        if (keyPressed(event,key)){
            if( movedUp(event)){
                callback();
            }
        }
    }
    cmdMsDown(event, key, callback){
        if (keyPressed(event,key)){
            if( movedDown(event)){
                callback();
            }
        }
    }
    // TODO: Add round, triangular, L (up to down, down to up) path detection

    // TODO: Add functions for performing tasks.

    newWindow(link = "https://google.com"){
        window.open(link,"", "h");
    }
    newTab(link = "://newtab"){
        // REVIEW: Check for browser type first and use chrome.tabs.create
        //window.open(link); //Opens a new tab if client setting is to open popups as tabs
        /*browser = "chrome";
        link = browser + link;
        chrome.tabs.create({url: link});*/
        // TODO: Uncomment parts above
        window.open("","_blank");

        // REVIEW: Firefox, opera, chrome newtab - about:newtab;
    }
    reloadTab(){
        window.open("");
    }
    cloneTab(){
        const w = window.open(" ");
        if (w !== undefined){
            true;
        }
    }
    goBack(){
        window.history.back();
    }
    goForward(){
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

New window = use chrome.windows.create({state: "maximized"}) DONE (background script);

close tab       NOT DONE (can use chrome.tabs.remove())

*/
