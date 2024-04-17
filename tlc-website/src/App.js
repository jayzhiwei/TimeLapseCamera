import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';


function App() {
  const [temperature, setTemperature] = useState({ cpu: 0, room: 0 });
  const [isPiOnline, setIsPiOnline] = useState(false);  // State to track Raspberry Pi status

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get('http://192.168.1.118:3000/temperature');
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
    
    fetchData();
    const intervalId = setInterval(fetchData, 1000); // Fetch every 1s

    return () => clearInterval(intervalId);
  }, []);


  
  return (
    <div className="App">
      <header className="App-header">
        {/*
        import logo from './logo.svg'; 
          <img src={logo} className="App-logo" alt="logo"/> 
          */}
          
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

        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >

          {/*Learn React*/}
        </a>
      </header>
    </div>
  );
}

export default App;
