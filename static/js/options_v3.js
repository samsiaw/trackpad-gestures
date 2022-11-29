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
const DEFAULTMAPPING = [0, 1, 4, 3, 5, 6, 8, 9];

// Load Mappings and Gesture Table
var currentMapping;
chrome.storage.sync.get(["mapping"]).then((data) => {
  console.log(data);
  console.log(data.mapping);
  currentMapping = data.mapping ?? DEFAULTMAPPING;
  
  // Mapping updated. Load the gesture table
  for (let i in GESTUREDESCRIPTIONS) {
    var row = GESTURETABLE.insertRow(-1);
    var gestureCell = row.insertCell(0);
    gestureCell.innerHTML = GESTUREDESCRIPTIONS[i];
  
    var iconCell = row.insertCell(1);
    iconCell.innerHTML = ICONCHARS[i];
  
    // create selector for gesture table
    var commandCell = row.insertCell(2);
    var sel = createSelectElement("Select a command", CMDDESCRIPTIONS, currentMapping[i], null); // TODO: Add onchange handler for each selector
    commandCell.appendChild(sel);
  }
});


var threshold = 10;
chrome.storage.sync.get(["threshold"]).then((data) => {
  threshold = data.threshold ?? threshold;

  // Threshold data acquired. Update value
  let thresholdInput = document.getElementById("threshold-input");
  let thresholdSpan = document.getElementById("threshold-span");

  thresholdInput.value = threshold;
  thresholdSpan.innerHTML = threshold;

  // TODO: Add onchange handler to threshold-input
});

var keyID = KEYID.ALT; // Default key = 'alt'
chrome.storage.sync.get(["keyID"]).then((data) => {
  keyID = data.keyID !== undefined ? data.keyID : keyID;

  // Update the trigger table
  let selectionCell = TRIGGERTABLE.rows[1].cells[1];

  let sel = createSelectElement("Select a trigger key", KEYDESCRIPTIONS, keyID, null);
  selectionCell.appendChild(sel);

  // TODO: Add onchange handler for selector
});

// TODO: Gesture recognition, Playground

/* Gesture Recognition */
const gesture_track = {
  points_limit: 4,
  collect_points: false,
  gesture_enabled: true,
  status: {
    first_point: undefined,
    num_points: 0,
    up: false,
    down: false,
    left: false,
    right: false,
  },
};

const action_handler = (which_gesture, mapping_list) => {
  const str_to_gesture = {
    msR: 5,
    msL: 4,
    msD: 0,
    msU: 1,
    msLD: 6,
    msRD: 3,
    msLU: 7,
    msRU: 2,
  };
  const gesture_id = str_to_gesture[which_gesture];
  if (gesture_id !== undefined) {
    const pg_ges = document.getElementById("playground-gesture");
    const pg_cmd = document.getElementById("playground-command");
    pg_ges.innerHTML = GESTUREDESCRIPTIONS[gesture_id];
    pg_cmd.innerHTML = CMDDESCRIPTIONS[mapping_list[gesture_id]];
  } else {
    console.log("action_handler: unknown gesture code");
  }
};

const gesture_handler = (event, gesture_track, mapping_list, threshold, keyID = -1) => {
  var key_pressed = false;
  switch (keyID) {
    case KEYID.ALT:
      key_pressed = event.altKey;
      break;

    case KEYID.CTRL:
      key_pressed = event.ctrlKey;
      break;

    default:
      key_pressed = false;
      break;
  };

  if (key_pressed) {
    const x = event.screenX;
    const y = event.screenY;

    if (gesture_track.collect_points) {
      const first_point = gesture_track.status.first_point;

      if (gesture_track.status.num_points < gesture_track.points_limit) {
        // collect points
        if (!first_point) {
          gesture_track.status.first_point = [x, y];
        } else {
          const dx = x - first_point[0];
          const dy = y - first_point[1];

          if (Math.abs(dy) > threshold) {
            if (dy < 0) {
              gesture_track.status.up = true;
            } else if (dy > 0) {
              gesture_track.status.down = true;
            }
          }
          if (Math.abs(dx) > threshold) {
            if (dx < 0) {
              gesture_track.status.left = true;
            } else if (dx > 0) {
              gesture_track.status.right = true;
            }
          }
        }
        gesture_track.status.num_points++;
      } else {
        // Done collecting points
        // Recognize gesture and reset tracking information
        gesture_track.collect_points = false;
        const { up, down, left, right } = gesture_track.status;

        let str = "ms";
        if (left) str += "L";
        else if (right) str += "R";

        if (up) str += "U";
        else if (down) str += "D";

        gesture_track.status = {
          first_point: undefined,
          num_points: 0,
          up: false,
          down: false,
          left: false,
          right: false,
        };

        action_handler(str, mapping_list);
      }
    } else {
      // Start Tracking / Collecting Points to recognize gesture
      gesture_track.collect_points = true;
      gesture_track.status.first_point = [x, y];
    }
  }
};

function changeTheme(parentElement, isLight) {
  parentElement.setAttribute("theme", isLight ? "light" : "dark");
  for (let i = 0; i < parentElement.children.length; i++){
    changeTheme(parentElement.children[i], isLight);
  }
}

var isLight = false; // Default theme = Dark
chrome.storage.sync.get(["theme"]).then((data) => {
  isLight = data.theme;

  // Change the theme and update the theme checkbox's state
  changeTheme(BODY, isLight);
  THEMECHECKBOX.checked = isLight;

  THEMECHECKBOX.onchange = () => {
    isLight = THEMECHECKBOX.checked;
    changeTheme(BODY, isLight);
  }
});



document.addEventListener("DOMContentLoaded", () => {
  console.info("Hello World!");
});
