// Include this script in accordion.js
document.addEventListener('DOMContentLoaded', () => {
    const accordionContainer = document.getElementById('accordion-container');

    function formatDate(isoString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' }; // Example: "December 9, 2024"
        return new Date(isoString).toLocaleDateString(undefined, options);
    }

    // Fetch reminders from the server
    fetch('/reminders')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error fetching reminders: ${response.statusText} (${response.status})`);
            }
            return response.json();
        })
        .then(reminders => {
            if (reminders.length === 0) {
                accordionContainer.innerHTML = '<p class="empty-message">No reminders yet.</p>';
                return;
            }

            reminders.forEach(reminder => {
                const accordionItem = document.createElement('div');
                accordionItem.classList.add('accordion-item');

                const formattedDate = formatDate(reminder.reminder_date); // Format the date

                const title = document.createElement('button');
                title.classList.add('accordion-title');
                title.innerText = `${reminder.title} - ${formattedDate} - ${reminder.time}`;

                const content = document.createElement('div');
                content.classList.add('accordion-content');
                content.innerHTML = `
                    <p><strong>Title:</strong> ${reminder.title}</p>
                    <p><strong>Date:</strong> ${formattedDate}</p>
                    <p><strong>Time:</strong> ${reminder.time}</p>
                    <button class="edit-button" data-id="${reminder.id}">Edit</button>
                    <button class="delete-button" data-id="${reminder.id}">Delete</button>
                `;

                accordionItem.appendChild(title);
                accordionItem.appendChild(content);
                accordionContainer.appendChild(accordionItem);

                title.addEventListener('click', () => {
                    const isOpen = accordionItem.classList.contains('open');
                    accordionItem.classList.toggle('open');
                    content.style.maxHeight = isOpen ? null : content.scrollHeight + "px";
                });

                const editButton = content.querySelector('.edit-button');
                editButton.addEventListener('click', () => showEditForm(reminder, accordionItem));

                const deleteButton = content.querySelector('.delete-button');
                deleteButton.addEventListener('click', (event) => {
                    event.stopPropagation();
                    deleteReminder(reminder.id, accordionItem);
                });
            });
        })
        .catch(error => {
            console.error('Error:', error);
            accordionContainer.innerHTML = `<p class="empty-message">${error.message}</p>`;
        });

    function showEditForm(reminder, accordionItem) {
        const content = accordionItem.querySelector('.accordion-content');
        content.innerHTML = `
            <label for="edit-title">Edit Title:</label>
            <input type="text" id="edit-title" value="${reminder.title}" />
            <label for="edit-time">Edit Time:</label>
            <input type="time" id="edit-time" value="${reminder.time}" />
            <button class="submit-edit-button" data-id="${reminder.id}">Submit</button>
        `;

        const submitButton = content.querySelector('.submit-edit-button');
        submitButton.addEventListener('click', () => {
            const updatedTitle = document.getElementById('edit-title').value;
            const updatedTime = document.getElementById('edit-time').value;
            updateReminder(reminder.id, updatedTitle, updatedTime, accordionItem);
        });
    }

    function updateReminder(id, title, time, accordionItem) {
        fetch(`/reminders/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, time })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to update reminder');
                }
                return response.json();
            })
            .then(data => {
                // Update the accordion title
                const titleButton = accordionItem.querySelector('.accordion-title');
                titleButton.innerText = `${title} - ${data.reminder.reminder_date} - ${time}`;
    
                // Restore the original content view
                const content = accordionItem.querySelector('.accordion-content');
                content.innerHTML = `
                    <p><strong>Title:</strong> ${title}</p>
                    <p><strong>Date:</strong> ${data.reminder.reminder_date}</p>
                    <p><strong>Time:</strong> ${time}</p>
                    <button class="edit-button" data-id="${id}">Edit</button>
                    <button class="delete-button" data-id="${id}">Delete</button>
                `;
    
                // Re-attach event listeners for edit and delete
                const editButton = content.querySelector('.edit-button');
                editButton.addEventListener('click', () => showEditForm(data.reminder, accordionItem));
    
                const deleteButton = content.querySelector('.delete-button');
                deleteButton.addEventListener('click', (event) => {
                    event.stopPropagation();
                    deleteReminder(id, accordionItem);
                });
    
                alert('Reminder updated successfully!');
            })
            .catch(error => {
                console.error('Error updating reminder:', error);
                alert('Failed to update reminder.');
            });
    }
    

    function deleteReminder(id, accordionItem) {
        fetch(`/reminders/${id}`, {
            method: 'DELETE',
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to delete reminder');
                }
                accordionItem.remove();
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Failed to delete reminder.');
            });
    }
});

