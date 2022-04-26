const burger = document.querySelector(".burger");
const map = document.querySelector("#map");
const form = document.querySelector(".form");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");
const formInput = document.querySelector(".form__input--type ");
const locations = document.querySelector(".locations");
const deleteButton = document.querySelectorAll(".workout__delete");
const deleteAllButton = document.querySelector(".delete__all");
const typeYes = document.querySelector(".popup input");
const deletePopup = document.querySelector(".delete__all--popup");
const popups = document.querySelector(".popups");
const overlay = document.querySelector(".overlay");
const popupButton = document.querySelector(".popup__button");

class Workout {
  date = new Date();
  id = (Date.now() + "").slice(-10);

  constructor(coords, duration, distance) {
    this.coords = coords;
    this.duration = duration;
    this.distance = distance;
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = "running";

  constructor(coords, duration, distance, cadence) {
    super(coords, duration, distance);
    this.cadence = cadence;

    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = "cycling";

  constructor(coords, duration, distance, elevationGain) {
    super(coords, duration, distance);
    this.elevationGain = elevationGain;

    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

let workout;

class App {
  #map;
  #mapEvent;
  #workouts = [];
  #mapZoom = 13;
  #markers = [];

  constructor() {
    this._getPosition();

    map.addEventListener("click", this._openSidebar);

    formInput.addEventListener("change", this._changingInput.bind(this));
    form.addEventListener("submit", this._newWorkout.bind(this));

    deleteAllButton.addEventListener(
      "click",
      this._deleteAllWorkouts.bind(this)
    );

    locations.addEventListener("click", this._moveToMarker.bind(this));
    locations.addEventListener("click", this._deleteWorkout.bind(this));
    locations.addEventListener("click", this._editWorkout.bind(this));

    burger.addEventListener("click", this._sidebarPopup);
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("Cannot load map");
        }
      );
    }
  }

  _helper__deleteAll() {
    if (typeYes.value.toLowerCase() === "yes") {
      this.#markers.forEach((marker) => {
        this.#map.removeLayer(marker);
      });
      document.querySelectorAll(".workout").forEach((e) => e.remove());
      this.#workouts = [];
      typeYes.value = "";
      deletePopup.classList.add("hidden");
      popups.classList.add("hidden");
      overlay.classList.add("hidden");
    }
  }

  _deleteAllWorkouts() {
    if (this.#workouts.length === 0) return alert("Prazna lista");
    deletePopup.classList.remove("hidden");
    popups.classList.remove("hidden");
    overlay.classList.remove("hidden");

    document.querySelector(".x").addEventListener("click", () => {
      deletePopup.classList.add("hidden");
      popups.classList.add("hidden");
      overlay.classList.add("hidden");
    });

    popupButton.addEventListener("click", this._helper__deleteAll.bind(this));
  }

  _editWorkout(e) {
    const workoutElement = e.target.closest(".workout");
    const editClosest = e.target.closest(".workout__edit");
    const closestList = e.target.closest("li");

    if (!editClosest) return;

    const findEl = this.#workouts.find(
      (el) => el.id === workoutElement.dataset.id
    );

    closestList.classList.add("edit");

    const html = `
        <form class = 'form__edit'>
      <div class="form__row">
        <label class="form__label">Type</label>
        <select class="form__input form__input--type type__edit">
          <option value="running">Running</option>
          <option value="cycling">Cycling</option>
        </select>
      </div>
      <div class="form__row">
        <label class="form__label">Distance</label>
        <input class="form__input form__input--distance edited__distance" placeholder="km" value = ${+findEl.distance} />

      </div>
      <div class="form__row">
        <label class="form__label">Duration</label>
        <input
          class="form__input form__input--duration edited__duration"
          placeholder="min"
          value = ${+findEl.duration}
        />
      </div>

      <div class="form__row">
        <label class="form__label">Cadence</label>
        <input
          class="form__input form__input--cadence edited__cadence"
          placeholder="step/min"
          value = ${+findEl.cadence}
        />
      </div>
      <div class="form__row form__row--hidden">
        <label class="form__label">Elev Gain</label>
        <input
          class="form__input form__input--elevation edited__elevation"
          placeholder="meters"
          value = ${+findEl.elevationGain}
        />
        </div>
        <button class= 'done__button'>Done</button>
        </form>
    `;

    workoutElement.innerHTML = html;
    document
      .querySelector(".type__edit")
      .addEventListener("change", function (e) {
        if (e.target.value === "running") {
          const elGain = document.querySelector(".edited__elevation");
          const cadence = document.querySelector(".edited__cadence");
          elGain.closest("div").classList.add("form__row--hidden");
          cadence.closest("div").classList.remove("form__row--hidden");
          cadence.value = "";
        }
        if (e.target.value === "cycling") {
          const elGain = document.querySelector(".edited__elevation");
          const cadence = document.querySelector(".edited__cadence");
          elGain.closest("div").classList.remove("form__row--hidden");
          cadence.closest("div").classList.add("form__row--hidden");
          elGain.value = "";
        }
      });

    const done = document.querySelector(".done__button");
    done.addEventListener("click", function (e) {
      const setDescription = (type) => {
        let date = new Date();

        // prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        const description = `${type[0].toUpperCase()}${type.slice(1)} on ${
          months[date.getMonth()]
        } ${date.getDate()}`;
        return description;
      };

      const calcPace2 = () => {
        let pace = duration / distance;

        return pace;
      };
      const calcSpeed2 = () => {
        // km/h
        let speed = distance / (duration / 60);
        return speed;
      };
      const validInputs = (...inputs) =>
        inputs.every((inp) => Number.isFinite(inp));

      const allPositive = (...inputs) => inputs.every((inp) => inp > 0);

      e.preventDefault();
      closestList.classList.remove("edit");

      const distance = document.querySelector(".edited__distance").value;
      const duration = document.querySelector(".edited__duration").value;
      const cadence = document.querySelector(".edited__cadence").value;
      const elevGain = document.querySelector(".edited__elevation").value;
      const typeEdited = document.querySelector(".type__edit");
      let descriptionWord = findEl.description.split(" ")[0];

      if (typeEdited.value === "cycling") {
        findEl.type = "cycling";
        descriptionWord = "Cycling";
        closestList.classList.add("workout--cycling");
        closestList.classList.remove("workout--running");
      }
      if (typeEdited.value === "running") {
        findEl.type = "running";
        descriptionWord = "Running";
        closestList.classList.remove("workout--cycling");
        closestList.classList.add("workout--running");
      }

      findEl.distance = +distance;
      findEl.duration = +duration;
      findEl.cadence = +cadence;
      findEl.description = setDescription(descriptionWord);

      document.querySelector(".form__edit").remove();

      let editedHtml = `
      
      <h2 class="workout__title">${findEl.description}</h2>
      <button class="workout__delete">
      <i class="fa-solid fa-trash"></i>
      </button>
      <button class="workout__edit">
      <i class="fa-solid fa-pen"></i>
      </button>
      <div class="workout__details">
      <span class="workout__icon">${
        findEl.type === "running" ? "🏃‍♂️" : "🚴‍♀️"
      }</span>
            <span class="workout__value">${+distance}</span>
            <span class="workout__unit">km</span>
            </div>
          <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${+duration}</span>
          <span class="workout__unit">min</span>
          </div> `;

      if (findEl.type === "running") {
        editedHtml += `
              <div class="workout__details">
              <span class="workout__icon">⚡️</span>
              <span class="workout__value">${calcPace2().toFixed(2)}</span>
              <span class="workout__unit">min/km</span>
              </div>
              <div class="workout__details">
              <span class="workout__icon">🦶🏼</span>
              <span class="workout__value">${+cadence}</span>
              <span class="workout__unit">spm</span>
              </div>
              `;
      }
      if (findEl.type === "cycling") {
        editedHtml += `
            <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${calcSpeed2().toFixed(2)}</span>
            <span class="workout__unit">km/h</span>
            </div>
            <div class="workout__details">
            <span class="workout__icon">⛰</span>
          <span class="workout__value">${+elevGain}</span>
          <span class="workout__unit">m</span>
        </div>
        `;
      }
      workoutElement.innerHTML = editedHtml;
    });
  }
  _deleteWorkout(e) {
    const deleteClosest = e.target.closest(".workout__delete");
    const workoutElement = e.target.closest(".workout");

    if (!deleteClosest) return;

    const findEl = this.#workouts.find(
      (el) => el.id === workoutElement.dataset.id
    );
    const i = this.#workouts.indexOf(findEl);

    this.#markers.forEach((marker) => {
      const { lat } = marker._latlng;
      const { lng } = marker._latlng;
      const coords = [lat, lng];

      if (coords[0] === findEl.coords[0] && coords[1] === findEl.coords[1]) {
        this.#map.removeLayer(marker);
      }
    });

    this.#workouts.splice(i, 1);

    workoutElement.remove();
  }

  _moveToMarker(e) {
    const workoutElement = e.target.closest(".workout");
    if (!workoutElement) return;

    const workout = this.#workouts.find(
      (work) => work.id === workoutElement.dataset.id
    );
    this.#map.setView(workout.coords, this.#mapZoom, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _newWorkout(e) {
    e.preventDefault();

    const validInputs = (...inputs) =>
      inputs.every((inp) => Number.isFinite(inp));

    const allPositive = (...inputs) => inputs.every((inp) => inp > 0);

    const workoutType = formInput.value;

    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    // console.log(inputCadence.value);

    if (workoutType === "running") {
      const cadence = +inputCadence.value;

      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert("SOMETHIN ");
      workout = new Running([lat, lng], duration, distance, cadence);
    }
    if (workoutType === "cycling") {
      const elevGain = +inputElevation.value;

      if (
        !validInputs(distance, duration, elevGain) ||
        !allPositive(distance, duration)
      )
        return alert("AA");

      workout = new Cycling([lat, lng], duration, distance, elevGain);
    }

    this.#workouts.push(workout);
    // console.log(this.#workouts);

    // Render Workout
    this._renderWorkout(workout);
    // Hide form
    this._hideForm();

    // Render Marker
    this._renderMarker(workout);
    console.log(this.#workouts);
  }

  _renderMarker(workout) {
    const myMarker = L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        }).setContent(
          `${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"} ${workout.description}`
        )
      )
      .openPopup();

    // console.log(myMarker._leaflet_id);
    this.#map.addLayer(myMarker);
    this.#markers.push(myMarker);
  }

  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <button class="workout__delete">
          <i class="fa-solid fa-trash"></i>
        </button>
        <button class="workout__edit">
          <i class="fa-solid fa-pen"></i>
        </button>
        <div class="workout__details">
          <span class="workout__icon">${
            workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"
          }</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div> `;

    if (workout.type === "running") {
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.pace.toFixed(2)}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value">${workout.cadence}</span>
        <span class="workout__unit">spm</span>
      </div>
    </li>`;
    }
    if (workout.type === "cycling") {
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.speed.toFixed(2)}</span>
        <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value">${workout.elevationGain}</span>
        <span class="workout__unit">m</span>
      </div>
    </li>`;
    }
    form.insertAdjacentHTML("afterend", html);
  }

  _changingInput(e) {
    if (e.target.value === "running") {
      inputElevation.closest("div").classList.add("form__row--hidden");
      inputCadence.closest("div").classList.remove("form__row--hidden");
    }
    if (e.target.value === "cycling") {
      inputElevation.closest("div").classList.remove("form__row--hidden");
      inputCadence.closest("div").classList.add("form__row--hidden");
    }
  }

  _loadMap(e) {
    const { latitude } = e.coords;
    const { longitude } = e.coords;
    const coords = [latitude, longitude];

    this.#map = L.map("map").setView(coords, this.#mapZoom);
    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on("click", this._showForm.bind(this));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove("hidden");
    inputDistance.focus();
  }

  _hideForm() {
    // prettier-ignore
    inputElevation.value = inputCadence.value = inputDistance.value = inputDuration.value = ''

    form.style.display = "none";
    form.classList.add("hidden");
    setTimeout(() => (form.style.display = "grid"), 1000);
  }

  _sidebarPopup() {
    document.querySelector(".line1").classList.toggle("active");
    document.querySelector(".line2").classList.toggle("active");

    burger.classList.toggle("active");

    if (burger.classList.contains("active")) {
      document.querySelector(".sidebar").classList.add("active");
      document.querySelector("#map").classList.add("active");
    } else {
      document.querySelector(".sidebar").classList.remove("active");
      document.querySelector("#map").classList.remove("active");
    }
  }
  _openSidebar() {
    if (document.querySelector(".sidebar").classList.contains("active")) return;

    burger.classList.toggle("active");
    document.querySelector(".line1").classList.toggle("active");
    document.querySelector(".line2").classList.toggle("active");
    if (burger.classList.contains("active")) {
      document.querySelector(".sidebar").classList.add("active");
      document.querySelector("#map").classList.add("active");
    } else {
      document.querySelector(".sidebar").classList.remove("active");
      document.querySelector("#map").classList.remove("active");
    }
  }
}

const app = new App();
