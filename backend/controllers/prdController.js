const Anthropic = require("@anthropic-ai/sdk");
const { setStoredPRD, setStoredImageUrl } = require("../utils/state");
const puppeteer = require('puppeteer');  // 引入 Puppeteer

const generatePRD = async (req, res) => {
  const { svg, userPrompt, summary } = req.body;

  try {
    // 启动 Puppeteer 并生成页面
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // 设置页面内容为传入的 SVG
    await page.setContent(svg);

    // 截图并将其转换为 JPG 格式
    const jpgContent = await page.screenshot({ type: 'jpeg' });
    const base64Image = jpgContent.toString("base64");
    const imageUrl = `data:image/jpeg;base64,${base64Image}`;
    setStoredImageUrl(imageUrl);

    await browser.close(); // 关闭 Puppeteer 浏览器

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const prompt = `
      Please generate a comprehensive Product Requirements Document (PRD) for a data report website based on the following inputs:
      1. User's sketch (the image I sent you)
      2. User's prompt: ${userPrompt}
      3. Data summary: ${JSON.stringify(summary)}

      The PRD should include:
      1. **Overview**: The website's purpose, key objectives, and main features, focusing on both data visualizations and essential web elements (e.g., navigation, header, footer).
      2. **Data Visualization Components**: Detailed descriptions of the data visualizations needed, including chart types (e.g., bar charts, line graphs, tables), and how these visualizations should be integrated with user interactions such as filtering, sorting, and tooltips.
      3. **Basic Website Elements**: Ensure the website includes essential elements such as a navigation bar, header, footer, and a responsive layout. Detail how each of these elements should contribute to a cohesive user experience.
      4. **Layout and Design Recommendations**: Provide layout suggestions based on the user’s sketch, ensuring proper placement of data visualizations and basic elements like navigation, page structure, and calls to action.
      5. **Insights Presentation**: Propose clear ways to present the key insights from the data summary, ensuring that insights are easy to understand and align with the visualizations.
      6. **Additional Features and Interactivity**: Suggest any additional features that would enhance the user experience, such as search functionality, user preferences (e.g., dark mode), or downloadable reports.

      The document should be structured clearly, making it suitable for developers to implement a modern, user-friendly front-end interface for data reporting.
      `;

    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: base64Image,
              },
            },
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
    });

    const prd = message.content[0].text;
    setStoredPRD(prd);

    res.json({
      prd,
      storedImageUrl: imageUrl,
    });
  } catch (error) {
    console.error("Error in generatePRD:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
};

module.exports = { generatePRD };