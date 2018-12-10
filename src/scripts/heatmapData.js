import heatmap from "../lib/node_modules/heatmap.js/build/heatmap.js"
import API from "./API.js";
import elBuilder from "./elementBuilder.js";
import dateFilter from "./dateFilter.js";

// ID of setInterval function used to monitor container width and repaint heatmap if container width changes
// let intervalId;
// global variable to store fetched shots
let globalShotsArr;
let joinTableArr = [];
// global variable used with ball speed filter on heatmaps
let configHeatmapWithBallspeed = false;
// global variables used with date range filter
let startDate;
let endDate;

// FIXME: examine confirmHeatmapDelete function. may not need for loop. grab ID from option
// TODO: set interval for container width monitoring
// TODO: if custom heatmap is selected from dropdown, then blur filter container
// TODO: save heatmap with date timestamp

const heatmapData = {

  getUserShots() {
    // this function removes an existing heatmap if necessary and then determines whether
    // to call the basic heatmap or saved heatmap functions

    const fieldContainer = document.getElementById("field-img-parent");
    const goalContainer = document.getElementById("goal-img-parent");
    const heatmapDropdown = document.getElementById("heatmapDropdown");

    const heatmapName = heatmapDropdown.value;
    const fieldHeatmapCanvas = fieldContainer.childNodes[2]
    const goalHeatmapCanvas = goalContainer.childNodes[1]

    // if there's already a heatmap loaded, remove it before continuing
    if (fieldHeatmapCanvas !== undefined) {
      fieldHeatmapCanvas.remove();
      goalHeatmapCanvas.remove();
      if (heatmapName === "Basic Heatmap") {
        heatmapData.fetchBasicHeatmapData();
      } else {
        heatmapData.fetchSavedHeatmapData();
      }
    } else {
      if (heatmapName === "Basic Heatmap") {
        heatmapData.fetchBasicHeatmapData();
      } else {
        heatmapData.fetchSavedHeatmapData();
      }
    }
  },

  fetchBasicHeatmapData() {
    // this function goes to the database and retrieves shots that meet specific filters (all shots fetched if )
    let gameIds_date = [];
    let gameIds_result = [];
    let gameIds = []; // array that contains game ID values passing both the date and game result filters
    const gameResultFilter = document.getElementById("filter-gameResult").value;
    const gameURLextension = heatmapData.applyGameFilters();

    API.getAll(gameURLextension)
      .then(games => {
        games.forEach(game => {
          // the date filter and game results filters cannot be applied in the JSON server URL, so the filters are
          // called here. Each function populates an array with game IDs that match the filter requirements.
          // a filter method is then used to collect all matching game IDs from the two arrays (i.e. a game that passed
          // the requirements of both filters)
          // NOTE: if start date is not defined, the result filter is the only function called, and it is passed the third array
          if (startDate !== undefined) {
            dateFilter.applydateFilter(startDate, endDate, gameIds_date, game);
            heatmapData.applyGameResultFilter(gameResultFilter, gameIds_result, game);
          } else {
            heatmapData.applyGameResultFilter(gameResultFilter, gameIds, game);
          }
        })
        if (startDate !== undefined) {
          gameIds = gameIds_date.filter(id => gameIds_result.includes(id))
          console.log("date", gameIds_date, "result", gameIds_result, "return this:", gameIds)
          return gameIds;
        }
        return gameIds;
      })
      .then(gameIds => {
        if (gameIds.length === 0) {
          alert("Sorry! Either no shots have been saved yet or no games match the current filters. Visit the Gameplay page to get started or to add more shots.")
          return
        } else {
          const shotURLextension = heatmapData.applyShotFilters(gameIds);
          API.getAll(shotURLextension)
            .then(shots => {
              if (shots.length === 0) {
                alert("Sorry! No shots match the current filters. Visit the Gameplay page to get started or add to more shots.")
                return
              } else {
                globalShotsArr = shots;
                heatmapData.buildFieldHeatmap(shots);
                heatmapData.buildGoalHeatmap(shots);
                // intervalId = setInterval(heatmapData.getActiveOffsets, 500);
              }
            })
        }
      });
  },

  fetchSavedHeatmapData() {
    // this function, and its counterpart fetchSavedShotsUsingJoinTables render an already-saved heatmap though these steps:
    // 1. getting the heatmap name from the dropdown value
    // 2. using the name to find the childNodes index of the dropdown value (i.e. which HTML <option>) and get its ID
    // 3. fetch all shot_heatmap join tables with matching heatmap ID
    // 4. fetch shots using shot IDs from join tables
    // 5. render heatmap by calling build functions

    // step 1: get name of heatmap
    const heatmapDropdown = document.getElementById("heatmapDropdown");
    let currentDropdownValue = heatmapDropdown.value;
    // step 2: use name to get heatmap ID stored in HTML option element
    let currentHeatmapId;
    heatmapDropdown.childNodes.forEach(child => {
      if (child.textContent === currentDropdownValue) {
        currentHeatmapId = child.id.slice(8);
      }
    });
    // step 3: fetch join tables
    API.getAll(`shot_heatmap?heatmapId=${currentHeatmapId}`)
      .then(joinTables => heatmapData.fetchSavedShotsUsingJoinTables(joinTables)
        // step 5: pass shots to buildFieldHeatmap() and buildGoalHeatmap()
        .then(shots => {
          heatmapData.buildFieldHeatmap(shots);
          heatmapData.buildGoalHeatmap(shots);
          joinTableArr = [];
        })
      )
  },

  fetchSavedShotsUsingJoinTables(joinTables) {
    // see notes on fetchSavedHeatmapData()
    joinTables.forEach(table => {
      // step 4. then fetch using each shotId in the join tables
      joinTableArr.push(API.getSingleItem("shots", table.shotId))
    })
    return Promise.all(joinTableArr)
  },

  applyGameFilters() {
    // NOTE: game result filter (victory/defeat) cannot be applied in this function and is applied after the fetch
    const activeUserId = sessionStorage.getItem("activeUserId");
    const gameModeFilter = document.getElementById("filter-gameMode").value;
    const gametypeFilter = document.getElementById("filter-gameType").value;
    const overtimeFilter = document.getElementById("filter-overtime").value;
    const teamStatusFilter = document.getElementById("filter-teamStatus").value;

    let URL = "games";

    URL += `?userId=${activeUserId}`;
    // game mode
    if (gameModeFilter === "Competitive") {
      URL += "&mode=competitive"
    } else if (gameModeFilter === "Casual") {
      URL += "&mode=casual"
    }
    // game type
    if (gametypeFilter === "3v3") {
      URL += "&type=3v3"
    } else if (gametypeFilter === "2v2") {
      URL += "&type=2v2"
    } else if (gametypeFilter === "1v1") {
      URL += "&type=1v1"
    }
    // overtime
    if (overtimeFilter === "OT") {
      URL += "&overtime=true"
    } else if (overtimeFilter === "No OT") {
      URL += "&overtime=false"
    }
    // team status
    if (teamStatusFilter === "No party") {
      URL += "&party=false"
    } else if (teamStatusFilter === "Party") {
      URL += "&party=true"
    }

    return URL;
  },

  applyGameResultFilter(gameResultFilter, gameIds, game) {
    // if victory, then check for game's score vs game's opponent score
    // if the filter isn't selected at all, push all game IDs to gameIds array
    if (gameResultFilter === "Victory") {
      if (game.score > game.opp_score) {
        gameIds.push(game.id);
      } else {
        return
      }
    } else if (gameResultFilter === "Defeat") {
      if (game.score < game.opp_score) {
        gameIds.push(game.id);
      } else {
        return
      }
    } else {
      gameIds.push(game.id);
    }
  },

  applyShotFilters(gameIds) {
    const shotTypeFilter = document.getElementById("filter-shotType").value;
    let URL = "shots"

    // game ID
    // for each gameId, append URL. Append & instead of ? once first gameId is added to URL
    if (gameIds.length > 0) {
      let gameIdCount = 0;
      gameIds.forEach(id => {
        if (gameIdCount < 1) {
          URL += `?gameId=${id}`;
          gameIdCount++;
        } else {
          URL += `&gameId=${id}`;
        }
      })
    } // else statement is handled in fetchBasicHeatmapData()
    // shot type
    if (shotTypeFilter === "Aerial") {
      URL += "&aerial=true";
    } else if (shotTypeFilter === "Standard") {
      URL += "&aerial=false"
    }
    return URL;
  },

  buildFieldHeatmap(shots) {
    console.log("Array of fetched shots", shots)

    // create field heatmap with configuration
    const fieldContainer = document.getElementById("field-img-parent");
    let varWidth = fieldContainer.offsetWidth;
    let varHeight = fieldContainer.offsetHeight;

    let fieldConfig = heatmapData.getFieldConfig(fieldContainer);

    let FieldHeatmapInstance;
    FieldHeatmapInstance = heatmap.create(fieldConfig);

    let fieldDataPoints = [];

    shots.forEach(shot => {
      let x_ = Number((shot.fieldX * varWidth).toFixed(0));
      let y_ = Number((shot.fieldY * varHeight).toFixed(0));
      let value_ = 1;
      // set value as ball speed if speed filter is selected
      if (configHeatmapWithBallspeed) {
        value_ = shot.ball_speed;
      }
      let fieldObj = { x: x_, y: y_, value: value_ };
      fieldDataPoints.push(fieldObj);
    });

    const fieldData = {
      max: 1,
      min: 0,
      data: fieldDataPoints
    };

    // set max value as max ball speed in shots, if filter is selected
    if (configHeatmapWithBallspeed) {
      let maxBallSpeed = shots.reduce((max, shot) => shot.ball_speed > max ? shot.ball_speed : max, shots[0].ball_speed);
      fieldData.max = maxBallSpeed;
    }

    FieldHeatmapInstance.setData(fieldData);
  },

  buildGoalHeatmap(shots) {
    // create goal heatmap with configuration
    const goalContainer = document.getElementById("goal-img-parent");
    let varGoalWidth = goalContainer.offsetWidth;
    let varGoalHeight = goalContainer.offsetHeight;

    let goalConfig = heatmapData.getGoalConfig(goalContainer);

    let GoalHeatmapInstance;
    GoalHeatmapInstance = heatmap.create(goalConfig);

    let goalDataPoints = [];

    shots.forEach(shot => {
      let x_ = Number((shot.goalX * varGoalWidth).toFixed(0));
      let y_ = Number((shot.goalY * varGoalHeight).toFixed(0));
      let value_ = 1;
      // set value as ball speed if speed filter is selected
      if (configHeatmapWithBallspeed) {
        value_ = shot.ball_speed;
      }
      let goalObj = { x: x_, y: y_, value: value_ };
      goalDataPoints.push(goalObj);
    });

    const goalData = {
      max: 1,
      min: 0,
      data: goalDataPoints
    }

    // set max value as max ball speed in shots, if filter is selected
    if (configHeatmapWithBallspeed) {
      let maxBallSpeed = shots.reduce((max, shot) => shot.ball_speed > max ? shot.ball_speed : max, shots[0].ball_speed);
      goalData.max = maxBallSpeed;
    }

    GoalHeatmapInstance.setData(goalData);
  },

  getFieldConfig(fieldContainer) {
    // Ideal radius is about 25px at 550px width, or 4.545%
    return {
      container: fieldContainer,
      radius: 0.045454545 * fieldContainer.offsetWidth,
      maxOpacity: .6,
      minOpacity: 0,
      blur: .85
    };
  },

  getGoalConfig(goalContainer) {
    // Ideal radius is about 35px at 550px width, or 6.363%
    return {
      container: goalContainer,
      radius: .063636363 * goalContainer.offsetWidth,
      maxOpacity: .6,
      minOpacity: 0,
      blur: .85
    };
  },

  ballSpeedMax() {
    // this button function callback (it's a filter) changes a boolean global variable that determines the min and max values
    // used when rendering the heatmaps (see buildFieldHeatmap() and buildGoalHeatmap())
    const ballSpeedBtn = document.getElementById("ballSpeedBtn");

    if (configHeatmapWithBallspeed) {
      configHeatmapWithBallspeed = false;
      ballSpeedBtn.classList.toggle("is-outlined");
    } else {
      configHeatmapWithBallspeed = true;
      ballSpeedBtn.classList.toggle("is-outlined");
    }

    // if there's a heatmap loaded already, convert the config immediately to use the max ball speed
    // the IF statement is needed so the user can't immediately render a heatmap just by clicking
    // the speed filter
    // const fieldContainer = document.getElementById("field-img-parent");

    // const fieldHeatmapCanvas = fieldContainer.childNodes[2]
    // if (fieldHeatmapCanvas !== undefined) {
    //   heatmapData.getUserShots();
    // }
  },

  /*getActiveOffsets() {
    // this function evaluates the width of the heatmap container at 0.5 second intervals. If the width has changed,
    // then the heatmap canvas is repainted to fit within the container limits
    const fieldContainer = document.getElementById("field-img-parent")
    let captureWidth = fieldContainer.offsetWidth
    //evaluate container width after 0.5 seconds vs initial container width
    if (captureWidth === varWidth) {
      console.log("unchanged");
    } else {
      varWidth = captureWidth
      console.log("new width", varWidth);
      //clear heatmap
      fieldContainer.removeChild(fieldContainer.childNodes[0]);
      //build heatmap again
      heatmapData.buildHeatmap();
    }
  },*/

  saveHeatmap() {
    // this function is responsible for saving a heatmap object with a name and userId, then making join tables with
    // TODO: require unique heatmap name (may not need to do this if function below uses ID instead of name)
    const heatmapDropdown = document.getElementById("heatmapDropdown");
    const saveInput = document.getElementById("saveHeatmapInput");
    const fieldContainer = document.getElementById("field-img-parent");

    const heatmapTitle = saveInput.value;
    const fieldHeatmapCanvas = fieldContainer.childNodes[2];

    // heatmap must have a title, the title cannot be "Save successful!" or "Basic Heatmap", and there must be a heatmap loaded on the page
    if (heatmapTitle.length > 0 && heatmapTitle !== "Save successful!" && heatmapTitle !== "Basic Heatmap" && fieldHeatmapCanvas !== undefined) {
      console.log("saving heatmap...");
      saveInput.classList.remove("is-danger");
      heatmapData.saveHeatmapObject(heatmapTitle)
        .then(heatmapObj => heatmapData.saveJoinTables(heatmapObj).then(x => {
          console.log("join tables saved", x)
          // empty the temporary global array used with Promise.all
          joinTableArr = []
          // append newly created heatmap as option element in select dropdown
          heatmapDropdown.appendChild(elBuilder("option", { "id": `heatmap-${heatmapObj.id}` }, heatmapObj.name));
          saveInput.value = "Save successful!";
        }));
    } else {
      saveInput.classList.add("is-danger");
    }
  },

  saveHeatmapObject(heatmapTitle) {
    // this function saves a heatmap object with the user-provided name and the userId
    const activeUserId = Number(sessionStorage.getItem("activeUserId"));
    const heatmapObj = {
      name: heatmapTitle,
      userId: activeUserId
    }
    return API.postItem("heatmaps", heatmapObj)
  },

  saveJoinTables(heatmapObj) {
    console.log("globalshotsarray", globalShotsArr)
    globalShotsArr.forEach(shot => {
      let joinTableObj = {
        shotId: shot.id,
        heatmapId: heatmapObj.id
      }
      joinTableArr.push(API.postItem("shot_heatmap", joinTableObj));
    });
    return Promise.all(joinTableArr)
  },

  deleteHeatmap() {
    // this function is the logic that prevents the user from deleting a heatmap in one click.
    // a second delete button and a cancel button are rendered before a delete is confirmed
    const heatmapDropdown = document.getElementById("heatmapDropdown");
    let currentDropdownValue = heatmapDropdown.value;

    if (currentDropdownValue === "Basic Heatmap") {
      return
    } else {
      const deleteHeatmapBtn = document.getElementById("deleteHeatmapBtn");
      const confirmDeleteBtn = elBuilder("button", { "class": "button is-danger" }, "Confirm Delete");
      const rejectDeleteBtn = elBuilder("button", { "class": "button is-dark" }, "Cancel");
      const DeleteControl = elBuilder("div", { "id": "deleteControl", "class": "buttons" }, null, confirmDeleteBtn, rejectDeleteBtn);
      deleteHeatmapBtn.replaceWith(DeleteControl);
      confirmDeleteBtn.addEventListener("click", heatmapData.confirmHeatmapDeletion);
      rejectDeleteBtn.addEventListener("click", heatmapData.rejectHeatmapDeletion);
    }

  },

  rejectHeatmapDeletion() {
    // this function re-renders the primary delete button
    const DeleteControl = document.getElementById("deleteControl");
    const deleteHeatmapBtn = elBuilder("button", { "id": "deleteHeatmapBtn", "class": "button is-danger" }, "Delete Heatmap")
    DeleteControl.replaceWith(deleteHeatmapBtn)
    deleteHeatmapBtn.addEventListener("click", heatmapData.deleteHeatmap);
  },

  confirmHeatmapDeletion() {
    // this function will delete the selected heatmap option in the dropdown list and remove all shot_heatmap join tables
    const heatmapDropdown = document.getElementById("heatmapDropdown");
    let currentDropdownValue = heatmapDropdown.value;

    heatmapDropdown.childNodes.forEach(child => {
      if (child.textContent === currentDropdownValue) { //TODO: check this logic. may be able to use ID instead of requiring unique name
        child.remove();
        heatmapData.deleteHeatmapObjectandJoinTables(child.id)
          .then(() => {
            heatmapDropdown.value = "Basic Heatmap";
            heatmapData.rejectHeatmapDeletion();
          });
      } else {
        return
      }
    })

  },

  deleteHeatmapObjectandJoinTables(heatmapId) {
    const activeUserId = sessionStorage.getItem("activeUserId");
    return API.deleteItem("heatmaps", `${heatmapId.slice(8)}?userId=${activeUserId}`)
  },

  handleBallSpeedGlobalVariables() {
    // this function is used by the reset filters button and navbar heatmaps tab to force the ball speed filter off
    configHeatmapWithBallspeed = false;
  },

  handleDateFilterGlobalVariables(returnBoolean, startDateInput, endDateInput) {
    // this function is used to SET the date filter global variables on this page or CLEAR them
    // if the 1. page is reloaded or 2. the "reset filters" button is clicked

    // the dateFilter.js cancel button requests a global var to determine how to handle button color
    if (returnBoolean) {
      return startDate
    }

    // if no input values are provided, that means the variables need to be reset and the date
    // filter button should be outlined - else set global vars for filter
    if (startDateInput === undefined) {
      startDate = undefined;
      endDate = undefined;
      console.log("SET start date", startDateInput, "SET end date", endDateInput)
    } else {
      startDate = startDateInput;
      endDate = endDateInput;
    }


  }

}

export default heatmapData