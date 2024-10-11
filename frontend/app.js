import * as api from "./api.js";
import * as middleApi from "./middleapi.js";
import { runPythonCode, readCSVHeader } from "./middleapi.js";
import { renderFileUpload } from "./FileUpload.js";
import {
  DataToWeb,
  callGenerateVisualizationCode,
  updateIterationLoading,
  showMultiplePanel,
  hideLoader,
  showLoader
} from "./api.js";
let  allResults = {};
import { callGeneratePRD } from './api.js';
let latestUploadedFilePath = "";
let customPrompt = null; // User custom prompt
const callApiButton = document.getElementById("call-api");
let summary;
document.addEventListener("DOMContentLoaded", () => {
  const fileUploadContainer = document.getElementById("file-upload-container");
  renderFileUpload(fileUploadContainer, handleFileUploaded);
});


function showSummaryAndCallApiButton(summary) {
  // 显示 summary
  const summaryContainer = document.createElement('div');
  summaryContainer.id = 'summary-container';
  summaryContainer.innerHTML = `
      <h4>Summary:</h4>
      <p>${summary.summary}</p>
      <h4>Goals:</h4>
      <ul>
          ${summary.goals.map(goal => `<li>${goal.question}</li>`).join('')}
      </ul>
  `;
  
  // 将 summary 插入到 prompt-area 中
  const promptArea = document.getElementById('prompt-area');
  promptArea.insertBefore(summaryContainer, promptArea.firstChild);

  // 显示 call api 按钮
  const callApiButton = document.getElementById('call-api');
  callApiButton.style.display = 'flex';
}


