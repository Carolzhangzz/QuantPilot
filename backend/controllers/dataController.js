const { Anthropic } = require("@anthropic-ai/sdk");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Debug mode flag
const DEBUG_MODE = process.env.DEBUG_MODE === "true";

// Utility function to truncate the summary if it's too long
const truncateSummary = (summary, maxLength = 30000) => {
  const stringified = JSON.stringify(summary);
  return stringified.length > maxLength
    ? `${stringified.slice(0, maxLength)}...`
    : stringified;
};

const generateVisualizationCode = async (req, res) => {
  console.log("Received request for visualization code generation");
  const { userPrompt, summary, csvHeader } = req.body;

  try {
    // Input validation
    if (!userPrompt || !summary || !csvHeader) {
      console.error("Missing userPrompt, summary, or csvHeader");
      return res.status(400).json({ error: "Missing required input" });
    }

    console.log("User Prompt:", userPrompt);
    console.log("Summary (truncated):", truncateSummary(summary));
    console.log("CSV Header:", csvHeader);

    // Check if API key is set
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("ANTHROPIC_API_KEY is not set");
      return res.status(500).json({ error: "API key is not configured" });
    }

    // Debug mode: return mock response
    if (DEBUG_MODE) {
      console.log("Debug mode: Returning mock response");
      return res.json({
        pythonCode: "print('Debug mode: This is a mock Python code response')",
      });
    }

    const prompt = `
  You are an expert in data visualization and data analysis, known for your ability to creatively extract insights from complex datasets. Your task is to generate **only Python code** for data analysis and preparation based on the following user prompt, data summary, and CSV header.

  **User's Prompt (Top Priority)**: "${userPrompt}"

  **Data Summary (Secondary Reference)**: ${JSON.stringify(summary)}

  **Available Columns**: ${csvHeader.join(", ")}

  **Guidelines**:

  1. **No explanations, comments, or extra text. Return only Python code.** Focus on fulfilling the user's request as the top priority, but also generate creative insights from the data based on the provided summary.

  2. Use **only the columns listed in the CSV Header**. Do not assume or use any other columns.

  3. The code must process data from the 'data' DataFrame, preparing the necessary data for analysis. The output must be JSON-serializable and **formatted as a single line of Python code**. Do not use triple quotes, multi-line strings, or any formatting that breaks JSON compatibility.

  4. While focusing on the user prompt, you are encouraged to **brainstorm and identify creative insights** or interesting patterns from the data summary. Use these insights to add further depth to the analysis beyond the user's request.

  5. Return a JSON object where each key describes the analysis and the value is the corresponding Python code, formatted as a single line of code. Ensure the code is **JSON-serializable** and does not use multi-line formatting, triple quotes, or special characters that would break JSON structure.

  6. **No explanations, comments, or import statements**. The focus is on preparing the data for analysis and ensuring JSON-serializable outputs.

  **Desired Format** (replace placeholders with actual CSV headers):
     - Keys should relate directly to the data or insight, such as using column names or analysis methods in their naming.
     - Prioritize the user's request first, then add creative insights based on the data summary.
    {
      "analysis_by_column1_value_counts": "result_1 = data['column1'].value_counts().to_dict()",
      "group_analysis_by_column2_and_column3": "result_2 = data.groupby(['column2', 'column3'])['column2'].count().unstack().to_dict()",
      "correlation_between_column4_and_column5": "result_3 = data['column4'].corr(data['column5']).to_dict()",
      "median_of_column7_grouped_by_column6": "result_4 = data.groupby('column6')['column7'].median().to_dict()"
    }

  **Important**: Return only Python code in the format above. Ensure all code is JSON-serializable, uses **single-line** Python statements, and avoids multi-line formatting.
`;

    console.log("Sending request to Anthropic API...");
    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    // console.log("Received response from Anthropic API");
    const pythonCode = message.content[0].text;

    // Extract only the JSON content from the response
    const jsonMatch = pythonCode.match(/```json\n([\s\S]*?)```/);
    const extractedCode = jsonMatch ? jsonMatch[1] : pythonCode;

    console.log(
      "Generated Python Code (snippet):",
      extractedCode.slice(0, 100) + "..."
    );

    res.json({ pythonCode: extractedCode });
  } catch (error) {
    console.error("Error in generateVisualizationCode:", error);
    if (error.response) {
      console.error("API response error:", error.response.data);
    }
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

module.exports = { generateVisualizationCode };
