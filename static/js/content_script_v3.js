const TRACK = {
  pointsLimit: 4,
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
};

const KEYID = Object.freeze({
  ALT: 0,
  CTRL: 1,
  SHIFT: 2,
});

const KEYDESCRIPTIONS = Object.freeze(["Alt", "Ctrl"]);


const MSGTYPE = Object.freeze({
  GESTURE: 0, // Tell background to execute some action
  THRESHOLD: 1, // Received an update to threshold value OR request the threshold value
  KEY: 2, // Received an update to the key being used to trigger gestures OR request the key value
  STATUS: 3,
});

function resetTrackedGesture(collectPoints) {
  Object.assign(TRACK, {
    collectPoints,
    status: {
      firstPoint: undefined,
      up: false,
      down: false,
      left: false,
      right: false,
    },
  });
};

/* Sends messages to background script about what gesture is recognized*/
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
          console.log("Action executed successfully");
        } else {
          console.warn("Failed to execute action for gesture");
        }
      }
    });

  } else {
    console.log("content_script: extension was removed or reinstalled");
    document.removeEventListener("mousemove", mouseMoveHandler);
    document.removeEventListener("keydown", keyDownHandler);
    document.removeEventListener("keyup", keyUpHandler);
  }
}

const mouseMoveHandler = (event) => {
  if (TRACK.collectPoints) {
    const x = event.screenX;
    const y = event.screenY;
    const first_point = TRACK.status.firstPoint;

      // collect points
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

const keyUpHandler = (event) => {
  if (TRACK.collectPoints) {
    // Recognize gesture and reset gesture tracking information
    const { up, down, left, right } = TRACK.status;

    let str = "ms";
    if (left) str += "L";
    else if (right) str += "R";

    if (up) str += "U";
    else if (down) str += "D";

    sendGestureMessage(str);
    resetTrackedGesture(false);
  }
};

const keyDownHandler = (event) => {
  let keyPressed = false;
  switch (Number(TRACK.keyID)){
    case KEYID.CTRL:
      keyPressed = event.key === 'Control';
      break;
    
    case KEYID.ALT:
      keyPressed = event.key === 'Alt';
      break;
    
    case KEYID.SHIFT:
      keyPressed = event.key === 'Shift';
      break;
  }

  if (keyPressed) {
    resetTrackedGesture(true);
  }
};

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    if (changes['keyID'] !== undefined) {
      const {newValue, oldValue } = changes['keyID'];
      TRACK.keyID = Number(newValue);
      console.log("content_script: keyID changed from", oldValue, "to", newValue);
    }

    if (changes['threshold'] !== undefined) {
      const {newValue, oldValue } = changes['threshold'];
      TRACK.threshold = Number(newValue);
      console.log("content_script: threshold changed from", oldValue, "to", newValue);
    }
  }
});

document.addEventListener("mousemove", mouseMoveHandler);
document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);
console.log("Injected");