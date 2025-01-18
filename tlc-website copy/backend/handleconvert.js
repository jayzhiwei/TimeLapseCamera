const express = require("express");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());

// Temporary folder to store downloaded images
const tempFolder = path.join(__dirname, "temp");
if (!fs.existsSync(tempFolder)) {
  fs.mkdirSync(tempFolder);
}

// Route to handle image-to-video conversion
app.post("/convert", async (req, res) => {
  const { imageUrls } = req.body;

  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    return res.status(400).json({ error: "No image URLs provided." });
  }

  try {
    // Step 1: Download images to a temporary directory
    const downloadedImages = [];
    for (const [index, url] of imageUrls.entries()) {
      const imagePath = path.join(tempFolder, `image_${index}.jpg`);
      const response = await axios({
        url,
        method: "GET",
        responseType: "stream",
      });
      const writer = fs.createWriteStream(imagePath);
      response.data.pipe(writer);

      // Wait for the download to finish
      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      downloadedImages.push(imagePath);
    }

    // Step 2: Convert downloaded images to a video
    const outputVideoPath = path.join(tempFolder, `${uuidv4()}.mp4`);
    const ffmpegCommand = ffmpeg();

    downloadedImages.forEach((image) => {
      ffmpegCommand.addInput(image);
    });

    ffmpegCommand
      .on("end", () => {
        // Step 3: Send the generated video file to the client
        res.download(outputVideoPath, "output.mp4", (err) => {
          // Clean up temporary files
          downloadedImages.forEach((image) => fs.unlinkSync(image));
          fs.unlinkSync(outputVideoPath);
          if (err) {
            console.error("Error sending file:", err);
          }
        });
      })
      .on("error", (err) => {
        console.error("FFmpeg error:", err);
        res.status(500).json({ error: "Failed to generate video." });
        // Clean up on error
        downloadedImages.forEach((image) => fs.unlinkSync(image));
      })
      .outputOptions(["-r 30", "-pix_fmt yuv420p"]) // Set frame rate and pixel format
      .save(outputVideoPath);
  } catch (error) {
    console.error("Error during processing:", error);
    res.status(500).json({ error: "An error occurred while processing the images." });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
