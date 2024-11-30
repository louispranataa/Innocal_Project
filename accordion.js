const hamburgerMenu = document.getElementById('hamburger-menu');
const navLinks = document.getElementById('nav-links');

hamburgerMenu.addEventListener('click', () => {
    navLinks.classList.toggle('show');
});

document.getElementById('add-accordion-button').addEventListener('click', () => {
    const accordionContainer = document.getElementById('accordion-container');

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

        if (isOpen) {
            newAccordionItem.classList.remove('open');
            newContent.style.maxHeight = null;
        } else {
            newAccordionItem.classList.add('open');
            newContent.style.maxHeight = newContent.scrollHeight + "px";
        }
    });

    saveButton.addEventListener('click', () => {
        const titleInput = newContent.querySelector('input[placeholder="Masukkan judul acara..."]').value;
        const dateInput = newContent.querySelector('input[placeholder="Masukkan hari/tanggal..."]').value;
        const timeInput = newContent.querySelector('input[placeholder="Masukkan waktu..."]').value;

        if (titleInput && dateInput && timeInput) {
            newTitle.innerText = `${titleInput} - ${dateInput} - ${timeInput}`;
            newTitle.appendChild(deleteIcon);
            newContent.querySelectorAll('input').forEach(input => input.disabled = true);
            saveButton.style.display = 'none';
            editButton.style.display = 'inline-block';
        }
    });

    editButton.addEventListener('click', () => {
        newContent.querySelectorAll('input').forEach(input => input.disabled = false);
        saveButton.style.display = 'inline-block';
        editButton.style.display = 'none';
    });

    deleteButton.addEventListener('click', () => {
        accordionContainer.removeChild(newAccordionItem);
    });
});
