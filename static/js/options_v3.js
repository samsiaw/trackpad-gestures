const CMDDESCRIPTIONS = Object.freeze([
  "Open New Tab",
  "Open New Background Tab",
  "Close Tab",
  "Reopen Recently Closed Tab",
  "Reload Tab",
  "Back",
  "Forward",
  "Open New Window",
  "Close Active Window",
  "Go Home",
  "Reload Tab (Hard Refresh)",
  "Do Nothing",
]);

const GESTUREDESCRIPTIONS = Object.freeze([
  "Move Down",
  "Move Up",
  "Move Top Right",
  "Move Down Right",
  "Move Left",
  "Move Right",
  "Move Down Left",
  "Move Top Left",
]);

const TRIGGERDESCRIPTIONS = Object.freeze(["Alt Key", "Ctrl Key", "Right Click"]);
const KEYID = Object.freeze({
  ALT: 0,
  CTRL: 1,
  MSRIGHT: 2,
});

const ICONCHARS = [
  "&#x21D3",
  "&#x21D1",
  "&#x21D7",
  "&#x21D8",
  "&#x21D0",
  "&#x21D2",
  "&#x21D9",
  "&#x21D6",
];
const DEFAULTMAPPING = [0, 1, 4, 3, 5, 6, 8, 9];

const TRACK = {
  collectPoints: false,
  status: {
    firstPoint: undefined,
    up: false,
    down: false,
    left: false,
    right: false,
  },
  currentMapping: DEFAULTMAPPING,
  threshold: 15, // Default value
  keyID: 0, // Default key = 'alt'
  theme: false, // Default theme = dark
  triggerType: undefined,
  allowCtxMenu: false, // Used for dbl right click events
};

const THRESHOLDMIN = 5;
const THRESHOLDMAX = 40;
const DBLCLICKINTERVAL = 300; // ms

function createSelectElement(description, optionsTextArray, selectedValue, onChangeHandler) {
  // type: string
  const sel = document.createElement("select");
  const infoOption = document.createElement("option");
  infoOption.disabled = true;
  infoOption.text = description;
  sel.appendChild(infoOption);

  for (let optionIdx in optionsTextArray) {
    var option = document.createElement("option");
    option.text = optionsTextArray[optionIdx];
    option.value = optionIdx;
    sel.appendChild(option);
  }

  sel.value = selectedValue;
  sel.onchange = onChangeHandler;
  return sel;
}

const TRIGGERTABLE = document.getElementById("trigger-table");
const GESTURETABLE = document.getElementById("gesture-table");
const BODY = document.getElementById("body");
const THEMETOGGLE = document.getElementById("toggle-outer");

// Maps Gesture to Command. Numbers represent command index.
// Index of list represents gesture index

// Load Mappings and Gesture Table
chrome.storage.sync.get(["mapping"]).then((data) => {
  TRACK.currentMapping = data.mapping ?? DEFAULTMAPPING;

  let createSelOnChangeHandler = (gestureID) => {

    function selOnChangeHandler(event) {
      let cmdID = event.target.value;
      let cmdDescription = CMDDESCRIPTIONS[cmdID];
      let gestureDescription = GESTUREDESCRIPTIONS[gestureID];

      if (cmdDescription !== undefined && gestureDescription !== undefined) {
        TRACK.currentMapping[gestureID] = Number(cmdID);

        chrome.storage.sync.set({ "mapping": TRACK.currentMapping }).then(() => {
          console.log('Gesture: ' + gestureDescription + ' changed its command to ' + cmdDescription);
        });

      }
    }
    return selOnChangeHandler;
  }

  // Mapping updated. Load the gesture table
  for (let i in GESTUREDESCRIPTIONS) {
    var row = GESTURETABLE.insertRow(-1);
    var gestureCell = row.insertCell(0);
    gestureCell.innerText = GESTUREDESCRIPTIONS[i];

    var iconCell = row.insertCell(1);
    iconCell.innerHTML = ICONCHARS[i];
    iconCell.classList.add("icon-char");

    // create selector for gesture table
    var commandCell = row.insertCell(2);

    var sel = createSelectElement("Select a command", CMDDESCRIPTIONS, TRACK.currentMapping[i], createSelOnChangeHandler(i));
    commandCell.appendChild(sel);
  }
});


