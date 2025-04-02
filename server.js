import express, { json } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { oneClickSearch } from "./oneClick.js";

dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.SERVER_PORT || 3000;

app.use(json());
app.use(
  cors({
    origin: process.env.CLIENT_ADDRESS,
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to the Patent Processing API",
    status: "Server is running",
  });
});

app.post("/oneclick", async (req, res) => {
  req.setTimeout(60000);
  try {
    const { patentText, date } = req.body;

    if (!patentText) {
      return res.status(400).json({ error: "patentText is required" });
    }

    const result = await oneClickSearch(patentText, date);
    res.json({
      status: "success",
      steps: Object.keys(result.responses).length,
      responses: result.responses,
      featureAnalysis: result.featureAnalysis,
    });
  } catch (error) {
    console.error("Processing error:", error);
    res.status(500).json({ error: "Patent processing failed" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the API at http://localhost:${PORT}`);
});

export default app; // For testing purposes
