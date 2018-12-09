import elBuilder from "./elementBuilder"
import heatmapData from "./heatmapData"

const webpage = document.getElementById("container-master");

const dateFilter = {

  buildDateFilter() {
    // this function is called from heatmaps.js and is triggered from the heatmaps page of the site when
    // the date filter is selected
    const endDateInput = elBuilder("input", { "id": "endDateInput", "class": "input", "type": "date" }, null);
    const endDateControl = elBuilder("div", { "class": "control" }, null, endDateInput);
    const endDateLabel = elBuilder("label", { "class": "label" }, "Date 2:\xa0");
    const endDateInputField = elBuilder("div", { "class": "field is-grouped is-grouped-centered is-grouped-multiline" }, null, endDateLabel, endDateControl);

    const startDateInput = elBuilder("input", { "id": "startDateInput", "class": "input", "type": "date" }, null);
    const startDateControl = elBuilder("div", { "class": "control" }, null, startDateInput);
    const startDateLabel = elBuilder("label", { "class": "label" }, "Date 1:\xa0");
    const startDateInputField = elBuilder("div", { "class": "field is-grouped is-grouped-centered is-grouped-multiline" }, null, startDateLabel, startDateControl);

    const clearFilterBtn = elBuilder("button", {"id":"clearDateFilter", "class": "button is-danger" }, "Clear Filter");
    const clearFilterButtonControl = elBuilder("div", { "class": "control" }, null, clearFilterBtn);
    const dateSaveBtn = elBuilder("button", { "class": "button is-success" }, "Set Filter");
    const saveButtonControl = elBuilder("div", { "class": "control" }, null, dateSaveBtn);
    const cancelBtn = elBuilder("button", { "class": "button is-danger" }, "Cancel");
    const cancelButtonControl = elBuilder("div", { "class": "control" }, null, cancelBtn);
    const buttonField = elBuilder("div", { "class": "field is-grouped is-grouped-centered is-grouped-multiline" }, null, saveButtonControl, clearFilterButtonControl, cancelButtonControl);

    const modalContent = elBuilder("div", { "class": "modal-content box" }, null, startDateInputField, endDateInputField, buttonField);
    const modalBackground = elBuilder("div", { "class": "modal-background" }, null);
    const modal = elBuilder("div", { "id": "modal-dateFilter", "class": "modal" }, null, modalBackground, modalContent);

    webpage.appendChild(modal);
    this.modalsEventManager();
  },

  openDateFilter() {
    const dateRangeBtn = document.getElementById("dateRangeBtn");
    const dateFilterModal = document.getElementById("modal-dateFilter");
    // check if global vars are set. If so, don't toggle color of button
    const dateSet = heatmapData.handleDateFilterGlobalVariables(true);

    if (dateSet !== undefined) {
      dateFilterModal.classList.toggle("is-active");
    } else {
      dateRangeBtn.classList.toggle("is-outlined");
      dateFilterModal.classList.toggle("is-active");
    }

  },

  clearDateFilter() {
    // this function resets global date filter variables in heatmapData.js and replaces date inputs with blank date inputs
    let startDateInput = document.getElementById("startDateInput");
    let endDateInput = document.getElementById("endDateInput");
    const dateFilterModal = document.getElementById("modal-dateFilter");

    heatmapData.handleDateFilterGlobalVariables();
    dateRangeBtn.classList.add("is-outlined");
    startDateInput.replaceWith(elBuilder("input", { "id": "startDateInput", "class": "input", "type": "date" }, null));
    endDateInput.replaceWith(elBuilder("input", { "id": "endDateInput", "class": "input", "type": "date" }, null));

    if (dateFilterModal.classList.contains("is-active")) {
      dateFilterModal.classList.remove("is-active");
    }

  },

  modalsEventManager() {
    // date filter modal
    const dateRangeBtn = document.getElementById("dateRangeBtn");
    const dateFilterModal = document.getElementById("modal-dateFilter");
    const startDateInput = document.getElementById("startDateInput");
    const endDateInput = document.getElementById("endDateInput");
    const clearDateFilterBtn = document.getElementById("clearDateFilter");

    dateFilterModal.addEventListener("click", (e) => {
      // add functionality to set filter button
      if (e.target.textContent === "Set Filter") {

        startDateInput.classList.remove("is-danger");
        endDateInput.classList.remove("is-danger");

        // check if date pickers have a valid date
        if (startDateInput.value === "") {
          startDateInput.classList.add("is-danger");
        } else if (endDateInput.value === "") {
          endDateInput.classList.add("is-danger");
        } else {
          // if they do, then set global vars in heatmaps page and close modal
          heatmapData.handleDateFilterGlobalVariables(false, startDateInput.value, endDateInput.value);
          dateFilterModal.classList.toggle("is-active");
        }
        // add functionality to cancel button
      } else if (e.target.textContent === "Cancel") {
        // if global variables are defined already, cancel should not change the class on the date range button
        const dateSet = heatmapData.handleDateFilterGlobalVariables(true);
        if (dateSet !== undefined) {
          dateFilterModal.classList.toggle("is-active");
        } else {
          dateRangeBtn.classList.toggle("is-outlined");
          dateFilterModal.classList.toggle("is-active");
        }
      }
    });

    // add functionality to clear date button
    clearDateFilterBtn.addEventListener("click", dateFilter.clearDateFilter);

  }

}

export default dateFilter