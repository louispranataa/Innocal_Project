const hamburgerMenu = document.getElementById('hamburger-menu');
const navLinks = document.getElementById('nav-links');

// Navbar toggle
hamburgerMenu.addEventListener('click', () => {
    navLinks.classList.toggle('show');
    hamburgerMenu.classList.toggle('active');
});

// Add note functionality
document.getElementById('add-accordion-button').addEventListener('click', () => {
    const accordionContainer = document.getElementById('accordion-container');
    const emptyMessage = accordionContainer.querySelector('.empty-message');
    if (emptyMessage) emptyMessage.remove();

    const newAccordionItem = document.createElement('div');
    newAccordionItem.classList.add('accordion-item');

    const newTitle = document.createElement('button');
    newTitle.classList.add('accordion-title');
    newTitle.innerText = "New Note";

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
        <input type="text" placeholder="Enter note title..." class="note-title-input" style="width: 100%; margin-bottom: 10px;">
        <textarea placeholder="Enter note details..." class="note-details-input" style="width: 100%; height: 100px;"></textarea>
        <button class="save-button">Save</button>
        <button class="edit-button" style="display: none;">Edit</button>
    `;

    newAccordionItem.appendChild(newTitle);
    newAccordionItem.appendChild(newContent);
    accordionContainer.appendChild(newAccordionItem);

    const saveButton = newContent.querySelector('.save-button');
    const editButton = newContent.querySelector('.edit-button');
    const titleInput = newContent.querySelector('.note-title-input');
    const detailsInput = newContent.querySelector('.note-details-input');

    // Toggle content visibility
    newTitle.addEventListener('click', () => {
        newAccordionItem.classList.toggle('open');
    });

    // Save functionality
    saveButton.addEventListener('click', () => {
        const titleValue = titleInput.value.trim();
        const detailsValue = detailsInput.value.trim();

        if (!titleValue || !detailsValue) {
            alert('Please fill in both title and details before saving.');
            return;
        }

        // Update title
        newTitle.innerText = titleValue;
        newTitle.appendChild(deleteIcon);

        // Display saved note details
        newContent.innerHTML = `
            <p style="color: white; font-size: 16px; margin: 5px 0;"><strong>${titleValue}</strong></p>
            <p style="color: white; font-size: 14px; margin: 5px 0;">${detailsValue}</p>
            <button class="edit-button">Edit</button>
        `;

        const editButtonAfterSave = newContent.querySelector('.edit-button');
        // Edit functionality
        editButtonAfterSave.addEventListener('click', () => {
            newContent.innerHTML = `
                <input type="text" value="${titleValue}" class="note-title-input" style="width: 100%; margin-bottom: 10px;">
                <textarea class="note-details-input" style="width: 100%; height: 100px;">${detailsValue}</textarea>
                <button class="save-button">Save</button>
            `;
            const saveButtonAfterEdit = newContent.querySelector('.save-button');
            saveButtonAfterEdit.addEventListener('click', () => {
                const newTitleValue = newContent.querySelector('.note-title-input').value.trim();
                const newDetailsValue = newContent.querySelector('.note-details-input').value.trim();

                if (!newTitleValue || !newDetailsValue) {
                    alert('Please fill in both title and details before saving.');
                    return;
                }

                // Update title and details
                newTitle.innerText = newTitleValue;
                newTitle.appendChild(deleteIcon);
                newContent.innerHTML = `
                    <p style="color: white; font-size: 16px; margin: 5px 0;"><strong>${newTitleValue}</strong></p>
                    <p style="color: white; font-size: 14px; margin: 5px 0;">${newDetailsValue}</p>
                    <button class="edit-button">Edit</button>
                `;

                const editButtonAgain = newContent.querySelector('.edit-button');
                editButtonAgain.addEventListener('click', () => {
                    editButtonAfterSave.click();
                });
            });
        });
    });
});
