import React, { useState, useEffect } from 'react';
import axios from 'axios';
import logo from './logo.svg';
import './App.css';

function App() {
  const [temperature, setTemperature] = useState({ cpu: 0, room: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get('http://raspberrypi.local:5000/temperature');
        setTemperature({ cpu: data.cpu_temperature, room: data.room_temperature });
      } catch (error) {
        console.error('Error fetching data: ', error);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 5000); // Fetch every 5000 ms

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          CPU Temperature: {temperature.cpu} °C<br />
          Room Temperature: {temperature.room} °C
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
