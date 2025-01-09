import React, { useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
import '../../App.css';
import './Film.css';

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
const SCOPES = 'https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/drive';

function Film() {
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initClient = () => {
      window.gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        scope: SCOPES,
      }).then(() => {
        fetchVideos();
      }).catch((error) => {
        console.error("Error initializing GAPI client:", error);
        setError("Error initializing GAPI client: " + error.message);
        setLoading(false);
      });
    };
    window.gapi.load('client:auth2', initClient);
  }, []);

  const fetchVideos = () => {
    window.gapi.client.drive.files.list({
      q: "mimeType contains 'video/'",
      fields: 'files(id, name, mimeType)',
    }).then(response => {
      const videoData = response.result.files.map(video => ({
        id: video.id,
        name: video.name,
        mimeType: video.mimeType,
        url: `${process.env.REACT_APP_GOOGLE_REDIRECT_URI}/video/${video.id}.mp4` // Ensure this points to your server URL
      }));
      setVideos(videoData);
      setLoading(false);
    }).catch((error) => {
      console.error('Error fetching videos:', error);
      setError('Error fetching videos. Please try again later.');
      setLoading(false);
    });
  };

  return (
    <div className="App-background">
      <h1>Films</h1>
      <div className="video-gallery">
        {loading && <div>Loading videos...</div>}
        {error && <div className="error-message">{error}</div>}
        {!loading && videos.length > 0 ? (
          videos.map(video => (
            <div key={video.id} className="video-item">
              <ReactPlayer
                url={video.url}
                controls
                width="100%"
                height="100%"
                onError={(e) => console.error('Error playing video', e)}
              />
              <p>{video.name}</p>
            </div>
          ))
        ) : (
          !loading && <div>No videos found.</div>
        )}
      </div>
    </div>
  );
}

export default Film;