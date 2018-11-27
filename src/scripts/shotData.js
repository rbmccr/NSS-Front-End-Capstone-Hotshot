import elBuilder from "./elementBuilder"
import shotOnGoal from "./shotClass"

const webpage = document.getElementById("container-master");

let shotCounter = 0;
let newShotEditing = false;
let shotObj = undefined;
let shotArray = []; // reset when game is saved
let shotIdx = 1; //reset when game is saved

const shotData = {

  createNewShot() {
    const btn_newShot = document.getElementById("newShot");
    const fieldImg = document.getElementById("field-img");
    const goalImg = document.getElementById("goal-img");
    shotObj = new shotOnGoal;

    newShotEditing = true;
    btn_newShot.disabled = true;
    console.log("new shot");
    console.log(shotData.getClickCoords)
    fieldImg.addEventListener("click", shotData.getClickCoords)
    goalImg.addEventListener("click", shotData.getClickCoords)

    // activate click functionality and conditional statements on both field and goal images
  },

  getClickCoords(e) {
    // this function gets the relative x and y of the click within the field image container
    // and then calls the function that appends a marker on the page
    let parentContainer;
    if (e.target.id === "field-img") {
      parentContainer = document.getElementById("field-img-parent");
    } else {
      parentContainer = document.getElementById("goal-img-parent");
    }
    // offsetX and Y are the x and y coordinates (pixels) of the click in the container
    // the expressions divide the click x and y by the parent full width and height
    const xCoordRelative = Number((e.offsetX / parentContainer.offsetWidth).toFixed(3))
    const yCoordRelative = Number((e.offsetY / parentContainer.offsetHeight).toFixed(3));
    shotData.markClickonImage(xCoordRelative, yCoordRelative, parentContainer)
  },

  markClickonImage(x, y, parentContainer) {
    let markerId;
    if (parentContainer.id === "field-img-parent") {
      markerId = "shot-marker-field";
    } else {
      markerId = "shot-marker-goal";
    }
    // adjust for 50% of width and height of marker so it's centered about mouse pointer
    let adjustMarkerX = 12.5 / parentContainer.offsetWidth;
    let adjustMarkerY = 12.5 / parentContainer.offsetHeight;

    // if there's NOT already a marker, then make one and place it
    // else move the marker to the new position
    if (!parentContainer.contains(document.getElementById(markerId))) {
      const div = document.createElement("div");
      div.id = markerId;
      div.style.width = "25px";
      div.style.height = "25px";
      div.style.backgroundColor = "lightgreen";
      div.style.border = "1px solid black";
      div.style.borderRadius = "50%";
      div.style.position = "absolute";
      div.style.left = (x - adjustMarkerX) * 100 + "%";
      div.style.top = (y - adjustMarkerY) * 100 + "%";
      parentContainer.appendChild(div);
    } else {
      const currentMarker = document.getElementById(markerId);
      currentMarker.style.left = (x - adjustMarkerX) * 100 + "%";
      currentMarker.style.top = (y - adjustMarkerY) * 100 + "%";
    }
    console.log("parent", parentContainer)
    shotData.addCoordsToClass(markerId, x, y)
  },

  addCoordsToClass(markerId, x, y) {
    // this function updates the instance of shotOnGoal class to record click coordinates
    if (markerId === "shot-marker-field") {
      shotObj.fieldX = x;
      shotObj.fieldY = y;
    } else {
      shotObj.goalX = x;
      shotObj.goalY = y;
    }
  },

  cancelShot() {
    const btn_newShot = document.getElementById("newShot");
    const inpt_ballSpeed = document.getElementById("ballSpeedInput");
    const sel_aerial = document.getElementById("aerialInput");

    if (!newShotEditing) {
      return
    } else {
      // reset editing mode var to false
      // clear clicked items in field and goal images
      newShotEditing = false;
      btn_newShot.disabled = false;
      inpt_ballSpeed.value = null;
      sel_aerial.value = "Standard";
    }

  },

  saveShot() {
    const btn_newShot = document.getElementById("newShot");
    const fieldImg = document.getElementById("field-img");
    const goalImg = document.getElementById("goal-img");
    const inpt_ballSpeed = document.getElementById("ballSpeedInput");
    const sel_aerial = document.getElementById("aerialInput");
    const shotBtnContainer = document.getElementById("shotControls");

    // include condition that prevents user from not entering field or goal position

    if (!newShotEditing) {
      return
    } else {
      newShotEditing = false;
      btn_newShot.disabled = false;
      shotCounter++;
      // clear field and goal event listeners
      fieldImg.removeEventListener("click", shotData.getClickCoords)
      goalImg.removeEventListener("click", shotData.getClickCoords)
      // remove markers from field and goal

      //TODO: add condition to prevent blank entries and missing coordinates
      if (sel_aerial.value === "Aerial") {shotObj.aerial = true} else {shotObj.aerial = false};
      shotObj.ballSpeed = inpt_ballSpeed.value;
      shotArray.push(shotObj)
      shotObj = undefined;
      console.log(shotArray)

      const newShotBtn = elBuilder("button", { "id": `shot${shotCounter}`, "class": "button is-link" }, `Shot ${shotCounter}`)
      shotBtnContainer.appendChild(newShotBtn);
      inpt_ballSpeed.value = null;
      sel_aerial.value = "Standard";
    }

  }

}

export default shotData