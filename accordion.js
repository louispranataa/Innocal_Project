document.getElementById('add-accordion-button').addEventListener('click', () => {
    const accordionContainer = document.getElementById('accordion-container');

    const newAccordionItem = document.createElement('div');
    newAccordionItem.classList.add('accordion-item');

    const newTitle = document.createElement('button');
    newTitle.classList.add('accordion-title');
    newTitle.innerText = "Isi Acara Anda disini";
    newTitle.addEventListener('click', () => {
        newAccordionItem.classList.toggle('open');
    });

    const newContent = document.createElement('div');
    newContent.classList.add('accordion-content');
    newContent.innerHTML = `
        <label>Judul Acara: <input type="text" placeholder="Masukkan judul acara..."></label><br>
        <label>Hari/Tanggal: <input type="text" placeholder="Masukkan hari/tanggal..."></label><br>
        <label>Waktu: <input type="text" placeholder="Masukkan waktu..."></label><br>
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

    saveButton.addEventListener('click', () => {
        const titleInput = newContent.querySelector('input[placeholder="Masukkan judul acara..."]').value;
        const dateInput = newContent.querySelector('input[placeholder="Masukkan hari/tanggal..."]').value;
        const timeInput = newContent.querySelector('input[placeholder="Masukkan waktu..."]').value;

        if (titleInput && dateInput && timeInput) {
            newTitle.innerText = ` ${titleInput} - ${dateInput} - ${timeInput}`;
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
