export let apiCallsEnabled = false;
export let iterationCounter = 0;
let storedGeneratedCode = "";
let iterationCodes = ["", "", "", ""]; // store the code for each iteration
let _storedPRD = null;
import { generateSummary, generateImage, runPythonCode } from "./middleapi.js";
import { canvasToSvg } from "./app.js";
// 在全局范围内声明一个变量来存储生成的代码
let generatedCode = "";
// 假设你有一个全局变量来存储生成的 Python 代码
let storedPythonCode = {};
import * as api from "./api.js";
// 存储生成的 Python 代码
function setStoredPythonCode(pythonCode) {
  storedPythonCode = pythonCode;
}

// 获取存储的 Python 代码
function getStoredPythonCode() {
  return storedPythonCode;
}

export function setStoredGeneratedCode(code) {
  storedGeneratedCode = code;
}

export function getStoredGeneratedCode() {
  return storedGeneratedCode;
}

export function getStoredPRD() {
  return _storedPRD;
}

export function setStoredPRD(prd) {
  _storedPRD = prd;
}

export const output = document.getElementById("output");

//hide progress bar
function hideProgressBar() {
  document.getElementById("progress-container").style.display = "none";
}

export function showMultiplePanel(index) {
  const panel = document.getElementById("multiple-panel");
  panel.style.display = "flex";
  for (let i = 1; i <= 4; i++) {
    const frame = document.getElementById(`iteration-${i}`);
    if (frame) {
      if (i <= index) {
        frame.style.display = "block"; // show the frame
      } else {
        frame.style.display = "none"; // hide the frame
      }
    }
  }
}

// function for the multiple panel progress bar
export function updateIterationLoading(index, progress, isComplete = false) {
  const frame = document.getElementById(`iteration-${index}`);
  if (frame) {
    const loadingOverlay = frame.querySelector(".loading-overlay");
    const loadingBar = frame.querySelector(".loading-bar");
    if (loadingBar) {
      loadingBar.style.width = `${progress}%`;
    }
    if (isComplete) {
      if (loadingOverlay) {
        loadingOverlay.classList.add("hidden");
      }
    }
  }
}

//CAll the API to Generate PRD from the SVG content
const callApiButton = document.getElementById("call-api");
const buttonText = callApiButton.querySelector("span");
const buttonIcon = callApiButton.querySelector("img");
const outputIframe = document.getElementById("output-iframe");

function parsePythonCode(pythonCodeString) {
  try {
    // 移除 Markdown 代码块标记
    let cleanedString = pythonCodeString.replace(/^```json\n|\n```$/g, "");

    // 解析 JSON
    const pythonCodeObject = JSON.parse(cleanedString);

    // 返回解析后的对象
    return pythonCodeObject;
  } catch (error) {
    console.error("Error parsing Python code:", error);
    console.error("Python code string:", pythonCodeString);
    return null;
  }
}

