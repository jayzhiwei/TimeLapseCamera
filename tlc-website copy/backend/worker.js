const fs = require("fs");
const path = require("path");
const axios = require("axios");
const ffmpeg = require("fluent-ffmpeg");
const { v4: uuidv4 } = require("uuid");
const Queue = require("bull");

ffmpeg.setFfmpegPath("C:\\ffmpeg\\bin\\ffmpeg.exe");

const tempDir = path.join(__dirname, "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// Utility function to clean up files.
const cleanupFiles = (files) => {
  files.forEach((file) => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`Cleaned up: ${file}`);
    }
  });
};

const conversionQueue = new Queue("image-to-video", {
  redis: { host: "127.0.0.1", port: 6379 }
});

conversionQueue.process(async (job, done) => {
  const { imageUrls, fps, resolution, fileName } = job.data;
  const totalImages = imageUrls.length;
  const downloadedFiles = [];

  try {
    // Step 1: Download images.
    for (let i = 0; i < totalImages; i++) {
      const imageUrl = imageUrls[i];
      const localFilePath = path.join(
        tempDir,
        `image_${String(i).padStart(3, "0")}.jpg`
      );
      const response = await axios({
        url: imageUrl,
        method: "GET",
        responseType: "stream",
        timeout: 10000
      });
      const writer = fs.createWriteStream(localFilePath);
      response.data.pipe(writer);
      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });
      downloadedFiles.push(localFilePath);
      // Update download progress.
      job.progress({
        stage: "Downloading and converting",
        download: { current: i + 1, total: totalImages },
        conversion: { current: 0, total: totalImages }
      });
      console.log(`Downloaded image ${i + 1}/${totalImages}`);
    }

    // Step 2: Video conversion.
    const [width, height] = resolution.split("x").map(Number);
    const outputVideoPath = path.join(tempDir, `${uuidv4()}.mp4`);

    ffmpeg()
      .input(path.join(tempDir, "image_%03d.jpg"))
      .inputOptions([`-framerate ${fps}`])
      .outputOptions([
        `-r ${fps}`,
        `-vf scale=${width}:${height}`,
        "-pix_fmt yuv420p"
      ])
      .on("progress", (progressData) => {
        job.progress({
          stage: "Downloading and converting",
          download: { current: totalImages, total: totalImages },
          conversion: { current: progressData.frames || 0, total: totalImages }
        });
        console.log(`Conversion progress: frames = ${progressData.frames}`);
      })
      .on("end", () => {
        job.progress({
          stage: "Completed",
          download: { current: totalImages, total: totalImages },
          conversion: { current: totalImages, total: totalImages }
        });
        cleanupFiles(downloadedFiles);
        done(null, { videoPath: outputVideoPath, fileName });
      })
      .on("error", (err) => {
        cleanupFiles(downloadedFiles);
        done(err);
      })
      .save(outputVideoPath);
  } catch (error) {
    cleanupFiles(downloadedFiles);
    done(error);
  }
});

console.log("Worker is running and waiting for conversion jobs...");
