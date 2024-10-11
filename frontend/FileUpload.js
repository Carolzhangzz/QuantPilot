
export function renderFileUpload(container, onFileUploaded) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv,.xlsx,.xls,.txt';
    fileInput.style.display = 'none';

    const selectButton = document.createElement('button');
    selectButton.id = 'select-file';
    selectButton.innerHTML = '<span class="upload-icon">📁</span>Select File';
    
    const statusIcon = document.createElement('span');
    statusIcon.className = 'status-icon';
    
    selectButton.appendChild(statusIcon);
    
    selectButton.addEventListener('click', () => fileInput.click());

    const fileNameDisplay = document.createElement('div');
    fileNameDisplay.className = 'file-name';

    fileInput.onchange = async (event) => {
        const file = event.target.files[0];
        if (file) {
            fileNameDisplay.textContent = `Selected file: ${file.name}`;
            statusIcon.innerHTML = '<svg class="animate-spin" width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';
            try {
                const csvFile = await convertToCSV(file);
                await onFileUploaded(csvFile);
                statusIcon.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>';
            } catch (error) {
                statusIcon.innerHTML = ''; // Remove error icon
                console.error('Failed to process the file:', error);
            }
        }
    };

    container.appendChild(selectButton);
    container.appendChild(fileInput);
    container.appendChild(fileNameDisplay);
}


async function convertToCSV(file) {
    if (file.type === 'text/csv') {
        return file;
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            // Here you would implement the CSV conversion logic
            // For simplicity, we're just returning the original file
            // In a real implementation, you'd parse the content and convert it to CSV
            resolve(new File([content], `${file.name}.csv`, { type: 'text/csv' }));
        };
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    });
}