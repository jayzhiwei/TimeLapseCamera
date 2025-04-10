// handleconvert.js
const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const Queue = require("bull");
const axios = require("axios");

const app = express();
app.use(bodyParser.json({ limit: "500mb" }));
app.use(cors());

// Allow only specific origins.
app.use(
  cors({
    origin: (origin, callback) => {
      console.log("Requested Origin:", origin);
      if (
        [
          "http://localhost:3000",
          "https://www.timelapse2025.com",
          "http://www.timelapse2025.com",
          "http://192.168.10.147:3000",
        ].includes(origin)
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "OPTIONS"],
  })
);

// Create temporary directory if it doesn't exist.
const tempDir = path.join(__dirname, "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// Mapping resolution keys from the frontend to actual dimensions.
const resolutionMap = {
  "Max_View": "4056x3040",
  "4K_UHD": "3840x2160",
  "2K_UHD": "2560x1440",
  "1080p": "1920x1080",
  "720p": "1280x720",
  "SD_480p": "640x480",
};

// Create a Bull queue for image-to-video conversion.
const conversionQueue = new Queue("image-to-video", {
  redis: { host: "127.0.0.1", port: 6379 }
});

// POST /convert endpoint receives conversion requests from the frontend.
app.post("/convert", async (req, res) => {
  const { imageUrls, fps, resolution, fileName } = req.body;
  console.log(`Received ${imageUrls.length} image URLs`);
  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    return res.status(400).json({ error: "No image URLs provided." });
  }
  const resolutionValue = resolutionMap[resolution] || resolution;
  if (!/^\d+x\d+$/.test(resolutionValue)) {
    return res.status(400).json({
      error: "Invalid resolution format. Use 'WIDTHxHEIGHT' (e.g., '1920x1080')."
    });
  }
  try {
    const jobData = { imageUrls, fps, resolution: resolutionValue, fileName };
    const job = await conversionQueue.add(jobData);
    console.log(`Enqueued job ${job.id} with data:`, jobData);
    res.json({ message: "Job enqueued", jobId: job.id });
  } catch (error) {
    console.error("Error enqueuing job:", error);
    res.status(500).json({ error: "Failed to enqueue conversion job." });
  }
});

app.get("/job-status/:jobId", async (req, res) => {
  const jobId = req.params.jobId;
  try {
    const job = await conversionQueue.getJob(jobId);
    if (!job) return res.status(404).json({ error: "Job not found" });
    let state = await job.getState();
    const progress = job.progress();
    console.log(`Job ${jobId} progress:`, progress);
    // Override state based on progress.
    if (progress && progress.stage === "Completed") {
      state = "completed";
    }
    let result = null;
    if (state === "completed") {
      result = await job.finished();
    }
    res.json({ jobId, status: state, progress, result });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve job status." });
  }
});

// /download endpoint remains unchanged.
app.get("/download", async (req, res) => {
  const fileUrlEncoded = req.query.fileUrl;
  const fileUrl = decodeURIComponent(fileUrlEncoded);
  const { customName } = req.query;
  if (!fileUrl) return res.status(400).json({ error: "fileUrl is required" });
  try {
    if (fs.existsSync(fileUrl)) {
      const stream = fs.createReadStream(fileUrl);
      res.set({
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="${customName || "video.mp4"}"`
      });
      stream.pipe(res);
      stream.on("close", () => {
        fs.unlink(fileUrl, (err) => {
          if (err) console.error("Error cleaning up video file:", err);
          else console.log(`Cleaned up temporary video file: ${fileUrl}`);
        });
      });
    } else {
      const axiosResponse = await axios({
        url: fileUrl,
        method: "GET",
        responseType: "stream"
      });
      res.set({
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="${customName || "video.mp4"}"`
      });
      axiosResponse.data.pipe(res);
    }
  } catch (error) {
    console.error("Error fetching file:", error.message);
    res.status(500).json({ error: "Failed to download the file." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
