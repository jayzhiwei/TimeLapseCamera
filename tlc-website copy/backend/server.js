require('dotenv').config();

const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
const app = express();
const PORT = 5000;
const { getStorage, ref, getDownloadURL } = require("firebase/storage");

// Route to serve files from Firebase Storage
app.get('/firebase-file/:path(*)', async (req, res) => {
  try {
    const storage = getStorage();
    const filePath = req.params.path; // e.g., "album/userID/piID/caseID/file.jpg"
    const fileRef = ref(storage, filePath);

    const fileURL = await getDownloadURL(fileRef);

    // Stream the file to the client
    const response = await fetch(fileURL);
    if (!response.ok) {
      throw new Error("Failed to fetch file from Firebase Storage.");
    }

    response.body.pipe(res);
  } catch (error) {
    console.error(`[${new Date().toLocaleString()}] Failed to retrieve file:`, error.message);
    res.status(500).json({ message: 'Failed to retrieve file.', error: error.message });
  }
});

// Enable CORS
app.use(cors({
  origin: '*',
  methods: 'GET, OPTIONS',
  allowedHeaders: 'Content-Type'
}));

// OAuth2 client setup
const oauth2Client = new google.auth.OAuth2(
  process.env.REACT_APP_GOOGLE_CLIENT_ID,
  process.env.REACT_APP_GOOGLE_CLIENT_SECRET,
  process.env.REACT_APP_GOOGLE_REDIRECT_URI || 'http://localhost:5000'
);

// Set credentials
oauth2Client.setCredentials({
  access_token: process.env.REACT_APP_GOOGLE_ACCESS_TOKEN,
  refresh_token: process.env.REACT_APP_GOOGLE_REFRESH_TOKEN,
});

// Google Drive API setup
const drive = google.drive({ version: 'v3', auth: oauth2Client });

// Route to get an image by ID
app.get('/image/:id', async (req, res) => {
  try {
    const fileId = req.params.id;
    const response = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    response.data
      .on('end', () => {
        console.log(`[${new Date().toLocaleString()}] Done downloading image ${fileId}.`);
      })
      .on('error', (err) => {
        console.error(`[${new Date().toLocaleString()}] Error downloading image.`, err);
        res.status(500).send('Error downloading image.');
      })
      .pipe(res);
  } catch (error) {
    console.error(`[${new Date().toLocaleString()}] Failed to retrieve image:`, error.message);
    res.status(500).json({ message: 'Failed to retrieve image.', error: error.message });
  }
});

// Route to get a video by ID
app.get('/video/:id.mp4', async (req, res) => {
  try {
    const fileId = req.params.id;
    
    // Retrieve file metadata first to determine MIME type and file name
    const fileMetadata = await drive.files.get({ fileId, fields: 'mimeType, name' });
    const mimeType = fileMetadata.data.mimeType || 'video/mp4';
    const fileName = fileMetadata.data.name;

    const response = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    // Set the appropriate Content-Type and Content-Disposition for video
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);

    response.data
      .on('end', () => {
        console.log(`[${new Date().toLocaleString()}] Done downloading video ${fileName}.`);
      })
      .on('error', (err) => {
        console.error(`[${new Date().toLocaleString()}] Error downloading video.`, err);
        res.status(500).send('Error downloading video.');
      })
      .pipe(res);
    
  } catch (error) {
    console.error(`[${new Date().toLocaleString()}] Failed to retrieve video:`, error.message);
    res.status(500).json({ message: 'Failed to retrieve video.', error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`[${new Date().toLocaleString()}] Server running on http://localhost:${PORT}`);
});