chrome.storage.sync.get(["threshold"]).then((data) => {
  TRACK.threshold = data.threshold !== undefined ? data.threshold : TRACK.threshold;

  // Threshold data acquired. Update value
  let thresholdInput = document.getElementById("threshold-input");
  let thresholdSpan = document.getElementById("threshold-span");

  thresholdInput.value = TRACK.threshold;
  thresholdSpan.innerText = TRACK.threshold;

  thresholdInput.onchange = (event) => {
    // Update the synced value
    let threshold = Number(event.target.value);
    if (threshold > THRESHOLDMAX) {
      threshold = THRESHOLDMAX;
    } else if (threshold < THRESHOLDMIN) {
      threshold = THRESHOLDMIN;
    }
    TRACK.threshold = threshold;
    thresholdInput.value = threshold;
    thresholdSpan.innerText = TRACK.threshold;

    chrome.storage.sync.set({ "threshold": Number(threshold) }).then(() => {
      console.log("threshold updated to " + threshold);
    });
  }

  thresholdInput.oninput = (event) => {
    thresholdSpan.innerText = event.target.value;
  }
});

chrome.storage.sync.get(["keyID"]).then((data) => {
  TRACK.keyID = data.keyID !== undefined ? data.keyID : TRACK.keyID;
  console.log("stored keyID:" + TRACK.keyID);
  // Update the trigger table
  let selectionCell = TRIGGERTABLE.rows[1].cells[1];

  let selOnChangeHandler = (event) => {
    let keyID = Number(event.target.value);
    let triggerDescription = TRIGGERDESCRIPTIONS[keyID];

    if (triggerDescription !== undefined) {
      chrome.storage.sync.set({ "keyID": keyID }).then(() => {
        TRACK.keyID = keyID;
        console.log("Changed key to " + triggerDescription);
      });
    }
  };

  let sel = createSelectElement("Select a trigger key", TRIGGERDESCRIPTIONS, TRACK.keyID, selOnChangeHandler);
  selectionCell.appendChild(sel);

});

/* Theming */
function changeThemeRecurse(parentElement, isLight) {
  parentElement.setAttribute("theme", isLight ? "light" : "dark");
  for (let i = 0; i < parentElement.children.length; i++) {
    changeThemeRecurse(parentElement.children[i], isLight);
  }
}

function changeTheme(isLight) {
  changeThemeRecurse(BODY, isLight);
}


chrome.storage.sync.get(["theme"]).then((data) => {
  TRACK.theme = data.theme !== undefined ? data.theme : TRACK.theme;

  // Change the theme and update the theme checkbox's state
  changeTheme(TRACK.theme);
  THEMETOGGLE.onclick = (event) => {
    TRACK.theme = !TRACK.theme;
    chrome.storage.sync.set({ "theme": TRACK.theme }).then(() => {
      changeTheme(TRACK.theme);
    });
  }
});

const actionHandler = (gestureStr) => {
  if (TRACK.status.firstPoint !== undefined) {
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
    const gestureID = strToGestureID[gestureStr];
    if (gestureID !== undefined) {
      document.getElementById("playground-gesture").innerText = GESTUREDESCRIPTIONS[gestureID];
      document.getElementById("playground-command").innerText = CMDDESCRIPTIONS[TRACK.currentMapping[gestureID]];
    } else {
      console.log("action_handler: couldn't recognize gesture");
    }
  }
};

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

    actionHandler(str);
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

/* Playground */
const PLAYGROUND = document.getElementById("playground");
PLAYGROUND.addEventListener('mousemove', mouseMoveHandler);

document.addEventListener('keyup', keyUpHandler);
document.addEventListener('keydown', keyDownHandler);
document.addEventListener("mouseup", mouseUpHandler);
document.addEventListener("mousedown", mouseDownHandler);
document.addEventListener("contextmenu", contextMenuHandler);

document.addEventListener("DOMContentLoaded", () => {
  console.info("Hello World!");
});
