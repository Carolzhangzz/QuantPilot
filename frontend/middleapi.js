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

// 调用后端的 /run_python_code 接口，用于执行 Claude 生成的 Python 代码
// Updated runPythonCode function
export async function runPythonCode(file, pythonCode) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('code', pythonCode);
  try {
    console.log(`Sending request to ${API_BASE_URL}/run_python_code`);
    // console.log(`Python Code: ${pythonCode}`);
    const response = await fetch(`${API_BASE_URL}/run_python_code`, {
      method: 'POST',
      body: formData,
    });
    const responseData = await response.json();
    if (!response.ok) {
      console.error(`Server responded with ${response.status}: ${JSON.stringify(responseData)}`);
      throw new Error(`HTTP error! status: ${response.status}, message: ${responseData.error}, details: ${responseData.traceback}`);
    }
    if (responseData.warnings && responseData.warnings.length > 0) {
      console.warn('Warnings from Python code execution:', responseData.warnings);
    }
    if (responseData.available_columns) {
      console.log('Available columns:', responseData.available_columns);
    }
    console.log('Python code execution result:', responseData.result);
    return responseData.result;
  } catch (error) {
    console.error('Error in runPythonCode:', error);
    throw error;
  }
}

// Function to read the first line of the CSV file
export async function readCSVHeader(filePath) {
  try {
    console.log(`Attempting to read CSV header for file: ${filePath}`);
    const response = await fetch(`${API_BASE_URL}/read_csv_header`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ file_path: filePath }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Server responded with ${response.status}: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    console.log('Successfully read CSV header:', data.header);
    return data.header;
  } catch (error) {
    console.error('Error reading CSV header:', error);
    throw error;
  }
}
