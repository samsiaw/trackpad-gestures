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
var sensitivity = 15; // Load from chrome.sync
const app = Vue.createApp({
  data() {
    return {
      items: app_mapping,
      cmd_descriptions,
      key_descriptions,
      islight,
      sensitivity
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
    },
    changesensitivity(){
      sensitivity = this.sensitivity;
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

/* Gesture Recognition */
var gesture_track = {
  sensitivity: 15, 
  gesture_pause_time: 100, 
  point_collection_time: 100, 
  collect_points: false, 
  gesture_enabled: true, 
  status: {
    first_point: undefined,
    up: false,
    down: false,
    left: false,
    right: false
  },
};

const disable_gesture = () => {
  gesture_track.gesture_enabled = false;
  setTimeout(() => {
    gesture_track.gesture_enabled = true;
  }, gesture_track.gesture_pause_time);
};

const evaluation_helper = (str) => {
  action_handler(str);
  disable_gesture();
};

const start_point_collection = () => {
  gesture_track.collect_points = true;
  gesture_track.gesture_enabled = true;

  // stop points collection after timeout
  setTimeout(() => {
    gesture_track.collect_points = false;
    gesture_track.gesture_enabled = true;
    const {up, down, left, right} = gesture_track.status;
    
    if ((up && down) || (right && left) || !(up || down || left || right)) {
      console.log("false positive");
      evaluation_helper("");
      return;
    }
    let str = "ms";
    if (left) str += "L";
    else if (right) str += "R";

    if (up) str += "U";
    else if (down) str += "D";

    gesture_track.status.first_point = undefined;
    gesture_track.status.up = false;
    gesture_track.status.down = false;
    gesture_track.status.left = false;
    gesture_track.status.right = false;
    evaluation_helper(str);

  }, gesture_track.point_collection_time);
};

const gesture_handler = (event, action_handler) => {
  if (event.altKey) {
    const x = event.screenX;
    const y = event.screenY;

    if (gesture_track.gesture_enabled){
      const first_point = gesture_track.status.first_point;

      if (gesture_track.collect_points){
        // collect points
        if (!first_point){
          gesture_track.status.first_point = [x, y];
        } else {
          const dx = x - first_point[0];
          const dy = y - first_point[1];
          
          if (Math.abs(dy) > sensitivity){
              if (dy < 0){
                  gesture_track.status.up = true;
              } else if (dy > 0){
                gesture_track.status.down = true;
              }
          }
          if (Math.abs(dx) > sensitivity){
              if (dx < 0) {
                gesture_track.status.left = true;
              } else if (dx > 0) {
                gesture_track.status.right = true;
              }
          }
        }
      } else {
        start_point_collection();
        gesture_track.status.first_point = [x, y];
      }
    }
  }
};

const action_handler = (which_gesture) =>{
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
  if (str_to_gesture[which_gesture] !== undefined) {
    const pg_ges = document.getElementById("playground-gesture");
    const pg_cmd = document.getElementById("playground-command");
    const mapping = current_mapping;
    pg_ges.innerHTML = gesture_descriptions[str_to_gesture[which_gesture]];
    pg_cmd.innerHTML = cmd_descriptions[mapping[str_to_gesture[which_gesture]]];
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

