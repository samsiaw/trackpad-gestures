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
const default_mapping = [0,1,4,3,5,6,8,9];
const current_mapping = default_mapping; // TODO: Load mappings from chrome.sync
const app_mapping = current_mapping.map((cmd_idx, idx) => { return {
    "gesture": gesture_descriptions[idx],
    "icon": direction_chars_hex[idx],
    "command": cmd_descriptions[cmd_idx],
    cmd_idx
  }
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
  },
});

app.component("custom-select", {
  template: `
  <select v-model.lazy="selectedIdx">
    <option disabled :value="NaN">Select a {{istrigger ? 'trigger' : 'command'}}</option>
    <option v-for="(cmd, idx) in (istrigger ? this.$parent.key_descriptions : this.$parent.cmd_descriptions)" :value="idx">{{cmd}}</option>
  </select>`,
  props: ["cmdidx", "istrigger"],
  data() {
    return {
      selectedIdx: this.cmdidx,
      isTrigger: this.istrigger,
    };
  },
  methods: {},
});
app.component("theme", {
  template: `
  <input type="checkbox" id="themer" v-model.lazy="checked" @change="changetheme">
  <label for="themer">{{ descriptor }}</label> 
  `,
  props: ["light"],
  data(){
    return {
      checked: this.light,
    };
  },
  methods: {
    changetheme: function(){
      const setTo = this.checked ? "light" : "dark";

      const body = document.getElementById("app");
      const rows = document.getElementsByTagName("tr");
      const selectEls = document.getElementsByTagName("select");
      const optionEls = document.getElementsByTagName("option");

      let i = 0; let row; let table; let select; let option;

      while ((row = rows.item(i))){
        row.setAttribute("theme", setTo);
        i++;
      }
      i=0;
      while ((select = selectEls.item(i))){
        select.setAttribute("theme", setTo);
        i++;
      }
      i=0;
      while ((option = optionEls.item(i))){
        option.setAttribute("theme", setTo);
        i++;
      }
      const nav = document.getElementsByTagName("nav").item(0);
      if (nav){
        nav.setAttribute("theme", setTo);
      }
      body.setAttribute("theme", setTo);
      // body.innerHTML = setTo;
    }
  },
  mounted(){
    this.changetheme();
  },
  computed: {
    descriptor(){
      return "Change to "+ (this.checked ? "dark" : "light");
    }
  }
});

document.addEventListener("DOMContentLoaded", () => {
  app.mount("#app");
});
