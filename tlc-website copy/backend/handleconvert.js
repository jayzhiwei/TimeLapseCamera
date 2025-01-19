const express = require("express");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const cors = require('cors');
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath('C:\\ffmpeg\\bin\\ffmpeg.exe');

const app = express();
app.use(express.json());
app.use(cors());

app.use(
    cors({
      origin: (origin, callback) => {
        console.log('Requested Origin:', origin); // Log the origin of the request
        if ([
            'http://localhost:3000', 
            'https://www.timelapse2025.com',
            'http://www.timelapse2025.com',
        ].includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ['GET', 'POST', 'OPTIONS'],
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
  const { imageUrls, fps, resolution, fileName } = req.body;

  // Log the received data
  console.log(`Received ${imageUrls.length} image URLs`);
//   imageUrls.forEach((url, index) => console.log(`Image ${index + 1}: ${url}`));

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
      const localFilePath = path.join(tempDir, `image_${String(i).padStart(3, '0')}.jpg`);

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
    ffmpegCommand
    .input(path.join(tempDir, 'image_%03d.jpg')) // Use sequence pattern
    .inputOptions([
        `-framerate ${fps}`, // Set the input frame rate
      ])

    
    .on("end", () => {
        // Validate the generated video file
    if (!fs.existsSync(outputVideoPath) || fs.statSync(outputVideoPath).size === 0) {
        console.error("Generated video is empty or missing.");
        cleanupFiles([...downloadedFiles, outputVideoPath]);
        return res.status(500).json({ error: "Failed to generate a valid video file." });
    }
    
    const stream = fs.createReadStream(outputVideoPath);
    res.set({
        "Content-Type": "video/mp4", // Explicit MIME type for video files
        "Content-Disposition": `attachment; filename="${fileName}"`,
    });
    
    stream.pipe(res);
    
    stream.on("close", () => {
        cleanupFiles([...downloadedFiles, outputVideoPath]); // Clean up files after sending
    });
    
    stream.on("error", (err) => {
        console.error("Error streaming file:", err);
        cleanupFiles([...downloadedFiles, outputVideoPath]);
        res.status(500).json({ error: "Failed to stream video file." });
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