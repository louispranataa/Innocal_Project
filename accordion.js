const hamburgerMenu = document.getElementById('hamburger-menu');
const navLinks = document.getElementById('nav-links');

hamburgerMenu.addEventListener('click', () => {
    navLinks.classList.toggle('show');
    hamburgerMenu.classList.toggle('active');
});

document.getElementById('add-accordion-button').addEventListener('click', () => {
    const accordionContainer = document.getElementById('accordion-container');
    const emptyMessage = accordionContainer.querySelector('.empty-message');
    if (emptyMessage) emptyMessage.remove();

    const newAccordionItem = document.createElement('div');
    newAccordionItem.classList.add('accordion-item');

    const newTitle = document.createElement('button');
    newTitle.classList.add('accordion-title');
    newTitle.innerText = "Fill in your reminder here";

    const deleteIcon = document.createElement('button');
    deleteIcon.classList.add('delete-icon');
    deleteIcon.innerHTML = '✖';
    deleteIcon.addEventListener('click', (event) => {
        event.stopPropagation();
        accordionContainer.removeChild(newAccordionItem);
        if (!accordionContainer.children.length) {
            accordionContainer.innerHTML = '<p class="empty-message">No reminders yet.</p>';
        }
    });

    newTitle.appendChild(deleteIcon);

    const newContent = document.createElement('div');
    newContent.classList.add('accordion-content');
    newContent.innerHTML = `
        <label>Event Title: <input type="text" placeholder="Enter event title..."></label><br>
        <label>Day/Date: <input type="text" placeholder="Enter day/date..."></label><br>
        <label>Time: <input type="text" placeholder="Enter time..."></label><br>
        <button class="save-button">Save</button>
        <button class="edit-button" style="display: none;">Edit</button>
        <button class="delete-button">Delete</button>
    `;

    newAccordionItem.appendChild(newTitle);
    newAccordionItem.appendChild(newContent);
    accordionContainer.appendChild(newAccordionItem);

    const saveButton = newContent.querySelector('.save-button');
    const editButton = newContent.querySelector('.edit-button');
    const deleteButton = newContent.querySelector('.delete-button');

    newTitle.addEventListener('click', () => {
        const isOpen = newAccordionItem.classList.contains('open');
        newAccordionItem.classList.toggle('open');
        newContent.style.maxHeight = isOpen ? null : newContent.scrollHeight + "px";
    });

    saveButton.addEventListener('click', () => {
        const titleInput = newContent.querySelector('input[placeholder="Enter event title..."]').value.trim();
        const dateInput = newContent.querySelector('input[placeholder="Enter day/date..."]').value.trim();
        const timeInput = newContent.querySelector('input[placeholder="Enter time..."]').value.trim();

        if (!titleInput || !dateInput || !timeInput) {
            alert('Please fill in all the fields before saving.');
            return;
        }

        newTitle.innerText = `${titleInput} - ${dateInput} - ${timeInput}`;
        newTitle.appendChild(deleteIcon);
        newContent.querySelectorAll('input').forEach(input => input.disabled = true);
        saveButton.style.display = 'none';
        editButton.style.display = 'inline-block';
    });

    editButton.addEventListener('click', () => {
        newContent.querySelectorAll('input').forEach(input => input.disabled = false);
        saveButton.style.display = 'inline-block';
        editButton.style.display = 'none';
    });
});
