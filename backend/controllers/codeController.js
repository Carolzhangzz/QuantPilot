const Anthropic = require("@anthropic-ai/sdk");
const { getStoredPRD } = require("../utils/state");

const MAX_ITERATIONS = 10;

const generateCode = async (req, res) => {
  const { iteration, userPrompt, allResults } = req.body; // 新增 allResults 参数

  // Retrieve the stored PRD
  const storedPRD = getStoredPRD();

  // Log the values to check if they are passed properly
  console.log("Stored PRD:", storedPRD);
  console.log("All Results:", allResults); // Log allResults to check its value

  if (iteration >= MAX_ITERATIONS) {
    return res.status(400).json({ error: "Maximum iteration limit reached." });
  }

  if (!storedPRD || !allResults) {
    return res.status(400).json({
      error: "PRD or allResults not found. Please start from iteration 0.",
    });
  }

  try {
    
          const prompt = `
        You are a data visualization expert tasked with creating an interactive data report website. 
        Based on the provided Product Requirements Document (PRD), User Prompt, and the dataset results, design a website that effectively presents the data and insights. Follow these guidelines:
        
        1. Use appropriate chart types to best represent the data provided in the results.
        2. Implement interactive features such as filters, tooltips, and drill-down capabilities.
        3. Ensure the design is clean, professional, and easy to navigate.
        4. Use an accessible color scheme with sufficient contrast for readability.
        5. Incorporate responsive design principles for various devices and screen sizes.
        6. Important one: use a combination of modern data visualization libraries (e.g., D3.js, Chart.js, Plotly, ECharts, or Highcharts) to create dynamic and interactive charts.
        7. Implement efficient data loading and processing functions.
        8. Add concise summary statistics and key insights sections.
        9. Include a search or filter functionality for specific data points or subsets.
        10. Ensure all visualizations have clear titles, labels, and legends where appropriate.
        
        Additional considerations:
        1. Use CSS Grid or Flexbox for a flexible and responsive layout.
        2. Implement smooth transitions and animations for chart updates.
        3. Include a brief data source citation and any necessary disclaimers.
        4. Optimize performance for large datasets using appropriate techniques.
        
        Important:
        For each data visualization, include a brief, insightful analysis next to the chart. Focus on:
        - Key trends or patterns
        - Significant outliers or anomalies
        - Potential implications or actionable insights
        - Limit each description to 2-3 concise sentences
        
        Keep the language clear, direct, and free of unnecessary jargon. Place the text next to or below each chart for easy readability.
        
        Product Requirements Document (PRD): ${storedPRD}
        User's prompt: ${userPrompt}
        Dataset results: ${JSON.stringify(allResults)}
        
        Please provide your output in HTML, CSS, and JavaScript without any explanations or natural language comments. Ensure that each data visualization uses a different library to showcase a variety of tools and approaches for creating interactive and dynamic charts.
        `;

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const generatedCode = message.content[0].text;
    console.log("Generated Code:", generatedCode);

    res.json({ generatedCode, prompt });
  } catch (error) {
    console.error("Error processing request:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
};

module.exports = { generateCode };
