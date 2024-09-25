export function renderFileUpload(container, onFileUploaded) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv,.xlsx,.xls,.txt';
    fileInput.style.display = 'none';

    const selectButton = document.createElement('button');
    selectButton.innerHTML = '<span class="upload-icon">📁</span>Select File';
    selectButton.onclick = () => fileInput.click();

    const uploadButton = document.createElement('button');
    uploadButton.innerHTML = '<span class="upload-icon">⬆️</span>Upload and Process';
    uploadButton.style.display = 'none';

    const fileNameDisplay = document.createElement('div');
    fileNameDisplay.className = 'file-name';

    fileInput.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
            fileNameDisplay.textContent = `Selected file: ${file.name}`;
            uploadButton.style.display = 'block';
            uploadButton.classList.add('upload-ready');
        }
    };

    uploadButton.onclick = async () => {
        const file = fileInput.files[0];
        if (file) {
            try {
                const csvFile = await convertToCSV(file);
                onFileUploaded(csvFile);
                alert('File processed and ready to be sent to API.');
            } catch (error) {
                alert('Failed to process the file.');
                console.error(error);
            }
        }
    };

    container.appendChild(selectButton);
    container.appendChild(fileInput);
    container.appendChild(fileNameDisplay);
    container.appendChild(uploadButton);
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