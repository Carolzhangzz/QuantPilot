# Datavis Diffusion: Exploring Intent-Based User Interfaces through Sketching to Coding Task Transition

# Requirements
* Install Node.js (through Homebrew or download from [http://nodejs.org/](http://nodejs.org/)). If you want to install through Homebrew, you need to download Homebrew first.
* Install npm (through [https://www.npmjs.com/get-npm](https://www.npmjs.com/get-npm)).

Open the terminal on your computer or use the terminal provided by your integrated development environment (e.g., Visual Studio Code). 
Ensure that the terminal is opened in the project folder directory.

## API Key Requirements

#### Local Deployment Instructions

1. Navigate to the `.env` file in your project directory. 
2. Insert your API key information using the following format (you could get ANTHROPIC API Key from : [anthropic.com](https://console.anthropic.com/settings/keys)):

ANTHROPIC_API_KEY=YOUR_ANTHROPIC_API_KEY

3. Save the `.env` file after adding your API keys.

**Note:** Keep your API keys confidential and never share them publicly.

<!-- Get OpenAI API from : [openai.com](https://platform.openai.com/api-keys) -->

<!--Get PEXELS API from : [pexels.com](https://help.pexels.com/hc/en-us/articles/900004904026-How-do-I-get-an-API-key)-->

## Module Requirements

## Installation

Before running the program, follow these steps: 

1. Install dependencies:

 `npm install`

2. If you encounter errors like "Cannot find module '@module_name'", install the specific module:

For example :  

```
npm install @anthropic-ai/sdk
npm install dotenv
```

(Add any other specific modules as needed)

## Running the Application

Navigate to the `/backend` directory (cd backend), then use the command: 

### `node server.js`

Navigate to the `/backend/server.py` directory (cd server.py), then use the command: 

### `python server.py`

Navigate to the `/frontend` directory (cd frontend), then use the command: 

### `npx live-server`


You should now see the application in your browser.

## Customization 

To edit the page, modify the `frontend/index.html` file.

