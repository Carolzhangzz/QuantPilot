const Anthropic = require("@anthropic-ai/sdk");
const { setStoredPRD } = require("../utils/state");

const generatePRD = async (req, res) => {
  const { userPrompt, summary, allResults } = req.body; // 添加 allResults 参数

  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const prompt = `
    Please generate a comprehensive Product Requirements Document (PRD) with data story for a climate data storytelling website. Base your analysis on:
    
    1. User's Prompt: ${userPrompt}
    2. Data Summary: ${JSON.stringify(summary)}
    3. Data Analysis Results: ${JSON.stringify(allResults)}
    
    The PRD should include:

    ### 1. Data Story
    - Analyze the provided data results and create compelling narratives for each visualization
    - Highlight key trends, patterns, and insights found in the data
    - Connect these insights to real-world climate impacts and actions

    ### 2. Visualization Narratives
    For each data visualization, provide:
    - A clear explanation of what the data shows
    - Key insights and implications
    - Relevant context and background information
    - Actionable recommendations based on the data

    ### 3. Website Components & Layout
    - Specify how to present the data story alongside visualizations
    - Detail interactive features that enhance the storytelling
    - Describe transitions and animations that support the narrative

    ### 4. User Experience
    - How users should interact with the data
    - How the narrative unfolds as users explore the visualizations
    - What insights users should take away

    The PRD should integrate the data analysis with compelling storytelling, making climate data accessible and meaningful to users.
    `;

    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const prd = message.content[0].text;
    setStoredPRD(prd);

    res.json({
      prd,
    });
  } catch (error) {
    console.error("Error in generatePRD:", error);
    res.status(500).json({ 
      error: "Internal Server Error", 
      details: error.message 
    });
  }
};

module.exports = { generatePRD };