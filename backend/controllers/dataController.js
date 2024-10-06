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
    You are an expert in data visualization and data analysis, known for your ability to creatively extract insights from complex datasets. Based on the user's abstract prompt, the provided data summary, and the CSV header, generate Python code for data analysis and preparation. Follow these guidelines:
    
    Use ONLY columns that are present in the CSV Header. Do not use any column names that are not explicitly listed in the CSV Header.
    Analyze the data summary and the CSV header to understand the available data fields.
    Generate Python code that extracts and processes the required data from the 'data' DataFrame.
    Ensure all output is JSON-serializable. The code should prepare data structures that can be easily converted to JSON, but should not perform the actual visualization.
    The code should not include any import statements or external dependencies, as those are already handled by the backend.
    Return a JSON object where each key is a descriptive name for the data preparation and the value is the corresponding Python code.
    
    Replace the placeholder column names in the example format with actual column names from the CSV header. Use creative data analysis techniques to brainstorm additional insights beyond the example code. The code should not be limited to just the examples provided, and should include original data analysis approaches based on the available columns.
    
    Return the Python code in this format (use the actual CSV header names instead of placeholders, but be creative and include your own ideas):
    (no explanation needed, just code):)
    
    {
      "analysis_1": "result_1 = data['column1'].value_counts().to_dict()",
      "analysis_2": "result_2 = data.groupby(['column2', 'column3'])['column2'].count().unstack().to_dict()",
      "analysis_3": "result_3 = data['column4'].value_counts().to_dict()",
      "analysis_4": "result_4 = data.groupby('column5')['column6'].mean().to_dict()"
    }
    
    Ensure all code produces JSON-serializable output and uses only available columns. The code should focus on data preparation and aggregation, not on creating actual visualizations. 
    Also, consider potential insightful patterns or relationships based on the available data.
    
    Available columns (use ONLY these): ${csvHeader.join(", ")}
    User Prompt: ${userPrompt}
    Data Summary: ${JSON.stringify(summary)}
    Remember: Only use column names that are explicitly listed in the CSV Header above. Do not assume the existence of any columns not listed.
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