// Custom alert function for better formatting
function showFormattedAlert(title, content) {
  const modal = document.createElement("div");
  modal.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 20px;
    border-radius: 5px;
    box-shadow: 0 0 10px rgba(0,0,0,0.25);
    z-index: 1000;
    max-width: 80%;
    max-height: 80%;
    overflow-y: auto;
  `;

  const titleElement = document.createElement("h2");
  titleElement.textContent = title;
  modal.appendChild(titleElement);

  const contentElement = document.createElement("pre");
  contentElement.style.cssText = `
    white-space: pre-wrap;
    word-wrap: break-word;
    max-height: 60vh;
    overflow-y: auto;
  `;
  contentElement.textContent = content;
  modal.appendChild(contentElement);

  const closeButton = document.createElement("button");
  closeButton.textContent = "Close";
  closeButton.onclick = () => document.body.removeChild(modal);
  closeButton.style.cssText = `
    margin-top: 10px;
    padding: 5px 10px;
    background: #f0f0f0;
    border: none;
    border-radius: 3px;
    cursor: pointer;
  `;
  modal.appendChild(closeButton);

  document.body.appendChild(modal);
}

// 上传文件给后端的逻辑
document.addEventListener("DOMContentLoaded", () => {
  const fileUploadContainer = document.getElementById("file-upload-container");
  renderFileUpload(fileUploadContainer, handleFileUploaded);
});

async function handleFileUploaded(file) {
  try {
    latestUploadedFilePath = `uploads/${file.name}`;
    const result = await middleApi.generateSummary(file);
    console.log("Summary:", result.summary);
    console.log("Goals:", result.goals);
    console.log("filePath", latestUploadedFilePath);

    if (result.summary && result.goals) {
      summary = result;
      showSummaryAndCallApiButton(summary);
    }

    return result;
  } catch (error) {
    console.error("Error generating summary:", error);
    throw error;
  }
}

// 上传文件之后，用户需要点击 call API 按钮来调用后端的 API 生成 PRD
// 然后用户开始输入 prompt ，画sketch
document.getElementById("call-api").addEventListener("click", async () => {
  showProgressBar();

  const input = document.getElementById("custom-prompt-input").value;
  if (!input) {
    alert("Please enter a custom prompt.");
    return;
  }

  customPrompt = input;
  console.log("Custom Prompt Set:", customPrompt);
  rightTab.click();
  document.querySelector(".toggle-option.preview").click();

  console.log("Call API button clicked");

  // const svgContent = canvasToSvg();
  let prompt = customPrompt;

  // Use the latest uploaded file path or a default path
  const filePath = latestUploadedFilePath;
  //如果没有路径，就报错并且 return
  if (!filePath) {
    alert("Please upload a file first.");
    return;
  }


  try {
    console.log("Custom Prompt:", customPrompt);
    console.log("Summary:", summary);
    showLoader();

    initializeIterationLoading(1);
    updateIterationLoading(1, 10, false);

    // Read the first line of the CSV file
    const csvHeader = await readCSVHeader(filePath);
    // console.log("CSV Header:", csvHeader);

    // Include the CSV header in the API call
    const pythonCodeResult = await callGenerateVisualizationCode(
      summary,
      prompt,
      csvHeader
    );

    // Call the API to generate the PRD - 迭代
    for (const [category, pythonCode] of Object.entries(pythonCodeResult)) {
      try {
        console.log(`Executing Python code for category: ${category}`);
        console.log(`File path: ${filePath}`);
        console.log(`Python code each time: ${pythonCode}`);

        const result = await runPythonCode(filePath, pythonCode);
        if (result.error) {
          console.error(`Error in Python code execution: ${result.error}`);
          // Display error to user
          alert(`Error in data processing: ${result.error}`);
          return;
        } else {
          console.log(`Result for ${category}:`, result);
          allResults[category] = result;
        }
      } catch (error) {
        console.error(
          `Error executing Python code for category ${category}:`,
          error
        );
      }
    }

    console.log("All Results After Running PythonCode:", allResults);
    console.log(
      "All visualization results generated. Calling PRD generation API."
    );

    const prdResult = await api.callGeneratePRD(prompt, summary);
    console.log("PRD Result:", prdResult);

    if (prdResult.prd) {
      updateIterationLoading(1, 50, true);
      console.log("Calling DataToWeb function:");
      await DataToWeb(prdResult, prompt, allResults);
    } else {
      throw new Error("PRD generation failed");
    }
  } catch (error) {
    hideLoader();
    console.error("Error in process:", error);
    alert("An error occurred. Please try again.");
  }
});

//show progress bar when the API is called
function showProgressBar() {
  document.getElementById("progress-container").style.display = "block";
}

//hide progress bar
function hideProgressBar() {
  document.getElementById("progress-container").style.display = "none";
}

//initialize the progress bar for each panel and show the panel for the iteration
function initializeIterationLoading(index) {
  showMultiplePanel(index);
  const frame = document.getElementById(`iteration-${index}`);
  if (frame) {
    updateIterationLoading(index, 0, false);
  }
}

// Copy code to clipboard
const copyCodeButton = document.getElementById("copy-code");
const originalSvg = copyCodeButton.innerHTML;
const newSvg = `<?xml version="1.0" encoding="utf-8"?><!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools -->
<svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M18 20.75H6C5.27065 20.75 4.57118 20.4603 4.05546 19.9445C3.53973 19.4288 3.25 18.7293 3.25 18V6C3.25 5.27065 3.53973 4.57118 4.05546 4.05546C4.57118 3.53973 5.27065 3.25 6 3.25H14.86C15.0589 3.25 15.2497 3.32902 15.3903 3.46967C15.531 3.61032 15.61 3.80109 15.61 4C15.61 4.19891 15.531 4.38968 15.3903 4.53033C15.2497 4.67098 15.0589 4.75 14.86 4.75H6C5.66848 4.75 5.35054 4.8817 5.11612 5.11612C4.8817 5.35054 4.75 5.66848 4.75 6V18C4.75 18.3315 4.8817 18.6495 5.11612 18.8839C5.35054 19.1183 5.66848 19.25 6 19.25H18C18.3315 19.25 18.6495 19.1183 18.8839 18.8839C19.1183 18.6495 19.25 18.3315 19.25 18V10.29C19.25 10.0911 19.329 9.90032 19.4697 9.75967C19.6103 9.61902 19.8011 9.54 20 9.54C20.1989 9.54 20.3897 9.61902 20.5303 9.75967C20.671 9.90032 20.75 10.0911 20.75 10.29V18C20.75 18.7293 20.4603 19.4288 19.9445 19.9445C19.4288 20.4603 18.7293 20.75 18 20.75Z" fill="#000000"/>
<path d="M10.5 15.25C10.3071 15.2352 10.1276 15.1455 10 15L7.00001 12C6.93317 11.86 6.91136 11.7028 6.93759 11.5499C6.96382 11.3971 7.03679 11.2561 7.14646 11.1464C7.25613 11.0368 7.3971 10.9638 7.54996 10.9376C7.70282 10.9113 7.86006 10.9331 8.00001 11L10.47 13.47L19 4.99998C19.14 4.93314 19.2972 4.91133 19.4501 4.93756C19.6029 4.96379 19.7439 5.03676 19.8536 5.14643C19.9632 5.2561 20.0362 5.39707 20.0624 5.54993C20.0887 5.70279 20.0669 5.86003 20 5.99998L11 15C10.8724 15.1455 10.693 15.2352 10.5 15.25Z" fill="#000000"/>
</svg>
`;

copyCodeButton.addEventListener("click", () => {
  // Modify to copy code directly from the iframe's srcdoc
  const iframe = document.getElementById("output-iframe");
  const code = iframe.srcdoc;
  navigator.clipboard
    .writeText(code)
    .then(() => {
      copyCodeButton.innerHTML = newSvg;
      // after 2 seconds, revert back to the original SVG icon
      setTimeout(() => {
        copyCodeButton.innerHTML = originalSvg;
      }, 2000);
    })
    .catch((err) => {
      console.error("Failed to copy text: ", err);
    });
});

const leftTab = document.getElementById("left-tab");
const rightTab = document.getElementById("right-tab");
const promptArea = document.getElementById("prompt-area");
const codeArea = document.getElementById("code-area");
const previewToggle = document.querySelector(".toggle-option.preview");
const codeToggle = document.querySelector(".toggle-option.active");
const iframeContainer = document.getElementById("iframe-container");
const outputPre = document.getElementById("output");
const outputContainer = document.getElementById("output-container");
const outputArea = document.querySelector(".output-area");

// toggle the tab content and toggle the narrow and wide width
document.addEventListener("DOMContentLoaded", function () {
  function setNarrowWidth() {
    outputContainer.classList.add("narrow");
    outputContainer.classList.remove("wide");
    outputArea.classList.add("narrow");
    outputArea.classList.remove("wide");
  }
  function setWideWidth() {
    outputContainer.classList.add("wide");
    outputContainer.classList.remove("narrow");
    outputArea.classList.add("wide");
    outputArea.classList.remove("narrow");
  }

  leftTab.addEventListener("click", function () {
    setNarrowWidth();
  });

  rightTab.addEventListener("click", function () {
    setWideWidth();
  });

  // set the initial width based on the active tab
  if (leftTab.classList.contains("active")) {
    setNarrowWidth();
  } else {
    setWideWidth();
  }

  function switchTab(activeTab, activeContent, inactiveTab, inactiveContent) {
    activeTab.classList.add("active");
    activeContent.classList.add("active");
    inactiveTab.classList.remove("active");
    inactiveContent.classList.remove("active");
  }

  function switchCodeView(activeView, inactiveView) {
    activeView.style.display = "block";
    inactiveView.style.display = "none";
  }

  leftTab.addEventListener("click", function () {
    switchTab(leftTab, promptArea, rightTab, codeArea);
  });

  rightTab.addEventListener("click", function () {
    switchTab(rightTab, codeArea, leftTab, promptArea);
  });

  previewToggle.addEventListener("click", function () {
    previewToggle.classList.add("active");
    codeToggle.classList.remove("active");
    switchCodeView(iframeContainer, outputPre);
  });

  codeToggle.addEventListener("click", function () {
    codeToggle.classList.add("active");
    previewToggle.classList.remove("active");
    switchCodeView(outputPre, iframeContainer);
  });
});
