const API_BASE_URL = 'http://127.0.0.1:8000';

export async function generateSummary(file) {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${API_BASE_URL}/generate_summary`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in generateSummary:', error);
    throw error;
  }
}

export async function generateImage(file, instruction, userQuery) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('instruction', instruction);
  formData.append('user_query', userQuery);

  try {
    const response = await fetch(`${API_BASE_URL}/generate_image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.blob();
  } catch (error) {
    console.error('Error in generateImage:', error);
    throw error;
  }
}