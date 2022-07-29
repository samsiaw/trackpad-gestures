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
  "&#x21D1",
  "&#x21D3",
  "&#x21D7",
  "&#x21D8",
  "&#x21D0",
  "&#x21D2",
  "&#x21D9",
  "&#x21D6",
];

const current_mappings = []; // TODO: Load mappings from chrome.sync
for (const [idx, gesture] of gesture_descriptions.entries()) {
  current_mappings.push({
    gesture,
    icon: direction_chars_hex[idx],
    command: cmd_descriptions[idx],
    cmd_idx: idx,
  });
}

const app = Vue.createApp({
  data() {
    return {
      items: current_mappings,
      cmd_descriptions,
      key_descriptions,
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
  <select v-model="selectedIdx">
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

document.addEventListener("DOMContentLoaded", () => {
  app.mount("#app");
});
