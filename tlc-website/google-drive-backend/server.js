require('dotenv').config();

const express = require('express');
const { google } = require('googleapis');
const app = express();
const PORT = 5000;

const oauth2Client = new google.auth.OAuth2(
  process.env.REACT_APP_GOOGLE_CLIENT_ID,
  process.env.REACT_APP_GOOGLE_CLIENT_SECRET,
  process.env.REACT_APP_GOOGLE_REDIRECT_URI
);

oauth2Client.setCredentials({
  access_token: process.env.REACT_APP_GOOGLE_ACCESS_TOKEN,
  refresh_token: process.env.REACT_APP_GOOGLE_REFRESH_TOKEN,
});

const drive = google.drive({ version: 'v3', auth: oauth2Client });

app.get('/image/:id', async (req, res) => {
  try {
    const fileId = req.params.id;
    const response = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    response.data
      .on('end', () => {
        console.log('Done downloading file.');
      })
      .on('error', (err) => {
        console.error('Error downloading file.', err);
        res.status(500).send('Error downloading file.');
      })
      .pipe(res);
  } catch (error) {
    console.error('Failed to retrieve file:', error.message);
    res.status(500).json({ message: 'Failed to retrieve file.', error: error.message });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});