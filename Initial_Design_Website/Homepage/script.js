var video = document.getElementById('myVideo');
var playPauseBtn = document.getElementById('playPauseBtn');

function togglePlayPause() {
    if (video.paused || video.ended) {
        video.play();
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    } else {
        video.pause();
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
}

// Add event listener to update play/pause button based on video state
video.addEventListener('play', function () {
    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
});

video.addEventListener('pause', function () {
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
});

video.addEventListener('ended', function () {
    // Replay the video when it ends
    video.currentTime = 0; // Set the current time to the beginning
    video.play();
    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
});