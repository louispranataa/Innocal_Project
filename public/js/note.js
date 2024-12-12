document.addEventListener('DOMContentLoaded', () => {
    const accordionContainer = document.getElementById('accordion-container');

    // Fetch reminders from the server
    fetch('/reminders')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error fetching reminders: ${response.statusText} (${response.status})`);
            }
            return response.json();
        })
        .then(reminders => {
            // If no reminders, show empty message
            if (reminders.length === 0) {
                accordionContainer.innerHTML = '<p class="empty-message">No reminders yet.</p>';
                return;
            }

            // Populate reminders in the accordion
            reminders.forEach(reminder => {
                const accordionItem = document.createElement('div');
                accordionItem.classList.add('accordion-item');

                const title = document.createElement('button');
                title.classList.add('accordion-title');
                title.innerText = `${reminder.title}`;

                const content = document.createElement('div');
                content.classList.add('accordion-content');
                content.innerHTML = `
                    <p><strong>Note:</strong> ${reminder.description}</p>
                    <button class="delete-button" data-id="${reminder.id}">Delete</button>
                `;

                accordionItem.appendChild(title);
                accordionItem.appendChild(content);
                accordionContainer.appendChild(accordionItem);

                // Expand/Collapse logic
                title.addEventListener('click', () => {
                    const isOpen = accordionItem.classList.contains('open');
                    accordionItem.classList.toggle('open');
                    content.style.maxHeight = isOpen ? null : content.scrollHeight + "px";
                });

                // Add delete functionality
                const deleteButton = content.querySelector('.delete-button');
                deleteButton.addEventListener('click', (event) => {
                    event.stopPropagation();
                    const reminderId = deleteButton.getAttribute('data-id');
                    deleteReminder(reminderId, accordionItem);
                });
            });
        })
        .catch(error => {
            console.error('Error:', error);
            accordionContainer.innerHTML = `<p class="empty-message">${error.message}</p>`;
        });

    // Function to delete a reminder
    function deleteReminder(reminderId, accordionItem) {
        fetch(`/reminders/${reminderId}`, {
            method: 'DELETE',
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error deleting reminder: ${response.statusText} (${response.status})`);
                }
                accordionItem.remove();
                if (accordionContainer.children.length === 0) {
                    accordionContainer.innerHTML = '<p class="empty-message">No reminders yet.</p>';
                }
            })
            .catch(error => {
                console.error('Error deleting reminder:', error);
                alert('Failed to delete reminder.');
            });
    }
});
