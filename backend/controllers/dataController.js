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
        Based on the user's abstract prompt, the provided data summary, and the CSV header, generate Python code for data analysis and preparation. Follow these guidelines:

        1. Analyze the data summary to determine relevant data fields.
        2. Use only columns that are present in the CSV Header.
        3. Analyze the data summary and the CSV header to understand the available data fields, but do not limit your analysis to just the high-level goals outlined in the summary.
        4. Use the grid layout from the user's sketch to help determine the number and type of data preparations needed. The number of grids or blocks in the sketch should guide how many data preparations are required.
        5. Additionally, brainstorm and identify interesting patterns, correlations, or potential insights from the data that could provide value beyond the user's stated goals.
        6. Generate Python code that extracts and processes the required data from the 'data' DataFrame.
        7. Ensure all output is JSON-serializable. The code should prepare data structures that can be easily converted to JSON, but should not perform the actual visualization.
        8. The code should not include any import statements or external dependencies, as those are already handled by the backend.
        9. Return a JSON object where each key is a descriptive name for the data preparation and the value is the corresponding Python code.

        Focus on creatively leveraging the available columns to provide insights that may not be immediately obvious or requested in the user's goals.

        Return the Python code in this format (no explanation needed, just code):

        {
          "age_distribution": "age_counts = data['age'].value_counts().to_dict()",
          "education_by_gender": "edu_gender = data.groupby(['gender', 'education'])['gender'].count().unstack().to_dict()",
          "income_distribution": "income_dist = data['income'].value_counts().to_dict()",
          "brainstormed_insight": "occupation_income = data.groupby('occupation')['income'].mean().to_dict()"
        }

        Please carefully analyze the CSV header, the user sketch, and brainstorm additional potential insights or analyses that could provide value. Ensure all code produces JSON-serializable output and uses only available columns. The code should focus on data preparation and aggregation, not on creating the actual visualizations.

        User Prompt: \${userPrompt}
        Data Summary: \${JSON.stringify(summary)}
        CSV Header: \${csvHeader.join(", ")}
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
