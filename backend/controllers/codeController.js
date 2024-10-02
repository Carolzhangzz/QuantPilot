const Anthropic = require('@anthropic-ai/sdk');
const { getStoredPRD } = require("../utils/state");

const MAX_ITERATIONS = 10;

const generateCode = async (req, res) => {
  const { iteration, userPrompt } = req.body;

  // Retrieve the stored PRD
  const storedPRD = getStoredPRD();

  // Log the value of storedPRD to check if it is passed properly
  console.log("Stored PRD:", storedPRD);

  if (iteration >= MAX_ITERATIONS) {
    return res.status(400).json({ error: "Maximum iteration limit reached." });
  }

  if (!storedPRD) {
    return res.status(400).json({ error: "PRD not found. Please start from iteration 0." });
  }

  try {
    const prompt = `
    You are a data visualization expert tasked with creating an interactive data report website. Based on the provided Product Requirements Document (PRD) and User Prompt, design a website that effectively presents the data and insights. Follow these guidelines:

    1. Use appropriate chart types (e.g., bar charts, line charts, scatter plots, heatmaps) to best represent the data described in the PRD.
    2. Implement interactive features such as filters, tooltips, and drill-down capabilities to enhance data exploration.
    3. Ensure the design is clean, professional, and easy to navigate, with a clear hierarchy of information.
    4. Use a color scheme that is both visually appealing and accessible, ensuring sufficient contrast for readability.
    5. Incorporate responsive design principles to make the website usable on various devices and screen sizes.
    6. Use modern data visualization libraries (e.g., D3.js, Chart.js, or Plotly) to create dynamic and interactive charts.
    7. Implement data loading and processing functions to handle the dataset described in the PRD.
    8. Add summary statistics and key insights sections to highlight important findings from the data.
    9. Include a search or filter functionality to allow users to find specific data points or subsets.
    10. Ensure all visualizations have clear titles, labels, and legends where appropriate.

    Additional considerations:
    1. Use CSS Grid or Flexbox for layout to create a flexible and responsive design.
    2. Implement smooth transitions and animations for chart updates and interactions.
    3. Include a data source citation and any necessary disclaimers about the data.
    4. Optimize performance for handling large datasets, using techniques like data aggregation or lazy loading where appropriate.

    Product Requirements Document (PRD): ${storedPRD}
    User's prompt: ${userPrompt}

    Please provide your output in HTML, CSS, and JavaScript without any explanations or natural language comments. Focus on creating a functional, interactive data report website that effectively visualizes the data described in the PRD and meets the user's requirements as specified in the User Prompt.
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
          content: prompt
        }
      ],
    });

    const generatedCode = message.content[0].text;
    console.log("Generated Code:", generatedCode);

    res.json({ generatedCode, prompt });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

module.exports = { generateCode };

// const Anthropic = require('@anthropic-ai/sdk');
// const { getStoredPRD, getStoredImageUrl, getStoredImageUrls } = require("../utils/state");

// const MAX_ITERATIONS = 10;

// const generateCode = async (req, res) => {
//   const { iteration, userPrompt } = req.body;

//   // Retrieve the stored values
//   const storedPRD = getStoredPRD();
//   const storedImageUrl = getStoredImageUrl();
//   const storedImageUrls = getStoredImageUrls();

//   // Log the values of storedPRD and storedImageUrls to check if they are passed properly
//   console.log("Stored PRD:", storedPRD);
//   console.log("Stored Image URL:", storedImageUrl);
//   console.log("Stored Image URLs:", storedImageUrls);

//   if (iteration >= MAX_ITERATIONS) {
//     return res.status(400).json({ error: "Maximum iteration limit reached." });
//   }

//   if (!storedPRD || !storedImageUrls) {
//     return res.status(400).json({ error: "PRD or image URLs not found. Please start from iteration 0." });
//   }

//   try {
//     const imageInsertionInstructions = storedImageUrls.map(({ term, size, imageUrl }) => 
//       `Use the image for "${term}" at the following URL: ${imageUrl}. Size: ${size}.`).join('\n');

//     const prompt = `
//       You are a design engineer tasked with creating the user interface and user experience based on a user's wireframe sketch. Prioritize the user's considerations as design preferences while ensuring the design adheres to these principles:
//       1. Apply shadows judiciously—enough to create depth but not overly done.
//       2. Use the Gestalt principles (proximity, similarity, continuity, closure, and connectedness) to enhance visual perception and organization.
//       3. Ensure accessibility, particularly in color choices; use contrasting colors for text, such as white text on suitable background colors, to ensure readability. Feel free to use gradients if they enhance the design's aesthetics and functionality.
//       4. Maintain consistency across the design.
//       5. Establish a clear hierarchy to guide the user's eye through the interface.
//       Additional considerations:
//       2. Utilize a CSS icon library Font Awesome in your <head> tag to include vector glyph icons.
//       3. Ensure all elements that can be rounded, such as buttons and containers, have consistent rounded corners to maintain a cohesive and modern visual style.
//       Based on the following Product Requirements Document (PRD) and User Prompt.
//       Product Requirements Document (PRD): ${storedPRD}
//       User's prompt: ${userPrompt}
//       Please incorporate the following images as specified:
//       ${imageInsertionInstructions}
//       Please provide your output in HTML, CSS, and JavaScript without any explanations and natural languages(only code),with an emphasis on JavaScript for dynamic user interactions such as clicks and hovers.`;

//     const anthropic = new Anthropic({
//       apiKey: process.env.ANTHROPIC_API_KEY,
//     });

//     const message = await anthropic.messages.create({
//       model: "claude-3-5-sonnet-20240620",
//       max_tokens: 4096,
//       messages: [
//         {
//           role: "user",
//           content: [
//             {
//               type: "image",
//               source: {
//                 type: "base64",
//                 media_type: "image/jpeg",
//                 data: storedImageUrl.split(',')[1], 
//               },
//             },
//             {
//               type: "text",
//               text: prompt
//             }
//           ],
//         }
//       ],
//     });

//     const generatedCode = message.content[0].text;
//     console.log("Generated Code:", generatedCode); 
//     res.json({ generatedCode, prompt });
//   } catch (error) {
//     console.error("Error processing request:", error);
//     res.status(500).json({ error: "Internal Server Error", details: error.message });
//   }
// };

// module.exports = { generateCode };