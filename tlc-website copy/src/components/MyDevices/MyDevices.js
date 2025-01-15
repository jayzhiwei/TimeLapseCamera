import React, { useState, useEffect }  from 'react';
import { formatFirestoreTimestamp } from '../../functions/formatDate';
import ErrorMsg from '../ErrorMsg/ErrorMsg.js';
import RaspiDetail from '../RaspiDetail/RaspiDetail.js';
import '../../App.css';
import './MyDevices.css';

// React Icon Libraries
import eth0Icon from "../../images/ethernet.png";
import roomTemp from "../../images/RTemp.svg";
import cpuTemp from "../../images/CPUTemp.svg";
import { FaCircle, FaWifi, MdOutlineWork } from "../../images/Icons";
// import { FaCircle, FaWifi, IoBriefcaseOutline, MdOutlineWork } from "../../images/Icons";

const MyDevices = ({ pairedPis, error }) => {
  const [selectedPi, setSelectedPi] = useState(null);
  // console.log(serial)
  if (!pairedPis) return null; // Do not render the component if no error exists
  if (selectedPi) {
    return <RaspiDetail pi={selectedPi} onBack={() => setSelectedPi(null)} />;
  }
  return (
    <div className="RaspberryCam">
      <header className="App-background">
        {/* Display error if it exists */}
        <ErrorMsg error = {error} />
        
        <h1>My Devices</h1>

        <div className='devices'>
          {pairedPis.map((pi) => (
            <div
            key={pi.serial}
            className="deviceCard"
            onClick={() => setSelectedPi(pi)}
            >
              {/* <RaspiDetail pi = {pi} /> */}

              <div className='title'>
                <h3>{pi.data.NAME}</h3>
                <div className='status'>
                  {(() => {
                    const timeLapseStatus = pi.timeLapseCase?.data?.status;
                    if (pi.online) {
                      if (timeLapseStatus === "running") {
                        return (
                          <div className="busyStatus" style={{ strokeWidth: "15" }}>
                            <MdOutlineWork />
                          </div>
                        );
                      }
                      // If online and no running TimeLapseCase, ready for new case
                      return (
                        <div className="freeStatus">
                          <MdOutlineWork />
                        </div>
                      );
                    } else {
                      // Device offline
                      return (
                        <div className="unavailableStatus">
                          <MdOutlineWork />
                        </div>
                      );
                    }
                  })()}

                  <div className={`online ${!pi.online ? "offline" : ""}`}>
                    <span><FaCircle /></span>
                  </div>
                </div>
              </div>

              <div className='temperature'>
                <div className='roomTemp'>
                  <img src={roomTemp} className='App-logo' alt='Surronding Temperature'/>
                  <span>{pi.temperatureLog?._document?.data?.value?.mapValue?.fields?.Room?.doubleValue ?? "N/A"} &deg;C</span>
                </div>
                <div className='cpuTemp'>
                  <img src={cpuTemp} className='App-logo' alt='CPU Temperature'/>
                  <span>{pi.temperatureLog?._document?.data?.value?.mapValue?.fields?.CPU?.doubleValue  ?? "N/A"} &deg;C</span>
                </div>
              </div>

              <div className='connection'>
                <div className='connectionTitle'>
                  {pi.network.data?.Interface === "ethernet" ? (
                    // If device connected by lan cable
                    <img src={eth0Icon} className='App-logo' alt=''/>
                  ):(
                    // If device connected by WiFi
                    <FaWifi />
                  )}
                  <span><b>
                    {pi.network.id}</b></span>
                </div>
                
                <p className='connectionDetail'>
                  First connected date: <br />
                  {formatFirestoreTimestamp(pi.network.data.timeAdd.seconds)}
                </p>
              </div>

            </div>
          ))}
        </div>
      </header>
    </div>
  );
};

export default MyDevices;