const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const fs = require('fs').promises;
const path = require('path');
const prdRoutes = require("./routes/prdRoutes");
const codeRoutes = require("./routes/codeRoutes");
const ideaRoutes = require("./routes/ideaRoutes");
const visualizationRoutes = require('./routes/dataRoutes');

dotenv.config();

const app = express();


// CORS 设置
app.use(cors({
  origin: 'http://127.0.0.1:8080', // 允许来自这个源的请求
  methods: ['GET', 'POST'], // 明确允许的方法
}));

app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));


// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Helper function to save webpage
async function saveWebpage(id, content, res) {
  const filePath = path.join(__dirname, 'generated', `${id}.html`);
  
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content);
    console.log(`Webpage saved successfully: ${id}`);
    res.status(200).json({ message: 'Webpage saved successfully' });
  } catch (error) {
    console.error('Error saving webpage:', error);
    res.status(500).json({ error: 'Failed to save webpage' });
  }
}

// GET route for saving webpage (for debugging)
app.get('/api/save-webpage', async (req, res) => {
  const { id, content } = req.query;
  if (!id || !content) {
    return res.status(400).json({ error: 'Missing id or content' });
  }
  console.log(`Attempting to save webpage with id: ${id}`);
  await saveWebpage(id, content, res);
});


// POST route for saving webpage
// POST route for saving webpage
app.post('/api/save-webpage', async (req, res) => {
  console.log("POST /api/save-webpage called");
  const { id, content } = req.body;
  if (!id || !content) {
    return res.status(400).json({ error: 'Missing id or content' });
  }
  
  const filePath = path.join(__dirname, 'generated', `${id}.html`);
  
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content);
    console.log(`Webpage saved successfully: ${id}`);
    res.status(200).json({ message: 'Webpage saved successfully' });
  } catch (error) {
    console.error('Error saving webpage:', error);
    res.status(500).json({ error: 'Failed to save webpage' });
  }
});


// Get generated webpage route
app.get('/generated/:id', async (req, res) => {
  const { id } = req.params;
  const filePath = path.join(__dirname, 'generated', `${id}.html`);
  console.log(`Attempting to read file: ${filePath}`);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    console.log(`File read successfully: ${id}`);
    res.send(content);
  } catch (error) {
    console.error(`Error reading webpage ${id}:`, error);
    res.status(404).send('Webpage not found');
  }
});

// 静态文件服务
app.use('/generated', express.static(path.join(__dirname, 'generated')));

// Routes
app.use("/api", prdRoutes);
app.use("/api", codeRoutes);
app.use("/api", ideaRoutes);
app.use('/api', visualizationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});