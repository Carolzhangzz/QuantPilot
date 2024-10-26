export let apiCallsEnabled = false;
export let iterationCounter = 0;
let storedGeneratedCode = "";
let iterationCodes = ["", "", "", ""]; // store the code for each iteration
let _storedPRD = null;

// 在全局范围内声明一个变量来存储生成的代码
let generatedCode = "";
// 假设你有一个全局变量来存储生成的 Python 代码
let storedPythonCode = {};

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

// export function showMultiplePanel(index) {
//   const panel = document.getElementById("multiple-panel");
//   panel.style.display = "flex";
//   for (let i = 1; i <= 4; i++) {
//     const frame = document.getElementById(`iteration-${i}`);
//     if (frame) {
//       if (i <= index) {
//         frame.style.display = "block"; // show the frame
//       } else {
//         frame.style.display = "none"; // hide the frame
//       }
//     }
//   }
// }

// function for the multiple panel progress bar
// export function updateIterationLoading(index, progress, isComplete = false) {
//   const frame = document.getElementById(`iteration-${index}`);
//   if (frame) {
//     const loadingOverlay = frame.querySelector(".loading-overlay");
//     const loadingBar = frame.querySelector(".loading-bar");
//     if (loadingBar) {
//       loadingBar.style.width = `${progress}%`;
//     }
//     if (isComplete) {
//       if (loadingOverlay) {
//         loadingOverlay.classList.add("hidden");
//       }
//     }
//   }
// }

//CAll the API to Generate PRD from the SVG content
const callApiButton = document.getElementById("call-api");
const buttonText = callApiButton.querySelector("span");
const buttonIcon = callApiButton.querySelector("img");
const outputIframe = document.getElementById("output-iframe");

function parsePythonCode(pythonCodeString) {
  try {
    // 如果输入已经是对象，直接返回
    if (typeof pythonCodeString === "object" && pythonCodeString !== null) {
      return pythonCodeString;
    }

    // 尝试解析 JSON 字符串
    const pythonCodeObject = JSON.parse(pythonCodeString);
    return pythonCodeObject;
  } catch (error) {
    console.error("Error parsing Python code:", error);
    console.error("Python code string:", pythonCodeString);
    // 如果解析失败，返回原始字符串
    return { rawCode: pythonCodeString };
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
      console.log("API Response:", result);

      // 存储生成的 Python 代码
      setStoredPythonCode(result.pythonCode);

      // 解析并转换 Python 代码
      const parsedPythonCode = parsePythonCode(result.pythonCode);
      console.log("Parsed Python Code:", parsedPythonCode);

      return parsedPythonCode;
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

export async function callGeneratePRD(prompt, summary, allResults) {
  try {
    console.log("Attempting to call generate-prd API...");
    const response = await fetch("http://localhost:3000/api/generate-prd", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userPrompt: prompt,
        summary: summary,
        allResults: allResults // 添加数据分析结果
      }),
    });

    if (response.ok) {
      const result = await response.json();
      setStoredPRD(result.prd);
      // 假设 output 是一个全局可访问的元素
      if (typeof output !== "undefined") {
        output.textContent = result.prd;
      }
      return result;
    } else {
      console.error("API call failed, status:", response.status);
      const errorText = await response.text();
      console.error("Error details:", errorText);
      throw new Error(`API call failed: ${response.status} ${errorText}`);
    }
  } catch (error) {
    console.error("Error in fetch operation:", error);
    console.error("Error stack:", error.stack);
    throw error;
  }
}

// export async function generateIdeas(previousCode) {
//   //after the first code generated
//   if (iterationCounter == 1) {
//     animateProgress(12.5, 25, 2000, "Loading..."); // 2 seconds animation
//   }

//   if (iterationCounter == 2) {
//     animateProgress(50, 65, 2000, "Loading..."); // 2 seconds animation
//   }

//   if (iterationCounter == 3) {
//     animateProgress(75, 85, 2000, "Loading..."); // 2 seconds animation
//   }

//   callApiButton.style.width = "11rem";
//   callApiButton.style.backgroundColor = "white";
//   buttonIcon.src = "/ICONS/load.gif";
//   buttonText.textContent = "Generating Ideas...";
//   buttonText.style.color = "black";
//   if (!previousCode) {
//     console.error("Missing required parameters for generating ideas");
//     return "";
//   }
//   try {
//     const requestBody = {
//       previousCode: previousCode,
//     };

//     console.log(
//       "Request Body for generate-ideas:",
//       JSON.stringify(requestBody, null, 2)
//     );

//     const response = await fetch("http://localhost:3000/api/generate-ideas", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(requestBody),
//     });

