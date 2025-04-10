const Queue = require("bull");

const conversionQueue = new Queue("image-to-video", {
  redis: { host: "127.0.0.1", port: 6379 },
});

conversionQueue.add({
  imageUrls: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
  fps: 6,
  resolution: "1920x1080",
  fileName: "test_video.mp4"
}).then(job => {
  console.log("Test job enqueued with ID:", job.id);
  process.exit();
}).catch(err => {
  console.error("Error enqueuing test job:", err);
  process.exit(1);
});
