const monthYearElement = document.getElementById('monthYear');
const datesContainer = document.getElementById('datesContainer');
const prevMonthButton = document.getElementById('prevMonth');
const nextMonthButton = document.getElementById('nextMonth');
const reminderDateInput = document.getElementById('reminderDate');
const reminderTextInput = document.getElementById('reminderText');
const setReminderButton = document.getElementById('setReminder');
const reminderList = document.getElementById('reminderList');
const viewRemindersButton = document.getElementById('viewReminders');

let currentDate = new Date();
let reminders = JSON.parse(localStorage.getItem('reminders')) || {};

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    monthYearElement.textContent = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    datesContainer.innerHTML = '';
    const firstDay = new Date(year, month, 1);
    const totalDays = new Date(year, month + 1, 0).getDate(); 
    const lastDay = new Date(year, month, totalDays);

    for (let i = 0; i < firstDay.getDay(); i++) {
        datesContainer.appendChild(document.createElement('div'));
    }

    for (let i = 1; i <= totalDays; i++) {
        const dateDiv = document.createElement('div');
        dateDiv.classList.add('date');
        dateDiv.textContent = i;

        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        if (reminders[dateKey]) {
            dateDiv.style.backgroundColor = '#FFD700'; 
        }

        dateDiv.onclick = () => addReminderForDate(dateKey);
        datesContainer.appendChild(dateDiv);
    }

    const lastDayWeekday = lastDay.getDay();
    for (let i = lastDayWeekday + 1; i < 7; i++) {
        datesContainer.appendChild(document.createElement('div'));
    }
}

function addReminderForDate(dateKey) {
    reminderTextInput.value = '';
    reminderDateInput.value = dateKey; 

    setReminderButton.onclick = () => {
        const text = reminderTextInput.value;
        if (text) {
            reminders[dateKey] = text;
            addReminderToList(dateKey, text);
            saveReminders();
            renderCalendar();
        } else {
            alert('Please enter a reminder text');
        }
    };
}

function changeMonth(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    renderCalendar();
}

prevMonthButton.onclick = () => changeMonth(-1);
nextMonthButton.onclick = () => changeMonth(1);

function addReminderToList(date, text) {
    const listItem = document.createElement('div');
    listItem.textContent = `${date}: ${text}`;
    
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.classList.add('delete');
    deleteButton.onclick = () => {
        delete reminders[date];
        reminderList.removeChild(listItem);
        saveReminders();
        renderCalendar();
    };

    listItem.appendChild(deleteButton);
    reminderList.appendChild(listItem);
}

function saveReminders() {
    localStorage.setItem('reminders', JSON.stringify(reminders));
}

function displayCurrentDateAndDay() {
    const today = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const currentDateString = today.toLocaleDateString(undefined, options);
    const currentDay = today.toLocaleString('default', { weekday: 'long' });

    document.getElementById('currentDate').textContent = currentDateString;
    document.getElementById('currentDay').textContent = currentDay;
}

displayCurrentDateAndDay();

viewRemindersButton.onclick = () => {
    window.open('reminders.html', '_self'); 
};

window.onload = () => {
    loadReminders();
    renderCalendar();
};

function loadReminders() {
    const loadedReminders = JSON.parse(localStorage.getItem('reminders')) || {};
    for (const [date, text] of Object.entries(loadedReminders)) {
        addReminderToList(date, text);
    }
}
