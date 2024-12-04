const Anthropic = require("@anthropic-ai/sdk");
const { getStoredPRD } = require("../utils/state");

const generateCode = async (req, res) => {
  const { userPrompt, allResults } = req.body;
  
  const storedPRD = getStoredPRD();
  
  if (!storedPRD || !allResults) {
    return res.status(400).json({
      error: "PRD or allResults not found. Please start from iteration 0.",
    });
  }

  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Step 1: Data Analysis and Structure
    const dataAnalysisPrompt = `
    You are a data visualization expert. Analyze the provided dataset and create clean, minimal data structures that best represent the insights from this data:

    1. Instructions:
      - Extract meaningful patterns and relationships from the data
      - Create appropriate data structures for Plotly.js visualizations
      - Keep only relevant data points, removing any unnecessary information
      - Format numbers appropriately (e.g., rounding large numbers)
      - Ensure time series data is properly formatted

    2. Requirements:
      - Try different data structures to represent the data effectively 
      - Each data structure should be formatted as a valid JavaScript object
      - Data should be ready to use directly with Plotly.js
      - Focus on the most insightful aspects of the data
      - Remove any null or undefined values
      - Structure should support interactive visualization

    Dataset: ${JSON.stringify(allResults)}

    Format your response as a JavaScript object containing the processed data structures. 
    Include only the data - no explanations or comments. Each data structure should be named according to its content and purpose (e.g. emissionsByCountry, annualTrends, etc.).
    `;

    // Get cleaned data structures
    const dataStructuresResponse = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      messages: [{ role: "user", content: dataAnalysisPrompt }],
    });

    const cleanedDataStructures = dataStructuresResponse.content[0].text;

    // Step 2: Generate Website Code
    const websitePrompt = `
      You are a web development expert creating an interactive,fancy and cool website for data visualization.
      
      Use exactly these cleaned data structures for your Plotly.js charts:
      ${cleanedDataStructures}

      Requirements:
    1. Prioritize the user's considerations as design preferences while ensuring the design adheres to these principles:
    1. Apply shadows judiciously—enough to create depth but not overly done.
    2. Use the Gestalt principles (proximity, similarity, continuity, closure, and connectedness) to enhance visual perception and organization.
    3. Ensure accessibility, particularly in color choices; use contrasting colors for text, such as white text on suitable background colors, to ensure readability. Feel free to use gradients if they enhance the design's aesthetics and functionality.
    4. Maintain consistency across the design.
    5. Establish a clear hierarchy to guide the user's eye through the interface.

    Product Requirements Document (PRD): ${storedPRD}
    User's prompt: ${userPrompt}
  
    Additional considerations:
    1. Utilize a CSS icon library Font Awesome in your <head> tag to include vector glyph icons.
    2. Ensure all elements that can be rounded, such as buttons and containers, have consistent rounded corners to maintain a cohesive and modern visual style.
  
      2. Technical Requirements:
         - Complete HTML structure
         - All CSS styles including animations
         - Full JavaScript code with Plotly charts
         - Responsive design
         - Interactive features

      3. Required Components:
         - At least Three interactive Plotly.js charts using the provided data
         - Narrative data storytelling sections for each chart 
         - Interactive filters and tooltips
         - Animated transitions

      Provide only the complete, deployable HTML&CSS&JS code with no explanations or comments.
    `;

    // Generate website code
    const websiteResponse = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 4096,
      messages: [{ role: "user", content: websitePrompt }],
    });

    const generatedCode = websiteResponse.content[0].text;
    console.log("Generated Code:", generatedCode);

    res.json({ 
      generatedCode,
      cleanedDataStructures,
      originalPrompts: {
        dataAnalysis: dataAnalysisPrompt,
        website: websitePrompt
      }
    });

  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ 
      error: "Internal Server Error", 
      details: error.message 
    });
  }
};


module.exports = { generateCode };