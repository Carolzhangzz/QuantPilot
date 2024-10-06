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
    
    1. Use Plotly.js for all chart visualizations.
    2. Ensure the design is clean, professional, and visually appealing.
    3. Implement interactive features such as filters, tooltips, and drill-down capabilities.
    4. Use an accessible color scheme with sufficient contrast for readability.
       Ensure a polished, modern, and user-friendly design using CSS Grid or Flexbox.
       Include responsive design principles, supporting both desktop and mobile views.
       Use a minimal and clean UI, with smooth transitions and animations.
    5. Incorporate responsive design principles for various devices and screen sizes.
    6. Implement smooth transitions and animations for chart updates.
    7. Add a summary statistics and key insights next to each chart.
    8. Include a search or filter functionality for specific data points or subsets.
    9. Ensure all visualizations have clear titles, labels, and legends where appropriate.
    
    Important:
    - All charts must use Plotly.js and must utilize the dataset provided in 'allResults'. Use the data from 'allResults' to create meaningful and interactive charts.
    - Ensure the charts are directly based on the data provided in 'allResults' without introducing new data.
    - Provide the HTML, CSS, and JavaScript needed to create the website without any additional explanations or comments.
    
    Product Requirements Document (PRD): ${storedPRD}
    User's prompt: ${userPrompt}
    Dataset results: ${JSON.stringify(allResults)}
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
