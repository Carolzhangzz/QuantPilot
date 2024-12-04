# Datavis Diffusion

A data visualization tool for junior researchers leveraging AI capabilities.

## Prerequisites

- Node.js (v18.0.0 or higher)
  - Install via [official website](http://nodejs.org/) or package managers:
    ```bash
    # macOS (Homebrew)
    brew install node

    # Windows (Chocolatey)
    choco install nodejs

    # Linux (apt)
    sudo apt install nodejs
    ```
- npm (normally bundled with Node.js)
- Python 3.8+ (for backend server)

## Project Setup

### Environment Configuration

1. Clone the repository:
```bash
git clone https://github.com/yourusername/datavis-diffusion.git
cd datavis-diffusion
```

2. Configure environment variables in the backend directory:
```bash
cd backend
cp .env.example .env
```

3. Add your API credentials to `backend/.env`:
```plaintext
# Get OpenAI API key from: https://platform.openai.com/api-keys
OPENAI_API_KEY=your_openai_api_key_here

# Get Anthropic API key from: https://console.anthropic.com/settings/keys
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

> **Security Note**: Never commit the `.env` file or expose API keys in public repositories.

### Dependencies Installation

#### Backend Dependencies

```bash
cd backend
npm install @anthropic-ai/sdk openai axios dotenv express cors
# or
npm install  # if package.json is present
```

#### Frontend Dependencies

```bash
cd frontend
npm install
```

## Running the Application

### Backend Services

Start the Express.js server:
```bash
cd backend
node server.js
```

Start the Python server (in a separate terminal):
```bash
cd backend
python server.py
```

### Frontend Development Server

```bash
cd frontend
npx live-server
```

The application will automatically open in your default browser at `http://localhost:8080`.

## Project Structure

```
datavis-diffusion/
├── backend/
│   ├── server.js
│   ├── server.py
│   ├── .env
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── index.html
│   ├── styles/
│   └── scripts/
├── .gitignore
└── README.md
```

## Development

### Customization

- Frontend modifications should be made in `frontend/index.html`
- Styling changes belong in `frontend/styles/`
- Backend API endpoints can be modified in `backend/server.js`

### Best Practices

1. Always create feature branches for new development
2. Follow the established code style guide
3. Write tests for new features
4. Update documentation as needed

## Troubleshooting

Common issues and solutions:

1. Module not found errors:
```bash
npm install [missing-module-name]
```

2. Port conflicts:
- Check if other services are using the required ports
- Modify port numbers in configuration files

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## API Documentation

For detailed API documentation, refer to:
- [OpenAI API](https://platform.openai.com/docs)
- [Pexels API](https://www.pexels.com/api/documentation/)
- [Anthropic Claude API](https://console.anthropic.com/docs)