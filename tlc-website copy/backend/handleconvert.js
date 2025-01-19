const express = require("express");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

app.use(
    cors({
      origin: 'http://localhost:3000', // Allow requests only from your frontend
      methods: ['GET', 'POST', 'OPTIONS'], // Specify allowed HTTP methods
    })
  );

// Create temp directory if it doesn't exist
const tempDir = path.join(__dirname, "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// Utility function for cleaning up files
const cleanupFiles = (files) => {
  files.forEach((file) => {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  });
};

const resolutionMap = {
    "Max_View": "4056x3040",
    "4K_UHD": "3840x2160",
    "2K_UHD": "2560x1440",
    "1080p": "1920x1080",
    "720p": "1280x720",
    "SD_480p": "640x480",
  };

// Route to convert images to video
app.post("/convert", async (req, res) => {
  const { imageUrls, fps, resolution } = req.body;

  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    return res.status(400).json({ error: "No image URLs provided." });
  }

  const resolutionValue = resolutionMap[resolution] || resolution;

  // Validate resolution
  if (!/^\d+x\d+$/.test(resolutionValue)) {
    return res.status(400).json({ error: "Invalid resolution format. Use 'WIDTHxHEIGHT' (e.g., '1920x1080')." });
  }

  try {
    const [width, height] = resolutionValue.split("x").map(Number);

    // Step 1: Download images
    const downloadedFiles = [];
    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i];
      const localFilePath = path.join(tempDir, `image_${i}.jpg`);

      const response = await axios({
        url: imageUrl,
        method: "GET",
        responseType: "stream",
      });

      const writer = fs.createWriteStream(localFilePath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      downloadedFiles.push(localFilePath);
    }

    // Step 2: Convert images to video with user-defined FPS and resolution
    const outputVideoPath = path.join(tempDir, `${uuidv4()}.mp4`);
    const ffmpegCommand = ffmpeg();

    downloadedFiles.forEach((file) => ffmpegCommand.addInput(file));

    ffmpegCommand
      .on("end", () => {
        res.download(outputVideoPath, "output.mp4", (err) => {
          cleanupFiles([...downloadedFiles, outputVideoPath]);
          if (err) console.error("Error sending file:", err);
        });
      })
      .on("error", (err) => {
        console.error("FFmpeg error:", err);
        cleanupFiles([...downloadedFiles, outputVideoPath]);
        res.status(500).json({ error: "Failed to generate video." });
      })
      .outputOptions([
        `-r ${fps}`, // Set frame rate
        `-vf scale=${width}:${height}`, // Set resolution
        "-pix_fmt yuv420p", // Pixel format for compatibility
      ])
      .save(outputVideoPath);
  } catch (error) {
    console.error("Error processing images:", error);
    res.status(500).json({ error: "An error occurred while processing the images." });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});