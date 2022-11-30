const CMDDESCRIPTIONS = [
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
];

const GESTUREDESCRIPTIONS = [
  "mouse Down",
  "mouse Up",
  "mouse Diagonal Left to Right (Up)",
  "mouse Diagonal Left to Right (Down)",
  "mouse Left",
  "mouse Right",
  "mouse Diagonal Right to Left (Down)",
  "mouse Diagonal Right to Left (Up)",
];

const KEYDESCRIPTIONS = ["Alt", "Ctrl"];
const KEYID = Object.freeze({
  ALT: 0,
  CTRL: 1,
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
  pointsLimit: 4,
  collectPoints: false,
  gestureEnabled: true,
  status: {
    firstPoint: undefined,
    numPoints: 0,
    up: false,
    down: false,
    left: false,
    right: false,
  },
  currentMapping: DEFAULTMAPPING,
  threshold: 10, // Default value
  keyID: KEYID.ALT, // Default key = 'alt'
  theme: false, // Default theme = dark
};

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
const THEMECHECKBOX = document.getElementById("theme-checkbox");

// Maps Gesture to Command. Numbers represent command index.
// Index of list represents gesture index

// Load Mappings and Gesture Table
chrome.storage.sync.get(["mapping"]).then((data) => {
  console.log(data);
  console.log(data.mapping);
  TRACK.currentMapping = data.mapping ?? DEFAULTMAPPING;

  // Mapping updated. Load the gesture table
  for (let i in GESTUREDESCRIPTIONS) {
    var row = GESTURETABLE.insertRow(-1);
    var gestureCell = row.insertCell(0);
    gestureCell.innerHTML = GESTUREDESCRIPTIONS[i];

    var iconCell = row.insertCell(1);
    iconCell.innerHTML = ICONCHARS[i];

    // create selector for gesture table
    var commandCell = row.insertCell(2);
    var sel = createSelectElement("Select a command", CMDDESCRIPTIONS, TRACK.currentMapping[i], null); // TODO: Add onchange handler for each selector
    commandCell.appendChild(sel);
  }
});


chrome.storage.sync.get(["threshold"]).then((data) => {
  TRACK.threshold = data.threshold ?? TRACK.threshold;

  // Threshold data acquired. Update value
  let thresholdInput = document.getElementById("threshold-input");
  let thresholdSpan = document.getElementById("threshold-span");

  thresholdInput.value = TRACK.threshold;
  thresholdSpan.innerHTML = TRACK.threshold;

  // TODO: Add onchange handler to threshold-input
});

chrome.storage.sync.get(["keyID"]).then((data) => {
  TRACK.keyID = data.keyID !== undefined ? data.keyID : TRACK.keyID;

  // Update the trigger table
  let selectionCell = TRIGGERTABLE.rows[1].cells[1];

  let sel = createSelectElement("Select a trigger key", KEYDESCRIPTIONS, TRACK.keyID, null);
  selectionCell.appendChild(sel);

  // TODO: Add onchange handler for selector
});

// TODO: Gesture recognition, Playground

/* Theming */
function changeThemeRecurse(parentElement, isLight) {
  parentElement.setAttribute("theme", isLight ? "light" : "dark");
  for (let i = 0; i < parentElement.children.length; i++) {
    changeThemeRecurse(parentElement.children[i], isLight);
  }
}

function changeTheme(isLight) {
  changeThemeRecurse(BODY, isLight);

  // TODO: Update stored theme in background.
  // TODO: Change text for themer

}


chrome.storage.sync.get(["theme"]).then((data) => {
  TRACK.theme = data.theme !== undefined ? data.theme : TRACK.theme;

  // Change the theme and update the theme checkbox's state
  THEMECHECKBOX.checked = TRACK.theme;
  changeTheme(TRACK.theme);

  THEMECHECKBOX.onchange = () => {
    TRACK.theme = THEMECHECKBOX.checked;
    changeTheme(TRACK.theme);
  }
});

const actionHandler = (gestureStr) => {
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
    document.getElementById("playground-gesture").innerHTML = GESTUREDESCRIPTIONS[gestureID];
    document.getElementById("playground-command").innerHTML = CMDDESCRIPTIONS[TRACK.currentMapping[gestureID]];
  } else {
    console.log("action_handler: unknown gesture code");
  }
};

const gestureHandler = (event) => {
  let keyPressed = false;
  switch (TRACK.keyID) { // Have we pressed the trigger key
    case KEYID.ALT:
      keyPressed = event.altKey;
      break;

    case KEYID.CTRL:
      keyPressed = event.ctrlKey;
      break;

    default:
      keyPressed = false;
      break;
  };

  if (keyPressed) {
    const x = event.screenX;
    const y = event.screenY;

    if (TRACK.collectPoints) {
      const first_point = TRACK.status.firstPoint;

      if (TRACK.status.numPoints < TRACK.pointsLimit) {
        // collect points
        if (!first_point) {
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
        TRACK.status.numPoints++;
      } else {
        // Done collecting points
        // Recognize gesture and reset tracking information
        TRACK.collectPoints = false;
        const { up, down, left, right } = TRACK.status;

        let str = "ms";
        if (left) str += "L";
        else if (right) str += "R";

        if (up) str += "U";
        else if (down) str += "D";

        TRACK.status = {
          firstPoint: undefined,
          numPoints: 0,
          up: false,
          down: false,
          left: false,
          right: false,
        };

        actionHandler(str);
      }
    } else {
      // Start Tracking / Collecting Points to recognize gesture
      TRACK.collectPoints = true;
      TRACK.status.firstPoint = [x, y];
    }
  }
};


/* Playground */
const PLAYGROUND = document.getElementById("playground");
PLAYGROUND.addEventListener('mousemove', gestureHandler);

document.addEventListener("DOMContentLoaded", () => {
  console.info("Hello World!");
});

// TODO: Test content script
