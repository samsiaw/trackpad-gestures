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

const key_descriptions = ["Alt"];

const direction_chars_hex = [
  "&#x21D3",
  "&#x21D1",
  "&#x21D7",
  "&#x21D8",
  "&#x21D0",
  "&#x21D2",
  "&#x21D9",
  "&#x21D6",
];
// Maps Gesture (array index) to Command
const default_mapping = [0, 1, 4, 3, 5, 6, 8, 9];
const current_mapping = default_mapping; // TODO: Load mappings from chrome.sync
const app_mapping = current_mapping.map((cmd_idx, idx) => {
  return {
    gesture: gesture_descriptions[idx],
    icon: direction_chars_hex[idx],
    command: cmd_descriptions[cmd_idx],
    cmd_idx,
  };
});
const islight = false; // Default theme

const app = Vue.createApp({
  data() {
    return {
      items: app_mapping,
      cmd_descriptions,
      key_descriptions,
      islight,
    };
  },
  mounted() {
    // window.customVue = this;
  },
  methods: {
    changetheme: function(){
      this.islight = !this.islight;
    }
  },
  computed: {
    themestr(){
      return this.islight ? 'light' : 'dark';
    }
  }
});

app.component("custom-select", {
  template: `
  <select v-model.lazy="selectedIdx" :theme="themestr">
    <option disabled :value="NaN" :theme="themestr">Select a {{istrigger ? 'trigger' : 'command'}}</option>
    <option 
      v-for="(cmd, idx) in (istrigger ? this.$parent.key_descriptions : this.$parent.cmd_descriptions)" 
      :value="idx"
      :theme="themestr">{{cmd}}</option>
  </select>`,
  props: ["cmdidx", "istrigger"],
  data() {
    return {
      selectedIdx: this.cmdidx,
      isTrigger: this.istrigger,
    };
  },
  methods: {},
  computed: {
    themestr(){
      return this.$parent.themestr;
    }
  }
});

app.component("themer", {
  template: `
  <input type="checkbox" id="themer" v-model.lazy="checked" @change="changetheme">
  <label for="themer">{{ descriptor }}</label> 
  `,
  data() {
    return {
    };
  },
  methods: {
    changetheme: function () {
      this.$parent.changetheme();
    },
  },
  mounted() {
  },
  computed: {
    descriptor() {
      return "Change to " + (this.$parent.islight ? "dark" : "light");
    },
  },
});

const abs = Math.abs;
const sensitivity = 15; // Load from chrome.sync
const gesture_hold_time = 300; // ms
const gesture_tick = true; // ALlows gesture commands to fire when True
const fp_constraint = 10; // False Positive Contraint. Anything relative movement less than this is not considered valid
var gesture_track = [sensitivity, gesture_hold_time, gesture_tick];
const disable_gesture = () => {
  gesture_track[2] = false;
  setTimeout(() => {
    gesture_track[2] = true;
  }, gesture_track[gesture_hold_time]);
};

const gesture_handler = (event, action_handler) => {
  if (event.altKey) {
    const relMoveX = event.movementX;
    const relMoveY = event.movementY;
    if (gesture_track[2]) {
      if (abs(relMoveX) > sensitivity && abs(relMoveY) < fp_constraint) {
        if (relMoveX > 0) {
          // ms Right, ms ==> mouse
          disable_gesture();
          action_handler("msR");
          return;
        } else {
          //ms Left
          disable_gesture();
          action_handler("msL");
          return;
        }
      }
      if (abs(relMoveY) > sensitivity && abs(relMoveX) < fp_constraint) {
        if (relMoveY < 0) {
          //ms Up
          disable_gesture();
          action_handler("msU");
          return;
        } else {
          //ms Down
          disable_gesture();
          action_handler("msD");
          return;
        }
      }
      if (abs(relMoveY) > sensitivity && abs(relMoveX) > sensitivity) {
        if (relMoveX < 0) {
          // Right to left
          if (relMoveY > 0) {
            // ms Diagonal Right to left Downwards
            disable_gesture();
            action_handler("msLD");
            return;
          } else {
            disable_gesture();
            action_handler("msLU");
            return;
          }
        } else {
          // left to right
          if (relMoveY < 0) {
            // ms Diagonal Left to Right Upwards
            disable_gesture();
            action_handler("msRU");
            return;
          } else {
            // ms Diagonal Left to Right Downwards
            disable_gesture();
            action_handler("msRD");
            return;
          }
        }
      }
    }
  }
};

const action_handler = (str) =>{
  const str_to_gesture = {
    "msR": 5,
    "msL": 4,
    "msD": 0,
    "msU": 1,
    "msLD": 6,
    "msRD": 3,
    "msLU": 7,
    "msRU": 2,
  };
  if (str_to_gesture[str] !== undefined) {
    const pg_ges = document.getElementById("playground-gesture");
    const pg_cmd = document.getElementById("playground-command");
    const mapping = current_mapping;
    pg_ges.innerHTML = gesture_descriptions[str_to_gesture[str]];
    pg_cmd.innerHTML = cmd_descriptions[mapping[str_to_gesture[str]]];
  }
};

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
  props: [],
  data(){
  },
  computed: {
    themestr(){
      return this.$parent.themestr;
    }
  }, 
  mounted(){
    document.getElementById("playground").addEventListener("mousemove", (ev) => {
      gesture_handler(ev, action_handler);
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  app.mount("#app");
});


