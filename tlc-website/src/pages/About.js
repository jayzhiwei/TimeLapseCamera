import React, { useState } from 'react';

function About() {
    const [error, setError] = useState(null);
    const firebaseVideoURL = "https://firebasestorage.googleapis.com/v0/b/timelapsefyp2024.appspot.com/o/testvideo%2F2024-01-26%2014-55-07.mp4?alt=media&token=11bbedc2-1f71-45a8-aa50-630e7d7e4104";
    const imageKitBaseURL = "https://ik.imagekit.io/i3q8onld6/"; // need to be hidden in the future
    const videoPath = firebaseVideoURL.split('/o/')[1]; // Extract the video path
    const imageKitVideoURL = `${imageKitBaseURL}${videoPath}`;

    const handleError = (e) => {
        console.error('Error playing video', e);
        const errorMessage = e?.target?.error?.message || 'An unknown error occurred while playing the video.';
        setError(`Error playing video: ${errorMessage}`);
    };

    return (
        <div className="App">
            <header className="App-background">
                <video
                    controls
                    width="50%"
                    height="auto"
                    onError={handleError}
                >
                    <source src={imageKitVideoURL} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
                {error && <div className="error-message">{error}</div>}
                
                <img 
                    src="https://firebasestorage.googleapis.com/v0/b/timelapsefyp2024.appspot.com/o/testIMG%2F3ndPhoto.jpg?alt=media&token=6aa1d756-79fe-4821-8b89-2bc787a6275a" 
                    alt=""
                    width="50%"
                    height="auto"
                />
                
                <p>About</p>
            </header>
        </div>
    );
}

export default About;
