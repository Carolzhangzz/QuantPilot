const Anthropic = require("@anthropic-ai/sdk");
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
const truncateSummary = (summary, maxLength = 5000) => {
  const stringified = JSON.stringify(summary);
  if (stringified.length > maxLength) {
    console.warn(`Summary exceeds ${maxLength} characters. Truncating...`);
    return stringified.slice(0, maxLength) + "...";
  }
  return stringified;
};

const generateVisualizationCode = async (req, res) => {
  console.log("Received request for visualization code generation");
  const { userPrompt, summary } = req.body;

  try {
    // Input validation
    if (!userPrompt || !summary) {
      console.error("Missing userPrompt or summary");
      return res.status(400).json({ error: "Missing userPrompt or summary" });
    }

    console.log("User Prompt:", userPrompt);
    console.log("Summary (truncated):", truncateSummary(summary));

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
    Based on the user's abstract prompt and the provided data summary, follow these steps:
    1. Analyze the data summary to determine which data fields are relevant to the user's high-level requirements.
    2. Identify which types of visualizations or analyses are needed based on the summary and the goals.
    3. For each identified visualization or analysis, determine which data fields are required.
    4. Generate Python code that extracts and processes the required data from the 'data' DataFrame (but does not generate the visualization itself).
    5. The code should not include any import statements or external dependencies, as those are already handled by the backend.
    6. Return a JSON object where each key is the name of the visualization or analysis (e.g., 'age_distribution', 'education_gender_comparison') and the value is the corresponding Python code that extracts the data.

    Here is the user's abstract prompt and the data summary:

    User Prompt: ${userPrompt}
    Data Summary: ${JSON.stringify(summary)}

    Return the Python code in this format （no Explanation needed, just code）:

    \`\`\`json
    {
    "visualization_1": "result = {'key': data['field'].operation().to_dict()}",
    "visualization_2": "result = {'key': data.groupby(['field1', 'field2']).operation().to_dict()}"
    }
    \`\`\`

    For example, if one of the goals is to visualize the age distribution, the Python code might look like this:

    \`\`\`json
    {
    "age_distribution": "result = {'age_data': data['age'].value_counts().to_dict()}",
    "education_gender_comparison": "result = {'education_by_gender': data.groupby(['education', 'gender']).size().unstack(fill_value=0).to_dict()}"
    }
    \`\`\`

    Please carefully analyze the data summary to ensure the correct data fields are selected for each visualization or analysis.
  `;

    console.log("Sending request to Anthropic API...");
    const messagePromise = anthropic.messages.create(
      {
        model: "claude-3-haiku-20240307",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      },
      { timeout: 60000 }
    );

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("API request timed out")), 65000)
    );

    const message = await Promise.race([messagePromise, timeoutPromise]);

    console.log("Received response from Anthropic API");
    const pythonCode = message.content[0].text;

    // Extract only the Python code from the response
    const codeMatch = pythonCode.match(/```python\n([\s\S]*?)```/);
    const extractedCode = codeMatch ? codeMatch[1] : pythonCode;

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
