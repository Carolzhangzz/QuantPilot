const Anthropic = require("@anthropic-ai/sdk");
const { getStoredPRD } = require("../utils/state");


// const generateCode = async (req, res) => {
//   const { iteration, userPrompt, allResults } = req.body; // 新增 allResults 参数

//   // Retrieve the stored PRD
//   const storedPRD = getStoredPRD();

//   // Log the values to check if they are passed properly
//   console.log("Stored PRD:", storedPRD);
//   console.log("All Results:", allResults); // Log allResults to check its value

//   if (iteration >= MAX_ITERATIONS) {
//     return res.status(400).json({ error: "Maximum iteration limit reached." });
//   }

//   if (!storedPRD || !allResults) {
//     return res.status(400).json({
//       error: "PRD or allResults not found. Please start from iteration 0.",
//     });
//   }

//   try {
        
//     const prompt = `
//       You are a **data visualization and storytelling expert** tasked with creating an **interactive, engaging, and playful data storytelling website** focused on climate change. 
//       Based on the provided Product Requirements Document (PRD), User Prompt, and the dataset results, generate a **visually complete and interactive website** using Plotly.js. The design must reflect an **environmental and cartoonish theme**, making the climate data both approachable and impactful. Follow these updated guidelines carefully:

//       ---
      
//       ### Key Guidelines:
      
//       1. **Interactive Data Storytelling**:
//         - Every data chart must be linked to a corresponding **narrative section** that dynamically updates based on the data shown.
//         - The storytelling should align with climate change insights, reflecting the user prompt and key data trends to deliver a cohesive message. 
//         - Example: A temperature trend graph could narrate how rising temperatures impact both **local ecosystems** and **human activities**.
      
//       2. **Use Plotly.js for All Visualizations**:
//         - Ensure all visualizations are **interactive**, including:
//           - Tooltips with detailed data points.
//           - **Filters, dropdowns, or buttons** to explore specific data subsets (e.g., regions, time periods).
//           - Drill-down interactions to uncover deeper insights from the dataset.
//         - Ensure **chart interactions reflect changes** in the corresponding narrative text dynamically.

//       3. **Environmental + Cartoonish Design**:
//         - Use a playful, **cartoon-inspired theme** combined with **sustainability-focused elements**. 
//           - Example: Use plant icons, animals, or trees as decorative design elements.
//           - Backgrounds can include soft gradients with nature motifs (e.g., leaves, clouds, or mountains).
//         - Select a **color palette** that combines **vibrant greens, blues, and earthy tones**, symbolizing sustainability.
//         - Ensure accessibility with **high-contrast text** and **color-blind-friendly palettes** to maximize inclusivity.
//         - Apply **smooth animations** to transitions, such as chart updates or page switches, enhancing the playful feel.

//       4. **Responsive and User-Friendly Interface**:
//         - The website must be fully **responsive**, optimized for desktops, tablets, and mobile devices.
//         - Use **intuitive navigation** (such as menu bars, buttons, or floating action icons) to allow smooth transitions between sections.
//         - Include clear section breaks for **data visualizations and narrative components**.

//       5. **Highlight Key Insights and Predictions**:
//         - Each chart must display **summary statistics** and highlight key patterns (e.g., rising CO₂ levels, decreasing biodiversity).
//         - Provide a dedicated section for **future predictions** and **recommended climate actions** based on the insights.
//         - Example: After showing emission trends, recommend sustainable actions (e.g., using bikes, reducing meat consumption).

//       6. **User Engagement and Interactivity**:
//         - Include **search and filter functionalities** to allow users to explore specific data points.
//         - Provide **downloadable reports or visualizations**, enabling users to share insights.
//         - Add action recommendations with links to **climate resources** or personalized suggestions for eco-friendly actions.
//         - Consider playful interactions, such as **hover effects**, animations of plants growing, or animals reacting to the data changes.

//       ---
      
//       ### Required Features:
//       - At least three **Plotly.js visualizations** based on the provided dataset.
//       - Each visualization must correspond with a specific narrative, forming part of the climate change story described in the PRD and user prompt.
//       - All charts and narratives must be **dynamically linked**, ensuring that interactions on the charts reflect changes in the storytelling.
//       - The **entire design theme** of the website must align with **sustainability and a cartoonish aesthetic** to make the topic approachable and engaging.
//       - **Animations and transitions** should be incorporated to create a playful, smooth user experience.
      
//       ---
      
//       ### Deliverables:
//       - Provide the complete(muse be complete) **HTML, CSS, and JavaScript code** necessary to create the website, ensuring it is ready to be deployed with no additional explanations or comments.

//       Product Requirements Document (PRD): ${storedPRD}
//       User's prompt: ${userPrompt}
//       Dataset results: ${JSON.stringify(allResults)}
//     `;

    
  
  
//     const anthropic = new Anthropic({
//       apiKey: process.env.ANTHROPIC_API_KEY,
//     });

//     const message = await anthropic.messages.create({
//       model: "claude-3-5-sonnet-20240620",
//       max_tokens: 4096,
//       messages: [
//         {
//           role: "user",
//           content: prompt,
//         },
//       ],
//     });

//     const generatedCode = message.content[0].text;
//     console.log("Generated Code:", generatedCode);

//     res.json({ generatedCode, prompt });
//   } catch (error) {
//     console.error("Error processing request:", error);
//     res
//       .status(500)
//       .json({ error: "Internal Server Error", details: error.message });
//   }
// };

// module.exports = { generateCode };
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
      - Each data structure should be formatted as a valid JavaScript object
      - Data should be ready to use directly with Plotly.js
      - Focus on the most insightful aspects of the data
      - Remove any null or undefined values
      - Structure should support interactive visualization

    Dataset: ${JSON.stringify(allResults)}

    Format your response as a JavaScript object containing the processed data structures. Include only the data - no explanations or comments. Each data structure should be named according to its content and purpose (e.g. emissionsByCountry, annualTrends, etc.).
    `;

    // Get cleaned data structures
    const dataStructuresResponse = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 4096,
      messages: [{ role: "user", content: dataAnalysisPrompt }],
    });

    const cleanedDataStructures = dataStructuresResponse.content[0].text;

    // Step 2: Generate Website Code
    const websitePrompt = `
      You are a web development expert creating an interactive, eco-friendly, and cartoonish website for climate change data visualization.
      
      Use exactly these cleaned data structures for your Plotly.js charts:
      ${cleanedDataStructures}

      Requirements:

      1. Visual Theme:
         - Eco-friendly, cartoonish design
         - Sustainability-focused color palette (greens, blues, earth tones)
         - Playful animations and transitions
         - Nature-inspired decorative elements

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

      4. Must Include:
         - Environmental theme
         - Cartoon-style elements
         - Accessibility features
         - Mobile responsiveness

      Product Requirements Document (PRD): ${storedPRD}
      User's prompt: ${userPrompt}

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