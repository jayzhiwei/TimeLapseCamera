import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import './RaspberryCam.css';

function RaspberryCam() {
  const [temperature, setTemperature] = useState({ cpu: 0, room: 0 });
  const [isPiOnline, setIsPiOnline] = useState(false);  // State to track Raspberry Pi status
  const [timestamp, setTimestamp] = useState(Date.now());
  const streamUrl = 'http://192.168.1.188:3000/video_feed';
  

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get('http://192.168.1.188:3000/temperature');
        
        console.log("Fetched data:", data);  // Check fetched data

        // Format temperatures to two decimal places
        const formattedCPUTemperature = parseFloat(data.cpu_temperature).toFixed(2);
        const formattedRoomTemperature = parseFloat(data.room_temperature).toFixed(2);

        setTemperature({ cpu: formattedCPUTemperature, room: formattedRoomTemperature });
        setIsPiOnline(true);  // Set Raspberry Pi status to online

        console.log("Updated state:", { cpu: data.cpu_temperature, room: data.room_temperature });  // Check actually setting
      } catch (error) {
        console.error('Error fetching data: ', error);
        setIsPiOnline(false);  // Set Raspberry Pi status to offline on error
      }
    };
    
    const intervalId = setInterval(() => {
      fetchData();
      setTimestamp(Date.now());  // Update timestamp to refresh video
    }, 1000); // Fetch every 2s

    return () => clearInterval(intervalId);
  }, []);
  
  return (
    <div className="RaspberryCam">
      <header className="App-background">

        <h1>Raspberry Pi Camera Stream</h1>
        
        <img className="video-stream"
          src={streamUrl} 
          alt="Camera Off"  />

        <div className={`status-row ${!isPiOnline ? 'offline-text' : ''}`}>
          <span className="bold-text">Room Temperature:</span>
          <span>{temperature.room} °C</span>
        </div>
        
        <div className={`status-row ${!isPiOnline ? 'offline-text' : ''}`}>
          <span className="bold-text">CPU Temperature:</span>
          <span>{temperature.cpu} °C</span>
        </div>

        <div className={`status-row ${!isPiOnline ? 'offline-text' : ''}`}>
          <span className="bold-text">Raspberry Pi Status:</span>
          <span className={`status-indicator ${isPiOnline ? 'online' : 'offline'}`}>
            {isPiOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        <div className={`status-row`}>
          <span className="bold-text">Last Refresh:</span>
          <span>{new Date(timestamp).toLocaleString()}</span>
        </div>

      </header>
    </div>
  );
}

export default RaspberryCam;