export async function callGenerateVisualizationCode(
  summary,
  prompt,
  csvHeader
) {
  try {
    console.log("Attempting to call generate-visualization-code API...");

    const response = await fetch(
      "http://localhost:3000/api/generate-visualization-code",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ summary, userPrompt: prompt, csvHeader }),
      }
    );

    console.log("Response received:", response);

    if (response.ok) {
      const result = await response.json();
      // 存储生成的 Python 代码
      setStoredPythonCode(result.pythonCode);

      // 获取存储的 Python 代码
      const storedPythonCodeString = storedPythonCode;
      console.log("Stored Python Code (raw):", storedPythonCodeString);

      // 解析并转换 Python 代码
      const parsedPythonCode = parsePythonCode(storedPythonCodeString);
      console.log("Parsed Python Code:", parsedPythonCode);

      if (parsedPythonCode) {
        return parsedPythonCode;
      } else {
        throw new Error("Failed to parse Python code");
      }
    } else {
      console.error("API call failed with status:", response.status);
      throw new Error(`API call failed with status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error in fetch operation:", error);
    console.error("Error stack:", error.stack);
    throw error; // 重新抛出错误，让调用者处理
  }
}


export async function callGeneratePRD(svgContent, userPrompt, summary) {
  // updateProgress("Loading...", 0);
  // callApiButton.style.width = "11rem";
  // callApiButton.style.backgroundColor = "white";
  // buttonIcon.src = "/ICONS/load.gif";
  // buttonText.textContent = "Generating Prd...";
  // buttonText.style.color = "black";
  try {
    console.log("Attempting to call generate-prd API...");
    const response = await fetch("http://localhost:3000/api/generate-prd", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        svg: svgContent,
        userPrompt: userPrompt,
        summary: summary, // 添加 summary 到请求体
      }),
    });
    // console.log("Response received:", response);
    if (response.ok) {
      // animateProgress(0, 12.5, 2000, "Loading..."); // 2 seconds animation
      const result = await response.json();
      setStoredPRD(result.prd);
      output.textContent = result.prd;
      return result; // 返回解析后的结果
    } else {
      console.error("API call failed, status:", response.status);
      const errorText = await response.text();
      console.error("Error details:", errorText);
      throw new Error(`API call failed: ${response.status} ${errorText}`);
    }
  } catch (error) {
    console.error("Error in fetch operation:", error);
    console.error("Error stack:", error.stack);
    throw error; // 重新抛出错误，让调用者处理
  }
  //finally {
  //   callApiButton.style.width = "8rem";
  //   callApiButton.style.backgroundColor = "#3c6ce4";
  //   buttonIcon.src = "/ICONS/call-api.svg";
  //   buttonText.textContent = "Generate";
  //   buttonText.style.color = "white";
  // }
}

export async function generateIdeas(previousCode) {
  //after the first code generated
  if (iterationCounter == 1) {
    animateProgress(12.5, 25, 2000, "Loading..."); // 2 seconds animation
  }

  if (iterationCounter == 2) {
    animateProgress(50, 65, 2000, "Loading..."); // 2 seconds animation
  }

  if (iterationCounter == 3) {
    animateProgress(75, 85, 2000, "Loading..."); // 2 seconds animation
  }

  callApiButton.style.width = "11rem";
  callApiButton.style.backgroundColor = "white";
  buttonIcon.src = "/ICONS/load.gif";
  buttonText.textContent = "Generating Ideas...";
  buttonText.style.color = "black";
  if (!previousCode) {
    console.error("Missing required parameters for generating ideas");
    return "";
  }
  try {
    const requestBody = {
      previousCode: previousCode,
    };

    console.log(
      "Request Body for generate-ideas:",
      JSON.stringify(requestBody, null, 2)
    );

    const response = await fetch("http://localhost:3000/api/generate-ideas", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (response.ok) {
      const result = await response.json();
      console.log("Received ideas from server:", result.ideas);
      return result.ideas;
    } else {
      console.error(
        "Failed to generate ideas:",
        response.status,
        response.statusText
      );
      return "";
    }
  } catch (error) {
    console.error("Error in generating ideas:", error);
    throw error;
  }
}

export async function DataToWeb(
  _storedPRD,
  userPrompt = null,
  allResults = null
) {
  console.log("calldataToWeb called with storedPRD, userPrompt, and allResults:");
  console.log("storedPRD:", _storedPRD);
  console.log("userPrompt:", userPrompt);
  console.log("allResults:", allResults); // 打印 allResults

  // 禁用按钮，防止多次点击
  callApiButton.disabled = true;

  // Show the lazy load overlay
  const lazyLoadOverlay = document.querySelector(".lazy-load-overlay");
  if (lazyLoadOverlay) {
    lazyLoadOverlay.style.display = "flex";
  }

  try {
    const requestBody = {
      iteration: iterationCounter,
      userPrompt: userPrompt,
      storedPRD: _storedPRD,
      allResults: allResults, // 确保 allResults 被正确传递
    };

    console.log("Request Body:", JSON.stringify(requestBody, null, 2));

    const response = await fetch("http://localhost:3000/api/generate-code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log("Response Status:", response.status);
    const responseText = await response.text();
    console.log("Response Body:", responseText);

    if (!response.ok) {
      throw new Error(
        `API call failed: ${response.status} ${response.statusText}\n${responseText}`
      );
    }

    const result = JSON.parse(responseText);
    let cleanCode = result.generatedCode;

    // Remove any non-HTML content before the <!DOCTYPE html>
    cleanCode = cleanCode.replace(/^[\s\S]*?(<!DOCTYPE html>)/, "$1");

    // Remove any non-HTML content after </html>
    cleanCode = cleanCode.replace(/(<\/html>)[\s\S]*$/, "$1");

    // Replace all local development server references with relative paths
    cleanCode = cleanCode.replace(/http:\/\/127\.0\.0\.1:8080\//g, "./");
    cleanCode = cleanCode.replace(/http:\/\/localhost:8080\//g, "./");

    // Check if the code is generated successfully
    if (cleanCode.trim()) {
      updateIterationLoading(1, 100, true);
      setStoredGeneratedCode(cleanCode);

      // Hide the lazy load overlay
      if (lazyLoadOverlay) {
        lazyLoadOverlay.style.display = "none";
      }

      // Prevent the default behavior of the iframe
      preventIframeDefaultBehavior(outputIframe);

      // 保存生成的代码
      generatedCode = cleanCode;

      // Update the output section
      output.textContent = cleanCode;

      // Update the iframe to show the generated code
      outputIframe.srcdoc = cleanCode;

      // Update stored codes
      iterationCodes[iterationCounter % 4] = cleanCode;

      // Update iteration frame
      const iterationFrameIndex = (iterationCounter % 4) + 1;
      const iterationFrame = document.getElementById(
        `output-iframe-${iterationFrameIndex}`
      );

      if (iterationFrame) {
        iterationFrame.srcdoc = cleanCode;
      }

      console.log(`This is the ${iterationCounter} time to call the API`);
      // Update the Counter
      iterationCounter++;
      console.log("Iteration Counter:", iterationCounter);

      // Switch to the specific panel
      simulateClickOnPanel(iterationCounter);
    } else {
      throw new Error("Generated code is empty");
    }
  } catch (error) {
    console.error("Error in callAPIOnce:", error);
    // Hide the lazy load overlay
    if (lazyLoadOverlay) {
      lazyLoadOverlay.style.display = "none";
    }
    // Show error message to user
    alert(`Failed to generate code: ${error.message}`);
  } finally {
    // 启用按钮，防止长时间禁用
    setTimeout(() => {
      callApiButton.disabled = false;
      callApiButton.style.width = "8rem";
      callApiButton.style.backgroundColor = "#3c6ce4";
      buttonIcon.src = "/ICONS/call-api.svg";
      buttonText.textContent = "Generate";
      buttonText.style.color = "white";
    }, 3000);
  }
}


// 添加新的事件监听器来处理新窗口打开
//添加了 <base> 标签，确保所有相对路径都基于原始网页的位置。
// 使用 sandbox 属性来增加安全性，同时允许脚本执行和同源资源访问。
// 添加新的事件监听器来处理新窗口打开
document.getElementById("open-new-window").addEventListener("click", () => {
  if (generatedCode) {
    // 创建一个新的 HTML 结构，保留原有的 DOCTYPE 和 html 标签
    const htmlContent = generatedCode.replace(/<head>[\s\S]*?<\/head>/, (match) => {
      return match + `
        <base href="${window.location.origin}/">
        <style>
          /* 添加任何额外的样式 */
        </style>
        <script>
          // 只处理外部链接
          document.addEventListener('click', function(e) {
            var target = e.target.closest('a');
            if (target && target.hostname !== window.location.hostname) {
              e.preventDefault();
              if (confirm('You are about to leave this page. Are you sure?')) {
                window.open(target.href, '_blank');
              }
            }
          });

          // 错误处理
          window.onerror = function(message, source, lineno, colno, error) {
            console.error('Error:', message, 'at', source, lineno, colno);
            return true;
          };
        </script>
      `;
    });

    // 使用 Blob 和 createObjectURL 来创建一个新的 URL
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    // 打开新窗口
    const newWindow = window.open(url, '_blank', 'width=1024,height=768');

    // 如果弹出窗口被阻止，提醒用户
    if (!newWindow) {
      alert("Pop-up blocked. Please allow pop-ups for this site to view the generated website.");
    } else {
      // 清理 Blob URL
      newWindow.onload = function() {
        URL.revokeObjectURL(url);
      };
    }
  } else {
    alert("No generated code available. Please generate the code first.");
  }
});

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// Call the Anthropic API once to generate code
export async function callAPIOnce(_storedPRD, userPrompt = null) {
  console.log("callAPIOnce called with storedPRD:", _storedPRD);

  // Update button appearance
  callApiButton.style.width = "11rem";
  callApiButton.style.backgroundColor = "white";
  buttonIcon.src = "/ICONS/load.gif";
  buttonText.textContent = "Generating Code...";
  buttonText.style.color = "black";

  // Show the lazy load overlay
  const lazyLoadOverlay = document.querySelector(".lazy-load-overlay");
  if (lazyLoadOverlay) {
    lazyLoadOverlay.style.display = "flex";
  }

  try {
    const requestBody = {
      iteration: iterationCounter,
      userPrompt: userPrompt,
      storedPRD: _storedPRD,
    };

    console.log("Request Body:", JSON.stringify(requestBody, null, 2));

    const response = await fetch("http://localhost:3000/api/generate-code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log("Response Status:", response.status);
    const responseText = await response.text();
    console.log("Response Body:", responseText);

    if (!response.ok) {
      throw new Error(
        `API call failed: ${response.status} ${response.statusText}\n${responseText}`
      );
    }

    const result = JSON.parse(responseText);
    let cleanCode = result.generatedCode;

    // 解析生成的代码，提取图表数据
    const chartData = extractChartData(cleanCode);

    // 更新 iframe
    updateIframe(`output-iframe-${(iterationCounter % 4) + 1}`, chartData);

    // Remove any non-HTML content before the <!DOCTYPE html>
    cleanCode = cleanCode.replace(/^[\s\S]*?(<!DOCTYPE html>)/, "$1");

    // Remove any non-HTML content after </html>
    cleanCode = cleanCode.replace(/(<\/html>)[\s\S]*$/, "$1");

    // Check if the code is generated successfully
    if (cleanCode.trim()) {
      // Update iteration loading and progress
      // updateIterationLoading(iterationCounter + 1, 100, true);
      // const progressStart = [12.5, 25, 65, 85][iterationCounter % 4];
      // const progressEnd = [25, 50, 75, 100][iterationCounter % 4];
      // animateProgress(
      //   progressStart,
      //   progressEnd,
      //   2000,
      //   `Iteration No.${iterationCounter + 1}`
      // );
      updateIterationLoading(1, 100, true);
      setStoredGeneratedCode(cleanCode);

      // Change the button style
      callApiButton.style.width = "11rem";
      buttonIcon.src = "/ICONS/code-done.svg";
      callApiButton.style.backgroundColor = "rgb(242, 255, 218)";
      buttonText.textContent = "Code generated";
      buttonText.style.color = "rgb(138, 192, 58)";

      // Hide the lazy load overlay
      if (lazyLoadOverlay) {
        lazyLoadOverlay.style.display = "none";
      }

      // Create the celebration effect
      createCelebrationEffect();

      // Prevent the default behavior of the iframe
      preventIframeDefaultBehavior(outputIframe);

      // Update the output section
      output.textContent = cleanCode;

      // 更新 iframe
      outputIframe.srcdoc = cleanCode;

      // // 应用缩放
      // outputIframe.style.transform = "scale(0.5)";
      // outputIframe.style.transformOrigin = "top left";

      // Update stored codes
      iterationCodes[iterationCounter % 4] = cleanCode;

      // Update iteration frame
      const iterationFrameIndex = (iterationCounter % 4) + 1;
      const iterationFrame = document.getElementById(
        `output-iframe-${iterationFrameIndex}`
      );

      if (iterationFrame) {
        iterationFrame.srcdoc = cleanCode;
      }

      // Update the Counter
      iterationCounter++;
      console.log("Iteration Counter:", iterationCounter);

      // Switch to the specific panel
      simulateClickOnPanel(iterationCounter);

      console.log(`This is the ${iterationCounter} time to call the API`);
      console.log("The content of the prompt:", result.prompt);

      // Check if the user wants to generate another iteration
      if (iterationCounter < 4) {
        if (confirm("Do you want to generate another iteration?")) {
          callApiButton.click();
        }
      }
    } else {
      throw new Error("Generated code is empty");
    }
  } catch (error) {
    console.error("Error in callAPIOnce:", error);

    // Update UI to show error
    buttonText.textContent = "Generation failed";
    callApiButton.style.backgroundColor = "rgb(255, 200, 200)";
    buttonText.style.color = "red";

    // Hide the lazy load overlay
    if (lazyLoadOverlay) {
      lazyLoadOverlay.style.display = "none";
    }

    // Show error message to user
    alert(`Failed to generate code: ${error.message}`);
  } finally {
    // Reset button state after a delay
    setTimeout(() => {
      callApiButton.style.width = "8rem";
      callApiButton.style.backgroundColor = "#3c6ce4";
      buttonIcon.src = "/ICONS/call-api.svg";
      buttonText.textContent = "Generate";
      buttonText.style.color = "white";
    }, 3000);
  }
}

// // Call the Anthropic API once to generate code
// export async function callAPIOnce(_storedPRD, userPrompt = null) {
//   // if (!apiCallsEnabled) {
//   //   console.log("API calls are disabled due to previous errors.");
//   //   return;
//   // }
//   console.log("callAPIOnce called with storedPRD:", _storedPRD);

//   // show the lazy load overlay
//   // const lazyLoadOverlay = document.querySelector(".lazy-load-overlay");
//   // if (lazyLoadOverlay) {
//   //   lazyLoadOverlay.style.display = "flex";
//   // }

//   callApiButton.style.width = "11rem";
//   callApiButton.style.backgroundColor = "white";
//   buttonIcon.src = "/ICONS/load.gif";
//   buttonText.textContent = "Generating Code...";
//   buttonText.style.color = "black";

//   try {
//     const requestBody = {
//       iteration: iterationCounter,
//       userPrompt: userPrompt, // use the user prompt
//     };

//     console.log("Request Body:", JSON.stringify(requestBody, null, 2)); // Log the request body

//     const response = await fetch("http://localhost:3000/api/generate-code", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(requestBody),
//     });

//     if (response.ok) {
//       const result = await response.json();
//       let cleanCode = result.generatedCode;

//       // Remove any non-HTML content before the <!DOCTYPE html>
//       cleanCode = cleanCode.replace(/^[\s\S]*?(<!DOCTYPE html>)/, "$1");

//       // Remove any non-HTML content after </html>
//       cleanCode = cleanCode.replace(/(<\/html>)[\s\S]*$/, "$1");

//       // check if the code is generated successfully
//       if (cleanCode.trim()) {
//         if (iterationCounter === 0) {
//           updateIterationLoading(iterationCounter + 1, 100, true);
//           animateProgress(
//             12.5,
//             25,
//             2000,
//             `Iteration No.${iterationCounter + 1}`
//           );
//         }
//         if (iterationCounter === 1) {
//           updateIterationLoading(iterationCounter + 1, 100, true);
//           animateProgress(25, 50, 2000, `Iteration No.${iterationCounter + 1}`);
//         }
//         if (iterationCounter === 2) {
//           updateIterationLoading(iterationCounter + 1, 100, true);
//           animateProgress(65, 75, 2000, `Iteration No.${iterationCounter + 1}`);
//         }
//         if (iterationCounter === 3) {
//           updateIterationLoading(iterationCounter + 1, 100, true);
//           animateProgress(
//             85,
//             100,
//             2000,
//             `Iteration No.${iterationCounter + 1}`
//           );
//         }
//         setStoredGeneratedCode(cleanCode); //  save the generated code

//         //change the button style
//         callApiButton.style.width = "11rem";
//         buttonIcon.src = "/ICONS/code-done.svg";
//         callApiButton.style.backgroundColor = "rgb(242, 255, 218)";
//         buttonText.textContent = "Code generated";
//         buttonText.style.color = "rgb(138, 192, 58)";

//         // auto switch to the preview view after the code is generated
//         // const previewView = document.querySelector('.preview-view');
//         // const toggleSizeButton = document.getElementById('toggle-size');
//         // if (!previewView.classList.contains('expanded')) {
//         //   previewView.classList.add('expanded');
//         //   toggleSizeButton.querySelector('img').src = './ICONS/shrink.svg';
//         // }

//         // make sure the lazy load overlay is hidden after the code is generated
//         const lazyLoadOverlay = document.querySelector(".lazy-load-overlay");
//         if (lazyLoadOverlay) {
//           lazyLoadOverlay.style.display = "none";
//         }

//         // create the celebration effect
//         createCelebrationEffect();

//         // prevent the default behavior of the iframe
//         preventIframeDefaultBehavior(outputIframe);
//       } else {
//         buttonText.textContent = "Generate failed";
//       }

//       // Update the output section
//       output.textContent = cleanCode;

//       // Update the iframe to show the generated code
//       const iframe = document.getElementById("output-iframe");
//       iframe.srcdoc = cleanCode;

//       // 更新存储的代码，0，1，2，3
//       iterationCodes[iterationCounter % 4] = cleanCode;

//       // Calculate the iteration frame index based on the iteration counter
//       const iterationFrameIndex = (iterationCounter % 4) + 1;
//       const iterationFrame = document.getElementById(
//         `output-iframe-${iterationFrameIndex}`
//       );

//       //Update the Counter
//       iterationCounter++;
//       console.log("Iteration Counter:", iterationCounter); // Print the iteration counter
//       //make the button click again to call the API
//       callApiButton.click();

//       // Switch to the specific panel
//       simulateClickOnPanel(iterationCounter);

//       if (iterationFrame) {
//         iterationFrame.srcdoc = cleanCode;
//       }
//       // Print the current API call count
//       console.log(`This is the ${iterationCounter} time to call the API`); // Print iteration count

//       // Print the content of the current used prompt in the console
//       console.log("The content of the prompt:", result.prompt);
//     } else {
//       console.log("Response Status:", response.status);
//       const errorBody = await response.text();
//       console.log("Response Body:", errorBody);
//       console.error("Failed to call Anthropic API:", response.statusText);
//     }
//   } catch (error) {
//     console.error("Error in fetch operation:", error);
//   }
// }

// auto switch to the panel that was clicked
function simulateClickOnPanel(index) {
  const panel = document.getElementById(`iteration-${index}`);
  if (panel) {
    panel.click();
  }
}

// Update the progress bar
function animateProgress(start, end, duration, stage) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const currentProgress = Math.floor(progress * (end - start) + start);
    updateProgress(stage, currentProgress);
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

// progress control functions
function updateProgress(stage, progress) {
  const fill = document.getElementById("fill");
  const progressLabel = document.getElementById("progress");

  fill.style.width = `${progress}%`;
  progressLabel.textContent = `${progress}%`;

  // update the stage label
  const stageLabel = document.getElementById("stage-label");
  stageLabel.textContent = stage;
}

// multiple panel toggle function
document.addEventListener("DOMContentLoaded", () => {
  const multiplePanel = document.getElementById("multiple-panel");
  let selectedFrame = null;

  multiplePanel.addEventListener("click", (event) => {
    const iterationFrame = event.target.closest(".iteration-frame");
    if (iterationFrame) {
      const index = iterationFrame.dataset.index;

      // remove the selected effect from the previous frame
      if (selectedFrame) {
        selectedFrame.classList.remove("selected");
      }

      // add new selected effect
      iterationFrame.classList.add("selected");
      selectedFrame = iterationFrame;

      updatePreviewView(index);
    }
  });
});

//lazy overlay functions
export function showLazyLoadOverlay() {
  const lazyLoadOverlay = document.querySelector(".lazy-load-overlay");
  if (lazyLoadOverlay) {
    lazyLoadOverlay.style.display = "flex";
  }
}

export function hideLazyLoadOverlay() {
  const lazyLoadOverlay = document.querySelector(".lazy-load-overlay");
  if (lazyLoadOverlay) {
    lazyLoadOverlay.style.display = "none";
  }
}

// update the preview view function
function updatePreviewView(index) {
  const outputIframe = document.getElementById("output-iframe");
  const output = document.getElementById("output");
  const code = iterationCodes[index - 1];

  // show the lazy load overlay
  showLazyLoadOverlay();
  //hide the lazy load overlay
  //if the iterationCounter is greater than or equal to the index of the panel that was clicked
  if (iterationCounter >= parseInt(index)) {
    hideLazyLoadOverlay();
  }

  // update the iframe to show the generated result
  outputIframe.srcdoc = code;

  // update the output section to show the generated Code
  output.textContent = code;

  // switch to the preview view
  document.querySelector(".toggle-option.preview").click();

  // add this to prevent the default behavior of the iframe
  outputIframe.onload = function () {
    outputIframe.contentDocument.body.addEventListener(
      "click",
      function (e) {
        e.preventDefault();
        e.stopPropagation();
      },
      true
    );
  };
}
// zoom in and out the iframe
document.addEventListener("DOMContentLoaded", function () {
  const toggleSizeButton = document.getElementById("toggle-size");
  const previewView = document.querySelector(".preview-view");
  const iframeContainer = document.getElementById("iframe-container");
  const output = document.getElementById("output");

  toggleSizeButton.addEventListener("click", function () {
    previewView.classList.toggle("expanded");
    if (previewView.classList.contains("expanded")) {
      toggleSizeButton.querySelector("img").src = "./ICONS/shrink.svg";
    } else {
      toggleSizeButton.querySelector("img").src = "./ICONS/expand.svg";
    }

    if (iframeContainer.classList.contains("active")) {
      const iframe = iframeContainer.querySelector("iframe");

      //save the current srcdoc content
      const currentContent = iframe.srcdoc;

      //clear the iframe content
      iframe.srcdoc = "";

      // use the setTimeout to ensure the content is reloaded in the next event loop
      setTimeout(() => {
        // set the content back to the iframe
        iframe.srcdoc = currentContent;

        iframe.onload = function () {
          iframe.contentDocument.body.addEventListener(
            "click",
            function (e) {
              e.preventDefault();
              e.stopPropagation();
              console.log("Clicked inside iframe");
            },
            true
          );

          //prevent the form submission in the iframe
          iframe.contentDocument.body.addEventListener(
            "submit",
            function (e) {
              e.preventDefault();
              console.log("Form submission prevented in iframe");
            },
            true
          );
        };
      }, 0);
    }
  });
});

// celebration-effect
function createCelebrationEffect() {
  const container = document.body;
  const particlesCount = 1000;

  for (let i = 0; i < particlesCount; i++) {
    const particle = document.createElement("div");
    particle.classList.add("celebration-particle");

    const size = Math.random() * 10 + 5;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.background = `hsl(${Math.random() * 360}, 100%, 50%)`;

    particle.style.left = `${Math.random() * 100}vw`;
    particle.style.top = `${Math.random() * 100}vh`;

    container.appendChild(particle);

    anime({
      targets: particle,
      top: `${Math.random() * 200 - 50}vh`,
      left: `${Math.random() * 200 - 50}vw`,
      rotate: Math.random() * 520,
      duration: Math.random() * 2000 + 3000,
      easing: "easeOutCirc",
      complete: () => {
        container.removeChild(particle);
      },
    });
  }
}

// prevent iframe default behavior
function preventIframeDefaultBehavior(iframe) {
  iframe.onload = function () {
    if (iframe.contentDocument) {
      iframe.contentDocument.body.addEventListener(
        "click",
        function (e) {
          e.preventDefault();
          e.stopPropagation();
          console.log("Clicked inside iframe (expanded view)");
        },
        true
      );

      iframe.contentDocument.body.addEventListener(
        "submit",
        function (e) {
          e.preventDefault();
          console.log("Form submission prevented in iframe (expanded view)");
        },
        true
      );

      // prevent the default behavior of the links in the iframe
      const links = iframe.contentDocument.getElementsByTagName("a");
      for (let link of links) {
        link.addEventListener(
          "click",
          function (e) {
            e.preventDefault();
            console.log("Link click prevented in iframe (expanded view)");
          },
          true
        );
      }
    }
  };
}
