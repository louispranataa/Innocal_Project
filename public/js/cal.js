const hamburgerMenu = document.getElementById('hamburger-menu');
const navLinks = document.getElementById('nav-links');

hamburgerMenu.addEventListener('click', () => {
    navLinks.classList.toggle('show');
    hamburgerMenu.classList.toggle('active');
});

const calendar = document.querySelector(".calendar"),
  date = document.querySelector(".date"),
  daysContainer = document.querySelector(".days"),
  prev = document.querySelector(".prev"),
  next = document.querySelector(".next"),
  todayBtn = document.querySelector(".today-btn"),
  gotoBtn = document.querySelector(".goto-btn"),
  dateInput = document.querySelector(".date-input"),
  eventDay = document.querySelector(".event-day"),
  eventDate = document.querySelector(".event-date"),
  eventsContainer = document.querySelector(".events"),
  addEventBtn = document.querySelector(".add-event"),
  addEventWrapper = document.querySelector(".add-event-wrapper"),
  addEventCloseBtn = document.querySelector(".close"),
  addEventTitle = document.querySelector(".event-name"),
  addEventDescription = document.querySelector(".event-description"),
  addEventTo = document.querySelector(".event-time-to"),
  addEventSubmit = document.querySelector(".add-event-btn");

let today = new Date();
let activeDay;
let month = today.getMonth();
let year = today.getFullYear();

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const eventsArr = [];
getEvents();
console.log(eventsArr);

function initCalendar() {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const prevLastDay = new Date(year, month, 0);
  const prevDays = prevLastDay.getDate();
  const lastDate = lastDay.getDate();
  const day = firstDay.getDay();
  const nextDays = 7 - lastDay.getDay() - 1;

  date.innerHTML = months[month] + " " + year;

  let days = "";

  for (let x = day; x > 0; x--) {
    days += `<div class="day prev-date">${prevDays - x + 1}</div>`;
  }

  for (let i = 1; i <= lastDate; i++) {
    let event = false;
    eventsArr.forEach((eventObj) => {
      if (
        eventObj.day === i &&
        eventObj.month === month + 1 &&
        eventObj.year === year
      ) {
        event = true;
      }
    });
    if (
      i === new Date().getDate() &&
      year === new Date().getFullYear() &&
      month === new Date().getMonth()
    ) {
      activeDay = i;
      getActiveDay(i);
      updateEvents(i);
      if (event) {
        days += `<div class="day today active event">${i}</div>`;
      } else {
        days += `<div class="day today active">${i}</div>`;
      }
    } else {
      if (event) {
        days += `<div class="day event">${i}</div>`;
      } else {
        days += `<div class="day">${i}</div>`;
      }
    }
  }

  for (let j = 1; j <= nextDays; j++) {
    days += `<div class="day next-date">${j}</div>`;
  }
  daysContainer.innerHTML = days;
  addListner();
}

function prevMonth() {
  month--;
  if (month < 0) {
    month = 11;
    year--;
  }
  initCalendar();
}

function nextMonth() {
  month++;
  if (month > 11) {
    month = 0;
    year++;
  }
  initCalendar();
}

prev.addEventListener("click", prevMonth);
next.addEventListener("click", nextMonth);

initCalendar();

function addListner() {
  const days = document.querySelectorAll(".day");
  days.forEach((day) => {
    day.addEventListener("click", (e) => {
      getActiveDay(e.target.innerHTML);
      updateEvents(Number(e.target.innerHTML));
      activeDay = Number(e.target.innerHTML);
      days.forEach((day) => {
        day.classList.remove("active");
      });
      if (e.target.classList.contains("prev-date")) {
        prevMonth();
        setTimeout(() => {
          const days = document.querySelectorAll(".day");
          days.forEach((day) => {
            if (
              !day.classList.contains("prev-date") &&
              day.innerHTML === e.target.innerHTML
            ) {
              day.classList.add("active");
            }
          });
        }, 100);
      } else if (e.target.classList.contains("next-date")) {
        nextMonth();
        setTimeout(() => {
          const days = document.querySelectorAll(".day");
          days.forEach((day) => {
            if (
              !day.classList.contains("next-date") &&
              day.innerHTML === e.target.innerHTML
            ) {
              day.classList.add("active");
            }
          });
        }, 100);
      } else {
        e.target.classList.add("active");
      }
    });
  });
}

todayBtn.addEventListener("click", () => {
  today = new Date();
  month = today.getMonth();
  year = today.getFullYear();
  initCalendar();
});

dateInput.addEventListener("input", (e) => {
  dateInput.value = dateInput.value.replace(/[^0-9/]/g, "");
  if (dateInput.value.length === 2) {
    dateInput.value += "/";
  }
  if (dateInput.value.length > 7) {
    dateInput.value = dateInput.value.slice(0, 7);
  }
  if (e.inputType === "deleteContentBackward") {
    if (dateInput.value.length === 3) {
      dateInput.value = dateInput.value.slice(0, 2);
    }
  }
});

gotoBtn.addEventListener("click", gotoDate);

function gotoDate() {
  const dateArr = dateInput.value.split("/");
  if (dateArr.length === 2) {
    if (dateArr[0] > 0 && dateArr[0] < 13 && dateArr[1].length === 4) {
      month = dateArr[0] - 1;
      year = dateArr[1];
      initCalendar();
      return;
    }
  }
  alert("Invalid Date");
}

