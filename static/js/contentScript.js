
/* Sends messages to the extension's background scripts */
function send_message(str){
    chrome.runtime.sendMessage({msg: str}, (response)=>{
       mess = response.msg;
       console.log(`script: ${mess}`);
    });
}

//TODO Load from chrome.sync.storage
var gesture_track = {
    sensitivity: 15, 
    points_limit: 8,
    collect_points: false, 
    gesture_enabled: true, 
    status: {
      first_point: undefined,
      num_points: 0,
      up: false,
      down: false,
      left: false,
      right: false
    },
};

const gesture_handler = (event, action_handler, mapping, gesture_track) => {
    if (event.altKey) {
      const x = event.screenX;
      const y = event.screenY;
      const sensitivity = gesture_track.sensitivity;
      if (gesture_track.gesture_enabled){
        const first_point = gesture_track.status.first_point;
  
        if (gesture_track.collect_points) {
          if (gesture_track.status.num_points < gesture_track.points_limit){
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
            gesture_track.status.num_points++;
  
          } else {
            // Recognize gesture and reset tracking information
            gesture_track.collect_points = false;
            gesture_track.gesture_enabled = true;
            const {up, down, left, right} = gesture_track.status;
            
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
            gesture_track.status.num_points = 0;
  
            action_handler(str, mapping);
          }
  
        } else {
            // Start Tracking / Collecting Points to recognize gesture
            gesture_track.collect_points = true;
            gesture_track.gesture_enabled = true;
            gesture_track.status.first_point = [x, y];
        }
      }
    }
};
  
function action_handler(which_gesture, mapping_list){
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
    // TODO: Do something with the provided gesture
};

document.addEventListener("mousemove", (event)=>{
    gesture_handler(event, action_handler, mapping, gesture_track);
});
