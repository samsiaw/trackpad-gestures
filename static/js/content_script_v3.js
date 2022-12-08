const TRACK = {
  collectPoints: false,
  status: {
    firstPoint: undefined,
    up: false,
    down: false,
    left: false,
    right: false,
  },
  threshold: 15,
  keyID: 0,
  allowCtxMenu: false,
  triggerType: undefined,
};

const KEYID = Object.freeze({
  ALT: 0,
  CTRL: 1,
  MSRIGHT: 2,
});

const DBLCLICKINTERVAL = 300;

const MSGTYPE = Object.freeze({
  GESTURE: 0, // Tell background to execute some action
  STATUS: 3,
});

function sendGestureMessage(gesture_str) {
  if (chrome.runtime?.id !== undefined){
    const strToGestureID = {
      msR: 5,
      msL: 4,
      msD: 0,
      msU: 1,
      msLD: 6,
      msRD: 3,
      msLU: 7,
      msRU: 2,
    };
    chrome.runtime.sendMessage({ value: strToGestureID[gesture_str], type: MSGTYPE.GESTURE}, (response) => {
      if (response.type === MSGTYPE.STATUS) {
        if (response.value === true){
          // console.log("content_script: Action executed successfully");
        } else {
          // console.log("content_script: Failed to execute action for gesture");
        }
      }
    });

  } else {
    // console.log("content_script: extension was removed or reinstalled");

    document.removeEventListener("mousemove", mouseMoveHandler);
    document.removeEventListener("keydown", keyDownHandler);
    document.removeEventListener("keyup", keyUpHandler);
    document.removeEventListener("mouseup", mouseUpHandler);
    document.removeEventListener("mousedown", mouseDownHandler);
    document.removeEventListener("contextmenu", contextMenuHandler);
  }
}

function resetTrackedGesture(collectPoints, whichTrigger) {
  Object.assign(TRACK, {
    collectPoints,
    status: {
      firstPoint: undefined,
      up: false,
      down: false,
      left: false,
      right: false,
    },
    triggerType: whichTrigger,
  });
};

const mouseMoveHandler = (event) => {
  if (TRACK.collectPoints) {
    const x = event.screenX;
    const y = event.screenY;
    const first_point = TRACK.status.firstPoint;

    if (first_point === undefined) {
      TRACK.status.firstPoint = [x, y];
    } else {
      const dx = x - first_point[0];
      const dy = y - first_point[1];

      if (Math.abs(dy) > TRACK.threshold) {
        if (dy < 0) {
          TRACK.status.up = true;
        } else if (dy > 0) {
          TRACK.status.down = true;
        }
      }
      if (Math.abs(dx) > TRACK.threshold) {
        if (dx < 0) {
          TRACK.status.left = true;
        } else if (dx > 0) {
          TRACK.status.right = true;
        }
      }
    }
  }
};

function recognizeGesture(event, whichTrigger) {
  if (TRACK.collectPoints && TRACK.triggerType === whichTrigger) {
    // Recognize gesture and reset gesture tracking information
    const { up, down, left, right } = TRACK.status;

    let str = "ms";
    if (left) str += "L";
    else if (right) str += "R";

    if (up) str += "U";
    else if (down) str += "D";

    sendGestureMessage(str);
    resetTrackedGesture(false, undefined);
  }
};

function recognizeTrigger(event, whichTrigger) {
  let keyPressed = false;
  if (whichTrigger === "key") {
    switch (Number(TRACK.keyID)) {
      case KEYID.CTRL:
        keyPressed = event.key === 'Control';
        break;

      case KEYID.ALT:
        keyPressed = event.key === 'Alt';
        break;
    }
  } else if (whichTrigger === "ms") {
    keyPressed = Number(TRACK.keyID) === KEYID.MSRIGHT && event.button === 2;
  }

  if (keyPressed) {
    resetTrackedGesture(true, whichTrigger);
  }
};

function keyUpHandler(event) {
  recognizeGesture(event, "key");
}

function keyDownHandler(event) {
  recognizeTrigger(event, "key");
}

function mouseUpHandler(event) {
  recognizeGesture(event, "ms");
}

function mouseDownHandler(event) {
  recognizeTrigger(event, "ms");
}

function contextMenuHandler(event) {
  // Only allows the context menu to show for dbl right clicks
  if (Number(TRACK.keyID) === KEYID.MSRIGHT && event.button === 2) {
    if (TRACK.allowCtxMenu) {
      resetTrackedGesture(false, undefined);
      TRACK.allowCtxMenu = false;
    } else {
      event.preventDefault();
      TRACK.allowCtxMenu = true;
      setTimeout(function () {
        TRACK.allowCtxMenu = false;
      }, DBLCLICKINTERVAL);
    }
  }
}

document.addEventListener('mousemove', mouseMoveHandler);
document.addEventListener('keyup', keyUpHandler);
document.addEventListener('keydown', keyDownHandler);
document.addEventListener("mouseup", mouseUpHandler);
document.addEventListener("mousedown", mouseDownHandler);
document.addEventListener("contextmenu", contextMenuHandler);


chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    if (changes['keyID'] !== undefined) {
      const {newValue, oldValue } = changes['keyID'];
      TRACK.keyID = Number(newValue);
    }

    if (changes['threshold'] !== undefined) {
      const {newValue, oldValue } = changes['threshold'];
      TRACK.threshold = Number(newValue);
    }
  }
});

chrome.storage.sync.get(["threshold", "keyID"]).then((data) => {
  TRACK.threshold = data.threshold !== undefined ? data.threshold : TRACK.threshold;
  TRACK.keyID = data.keyID !== undefined ? data.keyID : TRACK.keyID;
});

// console.log("Injected");