function getActiveDay(date) {
  const day = new Date(year, month, date);
  const dayName = day.toString().split(" ")[0];
  eventDay.innerHTML = dayName;
  eventDate.innerHTML = date + " " + months[month] + " " + year;
}

function updateEvents(date) {
  fetch(`/reminders?day=${date}&month=${month + 1}&year=${year}`)
    .then(response => response.json())
    .then(events => {
      let eventsHTML = "";
      events.forEach((event) => {
        eventsHTML += `
          <div class="event">
            <div class="title">
              <i class="fas fa-circle"></i>
              <h3 class="event-title">${event.title}</h3>
            </div>
            <div class="time">${event.time}</div>
          </div>
        `;
      });

      if (eventsHTML === "") {
        eventsHTML = `<div class="no-event"><h3>No Events</h3></div>`;
      }
      eventsContainer.innerHTML = eventsHTML;
    })
    .catch(error => console.error('Error fetching events:', error));
}


addEventBtn.addEventListener("click", () => {
  addEventWrapper.classList.toggle("active");
});

addEventCloseBtn.addEventListener("click", () => {
  addEventWrapper.classList.remove("active");
});

document.addEventListener("click", (e) => {
  if (e.target !== addEventBtn && !addEventWrapper.contains(e.target)) {
    addEventWrapper.classList.remove("active");
  }
});

addEventTitle.addEventListener("input", (e) => {
  addEventTitle.value = addEventTitle.value.slice(0, 60);
});

function defineProperty() {
  var osccred = document.createElement("div");
  osccred.style.position = "absolute";
  osccred.style.bottom = "0";
  osccred.style.right = "0";
  osccred.style.fontSize = "10px";
  osccred.style.color = "#ccc";
  osccred.style.fontFamily = "sans-serif";
  osccred.style.padding = "5px";
  osccred.style.background = "#fff";
  osccred.style.borderTopLeftRadius = "5px";
  osccred.style.borderBottomRightRadius = "5px";
  osccred.style.boxShadow = "0 0 5px #ccc";
  document.body.appendChild(osccred);
}

defineProperty();

addEventDescription.addEventListener("input", (e) => {
  addEventDescription.value = addEventDescription.value.replace(/[^a-zA-Z0-9\s.,!?'-]/g, "");

  const maxLength = 200;
  if (addEventDescription.value.length > maxLength) {
    addEventDescription.value = addEventDescription.value.slice(0, maxLength);
  }
});

addEventTo.addEventListener("input", (e) => {
  addEventTo.value = addEventTo.value.replace(/[^0-9:]/g, "");
  if (addEventTo.value.length === 2) {
    addEventTo.value += ":";
  }
  if (addEventTo.value.length > 5) {
    addEventTo.value = addEventTo.value.slice(0, 5);
  }
});

// Updated validation for adding events
// Updated validation for adding events
addEventSubmit.addEventListener("click", () => {
  const eventTitle = addEventTitle.value.trim();
  const eventDescription = addEventDescription.value.trim();
  const eventTimeTo = addEventTo.value.trim();

  // Check if all fields are filled
  if (!eventTitle || !eventDescription || !eventTimeTo) {
    alert("Please fill all fields!");
    return;
  }

  // Send a POST request to the backend to add the event
  fetch('/reminders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: eventTitle,
      description: eventDescription,
      time: eventTimeTo,
      day: activeDay,
      month: month + 1,
      year: year,
    }),
  })
    .then(response => response.json())
    .then(() => {
      // Clear input fields after successful addition
      addEventTitle.value = "";
      addEventDescription.value = "";
      addEventTo.value = "";

      // Refresh the events list for the active day
      updateEvents(activeDay);
    })
    .catch(error => {
      console.error('Error adding reminder:', error);
      alert('Failed to add event.');
    });
});


// Handle event deletion
// Handle event deletion
eventsContainer.addEventListener("click", (e) => {
  // Check if the clicked element is an event
  if (e.target.classList.contains("event")) {
    if (confirm("Are you sure you want to delete this event?")) {
      // Get event title, description, and time
      const eventTitle = e.target.querySelector(".event-title").innerHTML;
      const eventDescription = e.target.querySelector(".event-description").innerHTML;
      const eventTime = e.target.querySelector(".event-time").innerHTML;

      console.log('Sending DELETE request with data:', {
        title: eventTitle,
        description: eventDescription,
        time: eventTime,
        day: activeDay,
        month: month + 1,
        year: year
      });

      // Send DELETE request to the server
      fetch(`/reminders`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: eventTitle,
          description: eventDescription,
          time: eventTime,
          day: activeDay,
          month: month + 1,
          year: year,
        }),
      })
        .then(response => response.json())
        .then(data => {
          console.log('Server response:', data);
          if (data.message === 'Event deleted successfully') {
            // Refresh the event list after deletion
            updateEvents(activeDay);
          }
        })
        .catch(error => {
          console.error('Error deleting event:', error);
          alert('Failed to delete event.');
        });
    }
  }
});


// Load events from localStorage
function getEvents() {
  fetch(`/reminders?day=${activeDay}&month=${month + 1}&year=${year}`)
    .then(response => response.json())
    .then(reminders => {
      eventsArr.length = 0; // Clear the previous reminders
      reminders.forEach(reminder => {
        eventsArr.push({
          day: activeDay,
          title: reminder.title,
          description: reminder.description,
          time: reminder.time,
        });
      });
      initCalendar(); // Reinitialize the calendar to reflect reminders
    })
    .catch(error => {
      console.error('Error fetching reminders:', error);
    });
}

getEvents();
