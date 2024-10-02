const Anthropic = require("@anthropic-ai/sdk");
const { convert } = require("convert-svg-to-jpeg");
const { setStoredPRD, setStoredImageUrl } = require("../utils/state");

const generatePRD = async (req, res) => {
  const { svg, userPrompt, summary } = req.body;

  try {
    const jpgContent = await convert(svg);
    const base64Image = jpgContent.toString("base64");
    const imageUrl = `data:image/jpeg;base64,${base64Image}`;
    setStoredImageUrl(imageUrl);

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const prompt = `
      Please generate a Product Requirements Document (PRD) for a data report website based on the following inputs:
      1. User's sketch (the image I sent you)
      2. User's prompt: ${userPrompt}
      3. Data summary: ${JSON.stringify(summary)}

      The PRD should include:
      1. An overview of the website's purpose and main features
      2. A detailed description of the data visualization components needed (e.g., charts, graphs, tables)
      3. Layout and design recommendations based on the user's sketch
      4. Suggestions for presenting the key insights from the data summary
      5. Any additional features or interactivity that would enhance the user experience

      Please structure your response in a clear, organized manner suitable for developers to implement a modern, user-friendly front-end interface for data reporting.
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

// const Anthropic = require("@anthropic-ai/sdk");
// const { convert } = require("convert-svg-to-jpeg");
// const { extractKeywords, fetchImageFromAPI } = require("../utils/utils");
// const {
//   setStoredPRD,
//   setStoredImageUrl,
//   setStoredImageUrls,
// } = require("../utils/state");

// const generatePRD = async (req, res) => {
//   const { svg, userPrompt } = req.body;

//   try {
//     const jpgContent = await convert(svg);
//     const base64Image = jpgContent.toString("base64");
//     const imageUrl = `data:image/jpeg;base64,${base64Image}`;
//     setStoredImageUrl(imageUrl);

//     const anthropic = new Anthropic({
//       apiKey: process.env.ANTHROPIC_API_KEY,
//     });

//     const prompt = `
//       Please generate a Product Requirements Document (PRD) which 
//       targets creating a modern and user-friendly front-end interface based on the following user's sketch (the picture I sent you) and prompt.
//       User's prompt: ${userPrompt}
//       In the PRD, specify what images are needed and where they should be placed (e.g., hero image, product image, etc.) using the format:
//       [term(size)], please concrete keywords like [(bread)medium] instead of something vague like [product1(small)].
//       There are 3 keywords for the size (small, medium, large, landscape, or portrait). Remember this only applies to images, if it's icons you can
//       just define it without the expected format.
//       Example: [school(large)]`;

//     const message = await anthropic.messages.create({
//       model: "claude-3-5-sonnet-20240620",
//       max_tokens: 1024,
//       messages: [
//         {
//           role: "user",
//           content: [
//             {
//               type: "image",
//               source: {
//                 type: "base64",
//                 media_type: "image/jpeg",
//                 data: base64Image,
//               },
//             },
//             {
//               type: "text",
//               text: prompt,
//             },
//           ],
//         },
//       ],
//     });

//     const prd = message.content[0].text;
//     setStoredPRD(prd);
//     const keywords = extractKeywords(prd);

//     const imageUrls = await Promise.all(
//       keywords.map(async (keyword) => {
//         try {
//           const imageUrl = await fetchImageFromAPI(keyword.term, keyword.size);
//           return { term: keyword.term, size: keyword.size, imageUrl, error: null };
//         } catch (error) {
//           console.error(`Error fetching image for ${keyword.term}:`, error);
//           return { term: keyword.term, size: keyword.size, imageUrl: null, error: error.message };
//         }
//       })
//     );

//     setStoredImageUrls(imageUrls);
    
//     const hasErrors = imageUrls.some(img => img.error !== null);

//     res.json({ 
//       prd, 
//       keywords, 
//       imageUrls, 
//       storedImageUrl: imageUrl,
//       hasErrors: hasErrors
//     });
//   } catch (error) {
//     console.error("Error in generatePRD:", error);
//     res
//       .status(500)
//       .json({ error: "Internal Server Error", details: error.message });
//   }
// };

// module.exports = { generatePRD };