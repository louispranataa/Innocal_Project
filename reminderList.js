const reminderListContainer = document.getElementById('reminderList');

const loadReminders = () => {
    const reminders = JSON.parse(localStorage.getItem('reminders')) || {};
    for (const [date, text] of Object.entries(reminders)) {
        const listItem = document.createElement('div');
        listItem.textContent = `${date}: ${text}`;
        reminderListContainer.appendChild(listItem);
    }
};

window.onload = loadReminders;