//     if (response.ok) {
//       const result = await response.json();
//       console.log("Received ideas from server:", result.ideas);
//       return result.ideas;
//     } else {
//       console.error(
//         "Failed to generate ideas:",
//         response.status,
//         response.statusText
//       );
//       return "";
//     }
//   } catch (error) {
//     console.error("Error in generating ideas:", error);
//     throw error;
//   }
// }

export async function DataToWeb(_storedPRD, userPrompt = null, allResults = null) {
  // 禁用按钮，防止多次点击
  const callApiButton = document.getElementById('call-api');
  const outputIframe = document.getElementById('output-iframe');
  const output = document.getElementById('output');
  
  callApiButton.disabled = true;
  
  // Show the lazy load overlay
  showLoader();
  
  try {
      const requestBody = {
          iteration: iterationCounter,
          userPrompt: userPrompt,
          storedPRD: _storedPRD,
          allResults: allResults,
      };
      
      const response = await fetch("http://localhost:3000/api/generate-code", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
          throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }
      
      const result = JSON.parse(await response.text());
      let cleanCode = result.generatedCode;
      
      // 清理代码
      cleanCode = cleanCode
          .replace(/^[\s\S]*?(<!DOCTYPE html>)/, "$1")
          .replace(/(<\/html>)[\s\S]*$/, "$1")
          .replace(/http:\/\/127\.0\.0\.1:8080\//g, "./")
          .replace(/http:\/\/localhost:8080\//g, "./");
          
      if (cleanCode.trim()) {
          // 更新代码显示
          output.textContent = cleanCode;
          
          // 创建一个新的 iframe 元素
          const tempIframe = document.createElement('iframe');
          tempIframe.id = 'output-iframe';
          tempIframe.classList.add('output-iframe');
          
          // 设置 iframe 加载完成的处理函数
          tempIframe.onload = () => {
              hideLoader();
              callApiButton.disabled = false;
          };
          
          // 使用 srcdoc 注入 HTML
          tempIframe.srcdoc = `
              ${cleanCode}
              <script>
                  // 防止默认行为
                  document.addEventListener('DOMContentLoaded', function() {
                      document.querySelectorAll('a').forEach(a => {
                          a.addEventListener('click', (e) => e.preventDefault());
                      });
                      document.querySelectorAll('form').forEach(form => {
                          form.addEventListener('submit', (e) => e.preventDefault());
                      });
                  });
              </script>
          `;
          
          // 替换旧的 iframe
          const oldIframe = document.getElementById('output-iframe');
          if (oldIframe && oldIframe.parentNode) {
              oldIframe.parentNode.replaceChild(tempIframe, oldIframe);
          }
          
          // 更新迭代相关的状态
          generatedCode = cleanCode;
          iterationCodes[iterationCounter % 4] = cleanCode;
          iterationCounter++;
          
      } else {
          throw new Error("Generated code is empty");
      }
  } catch (error) {
      console.error("Error in DataToWeb:", error);
      hideLoader();
      alert(`Failed to generate code: ${error.message}`);
  } finally {
      callApiButton.disabled = false;
  }
}
// export async function DataToWeb(
//   _storedPRD,
//   userPrompt = null,
//   allResults = null
// ) {
//   console.log(
//     "calldataToWeb called with storedPRD, userPrompt, and allResults:"
//   );
//   console.log("storedPRD:", _storedPRD);
//   console.log("userPrompt:", userPrompt);
//   console.log("allResults:", allResults); // 打印 allResults

//   // 禁用按钮，防止多次点击
//   callApiButton.disabled = true;

//   // Show the lazy load overlay
//   showLoader();

//   try {
//     const requestBody = {
//       iteration: iterationCounter,
//       userPrompt: userPrompt,
//       storedPRD: _storedPRD,
//       allResults: allResults, // 确保 allResults 被正确传递
//     };

//     console.log("Request Body:", JSON.stringify(requestBody, null, 2));
//     console.log("the Results:", allResults);
//     const response = await fetch("http://localhost:3000/api/generate-code", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(requestBody),
//     });

//     console.log("Response Status:", response.status);
//     const responseText = await response.text();
//     console.log("Response Body:", responseText);

//     if (!response.ok) {
//       throw new Error(
//         `API call failed: ${response.status} ${response.statusText}\n${responseText}`
//       );
//     }

//     const result = JSON.parse(responseText);
//     let cleanCode = result.generatedCode;

//     // Remove any non-HTML content before the <!DOCTYPE html>
//     cleanCode = cleanCode.replace(/^[\s\S]*?(<!DOCTYPE html>)/, "$1");

//     // Remove any non-HTML content after </html>
//     cleanCode = cleanCode.replace(/(<\/html>)[\s\S]*$/, "$1");

//     // Replace all local development server references with relative paths
//     cleanCode = cleanCode.replace(/http:\/\/127\.0\.0\.1:8080\//g, "./");
//     cleanCode = cleanCode.replace(/http:\/\/localhost:8080\//g, "./");

//     // Check if the code is generated successfully
//     if (cleanCode.trim()) {
//       // updateIterationLoading(1, 100, true);
//       setStoredGeneratedCode(cleanCode);

//       // Hide the lazy load overlay
//       hideLoader();

//       // Prevent the default behavior of the iframe
//       preventIframeDefaultBehavior(outputIframe);

//       // 保存生成的代码
//       generatedCode = cleanCode;

//       // Update the output section
//       output.textContent = cleanCode;

//       // Update the iframe to show the generated code
//       outputIframe.srcdoc = cleanCode;

//       // Update stored codes
//       iterationCodes[iterationCounter % 4] = cleanCode;

//       // Update iteration frame
//       // const iterationFrameIndex = (iterationCounter % 4) + 1;
//       // const iterationFrame = document.getElementById(
//       //   `output-iframe-${iterationFrameIndex}`
//       // );

//       // if (iterationFrame) {
//       //   iterationFrame.srcdoc = cleanCode;
//       // }

//       console.log(`This is the ${iterationCounter} time to call the API`);
//       // Update the Counter
//       iterationCounter++;
//       console.log("Iteration Counter:", iterationCounter);

//       // Switch to the specific panel
//       // simulateClickOnPanel(iterationCounter);
//     } else {
//       throw new Error("Generated code is empty");
//     }
//   } catch (error) {
//     console.error("Error in callAPIOnce:", error);
//     // Hide the lazy load overlay
//     hideLoader();
//     // Show error message to user
//     alert(`Failed to generate code: ${error.message}`);
//   }
// }

// 添加新的事件监听器来处理新窗口打开
// 添加了 <base> 标签，确保所有相对路径都基于原始网页的位置。
// 使用 sandbox 属性来增加安全性，同时允许脚本执行和同源资源访问。
// 添加新的事件监听器来处理新窗口打开
document.getElementById("open-new-window").addEventListener("click", () => {
  if (generatedCode) {
    // 创建一个新的 HTML 结构，保留原有的 DOCTYPE 和 html 标签
    const htmlContent = generatedCode.replace(
      /<head>[\s\S]*?<\/head>/,
      (match) => {
        return (
          match +
          `
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
      `
        );
      }
    );

    // 使用 Blob 和 createObjectURL 来创建一个新的 URL
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    // 打开新窗口
    const newWindow = window.open(url, "_blank", "width=1024,height=768");

    // 如果弹出窗口被阻止，提醒用户
    if (!newWindow) {
      alert(
        "Pop-up blocked. Please allow pop-ups for this site to view the generated website."
      );
    } else {
      // 清理 Blob URL
      newWindow.onload = function () {
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

export function showLoader() {
  document.querySelector(".data-viz-loader").style.display = "flex";
}

export function hideLoader() {
  document.querySelector(".data-viz-loader").style.display = "none";
}

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
// document.addEventListener("DOMContentLoaded", () => {
//   const multiplePanel = document.getElementById("multiple-panel");
//   let selectedFrame = null;

//   multiplePanel.addEventListener("click", (event) => {
//     const iterationFrame = event.target.closest(".iteration-frame");
//     if (iterationFrame) {
//       const index = iterationFrame.dataset.index;

//       // remove the selected effect from the previous frame
//       if (selectedFrame) {
//         selectedFrame.classList.remove("selected");
//       }

//       // add new selected effect
//       iterationFrame.classList.add("selected");
//       selectedFrame = iterationFrame;

//       updatePreviewView(index);
//     }
//   });
// });


// update the preview view function
function updatePreviewView(index) {
  const outputIframe = document.getElementById("output-iframe");
  const output = document.getElementById("output");
  const code = iterationCodes[index - 1];

  // show the lazy load overlay
  showLoader();
  //hide the lazy load overlay
  //if the iterationCounter is greater than or equal to the index of the panel that was clicked
  if (iterationCounter >= parseInt(index)) {
    hideLoader();
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
  // const toggleSizeButton = document.getElementById("toggle-size");
  const previewView = document.querySelector(".preview-view");
  const iframeContainer = document.getElementById("iframe-container");
  const output = document.getElementById("output");

  // toggleSizeButton.addEventListener("click", function () {
  //   previewView.classList.toggle("expanded");
  //   if (previewView.classList.contains("expanded")) {
  //     toggleSizeButton.querySelector("img").src = "./ICONS/shrink.svg";
  //   } else {
  //     toggleSizeButton.querySelector("img").src = "./ICONS/expand.svg";
  //   }

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
