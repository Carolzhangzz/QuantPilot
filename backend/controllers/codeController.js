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
      Based on the provided Product Requirements Document (PRD), User Prompt, and the dataset results, design a **visually appealing** and **fully interactive** website that uses Plotly.js to present the data and insights. Follow these guidelines carefully:

      **Key Guidelines:**

      1. Use **Plotly.js** for all chart visualizations, ensuring that **every chart is directly based on the 'allResults' dataset**. The charts **must** use the data provided without introducing any new data. Ensure the dataset from 'allResults' is correctly integrated.
      
      2. **Ensure all visualizations are interactive**, including features like:
        - Tooltips with detailed information
        - Filters or dropdowns for adjusting the data displayed
        - Drill-down capabilities to explore subsets of the data
        
      3. The website should feature a **sleek color scheme** that adapts to the data insights, using **vibrant and cool tones** to highlight key trends.

      4. Use an **accessible color scheme** with sufficient contrast, and apply **vibrant and cool tones** to highlight trends in the data. Ensure a polished, modern look and feel.

      5. **Make the design responsive** to various screen sizes (desktop and mobile), ensuring smooth navigation and usability across devices.

      6. **Provide smooth animations** and transitions when updating the charts, making the experience feel dynamic.

      7. Display **summary statistics and key insights** next to each chart, summarizing important patterns directly from the dataset.

      8. **Include search or filter functionality** to allow users to quickly locate specific data points or subsets.

      9. Ensure all visualizations have clear **titles, labels, and legends**. Each chart must be easily understood by users.

      **Required Features:**
      - **At least three Plotly.js data charts** visualizing the data from 'allResults'.
      - The charts must dynamically reflect the data in the dataset without introducing any external data.
     
      **Deliverables**:
      - Provide the complete HTML, CSS, and JavaScript code needed to create the website with **no additional explanations or comments**.

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
