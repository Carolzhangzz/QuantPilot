const express = require("express");
const router = express.Router();
const visualizationController = require("../controllers/dataController");

// Route to generate visualization code
router.post("/generate-visualization-code", visualizationController.generateVisualizationCode);

module.exports = router;