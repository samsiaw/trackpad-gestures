const cmd_descriptions = [
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

const gesture_descriptions = [
  "mouse Down",
  "mouse Up",
  "mouse Diagonal Left to Right (Up)",
  "mouse Diagonal Left to Right (Down)",
  "mouse Left",
  "mouse Right",
  "mouse Diagonal Right to Left (Down)",
  "mouse Diagonal Right to Left (Up)",
];

const key_descriptions = ["Alt", "Ctrl"];

const icon_chars = [
  "&#x21D3",
  "&#x21D1",
  "&#x21D7",
  "&#x21D8",
  "&#x21D0",
  "&#x21D2",
  "&#x21D9",
  "&#x21D6",
];
// TODO: Fix gesture recognition issues 
const KEY_TYPE = Object.freeze({
  ALT: 0,
  CTRL: 1,
});
const KEY_EVENT_HANDLER = [(ev) => ev.altKey, (ev) => ev.ctrlKey];

// Maps Gesture (array index) to Command
const default_mapping = [0, 1, 4, 3, 5, 6, 8, 9];

const current_mapping = default_mapping; // TODO: Load mappings from chrome.sync

const islight = false; // Default theme
var threshold = 5; //TODO Load from chrome.sync
var key = undefined; // TODO Load from chrome.sync

/* Gesture Recognition */
const gesture_track = {
  points_limit: 10,
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
    pg_ges.innerHTML = gesture_descriptions[gesture_id];
    pg_cmd.innerHTML = cmd_descriptions[mapping_list[gesture_id]];
  } else {
    console.log("action_handler: unknown gesture code");
  }
};
const gesture_handler = (event, gesture_track, mapping_list, threshold, keyID = -1) => {
  const key_verify = KEY_EVENT_HANDLER[keyID];
  if (key_verify && key_verify(event)) {
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

const app = Vue.createApp({
  data() {
    return {
      items: current_mapping,
      icon_chars,
      cmd_descriptions,
      key_descriptions,
      gesture_descriptions,
      islight,
      threshold,
      keyID: KEY_TYPE.ALT,
    };
  },
  methods: {
    changeTheme: function (state) {
      this.islight = state;
    },
    changemapping: function (gestureIdx, newCmdIdx) {
      if (this.items[gestureIdx] !== undefined) {
        this.items[gestureIdx] = newCmdIdx;
        // TODO: update value in chrome.sync
      }
    },
    changeKey: function (newKeyId) {
      this.keyID = newKeyId;
    },
  },
  watch: {
    threshold: function (newVal, oldVal) {
      this.threshold = parseInt(newVal);
    },
  },
  computed: {
    themestr() {
      return this.islight ? "light" : "dark";
    },
    changethreshold() {
      threshold = parseInt(this.threshold);
    },
  },
});

app.component("custom-select", {
  template: `
  <select v-model.lazy="selectedIdx" :theme="themestr">
    <option disabled :value="NaN" :theme="themestr">Select a {{istrigger ? 'trigger' : 'command'}}</option>
    <option 
      v-for="(cmd, idx) in (istrigger ? this.$parent.key_descriptions : this.$parent.cmd_descriptions)" 
      :value="idx"
      :theme="themestr" v-text="cmd"></option>
  </select>`,
  props: ["cmdidx", "istrigger", "gestureidx"],
  data() {
    return {
      selectedIdx: this.cmdidx,
      isTrigger: this.istrigger,
    };
  },
  methods: {},
  watch: {
    selectedIdx: function (newVal, oldVal) {
      this.istrigger
        ? this.$parent.changeKey(newVal)
        : this.$parent.changemapping(this.gestureidx, newVal);
    },
  },
  computed: {
    themestr() {
      return this.$parent.themestr;
    },
  },
});

app.component("themer", {
  template: `
  <input type="checkbox" id="themer" v-model="this.$parent.islight">
  <label for="themer">{{ descriptor }}</label> 
  `,
  computed: {
    descriptor() {
      return "Change to " + (this.$parent.islight ? "dark" : "light");
    },
  },
});

app.component("playground", {
  template: `
  <div id="playground-wrapper">
    <div id="playground-text">Playground</div>
    <div id="playground" :theme="themestr">
      <div id="playground-gesture"></div>
      <div id="playground-command"></div>
    </div>
  </div>
  `,
  computed: {
    themestr() {
      return this.$parent.themestr;
    },
  },
  mounted() {
    document
      .getElementById("playground")
      .addEventListener("mousemove", (ev) => {
        gesture_handler(
          ev,
          gesture_track,
          this.$parent.items,
          this.$parent.threshold,
          this.$parent.keyID
        );
      });
  },
});

document.addEventListener("DOMContentLoaded", () => {
  app.mount("#app");
});
