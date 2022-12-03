// TODO: Load from chrome.sync.storage
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

const KEYDESCRIPTIONS = Object.freeze(["Alt", "Ctrl"]);


const MSGTYPE = Object.freeze({
  GESTURE: 0, // Tell background to execute some action
  THRESHOLD: 1, // Received an update to threshold value OR request the threshold value
  KEY: 2, // Received an update to the key being used to trigger gestures OR request the key value
  STATUS: 3,
});

/* Sends messages to background script about what gesture is recognized*/
function sendGestureMessage(gesture_str) {
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
    if (response.type === MSGTYPE.status) {
      if (response.value === true){
        console.log("Action executed successfully");
      } else {
        console.warn("Failed to execute action for gesture");
      }
    }
  });
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
    case 1:
      keyPressed = event.key === 'Control';
      break;
    
    case 0:
      keyPressed = event.key === 'Alt';
      break;
  }

  if (keyPressed) {
    resetTrackedGesture(true);
  }
};


// TODO: Migrate to using chrome storage api in content scripts!

// Get the current threshold value
chrome.runtime.sendMessage({ value: undefined, type: MSGTYPE.THRESHOLD}, (response) => {
  if (response.type === MSGTYPE.THRESHOLD) {
    TRACK.threshold = response.value;
    console.log("Received threshold value from background: "+ TRACK.threshold);
  } else {
    console.warn("Failed to retrieve threshold value from background");
  }
});

// Get the current key id value
chrome.runtime.sendMessage({ value: undefined, type: MSGTYPE.KEY}, (response) => {
  if (response.type === MSGTYPE.KEY) {
    TRACK.keyID = response.value;
    console.log("Received key value from background: "+ TRACK.keyID);
  } else {
    console.warn("Failed to retrieve key value from background");
  }
});


document.addEventListener("mousemove", mouseMoveHandler);
document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);
console.log("Injected");