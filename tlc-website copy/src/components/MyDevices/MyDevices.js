import React, { useState, useEffect }  from 'react';
import { collection, query, where, getDocs, orderBy, limit, doc, onSnapshot } from "firebase/firestore";
import { ref, onValue } from "firebase/database"; // Real time database
import { onAuthStateChanged } from "firebase/auth";
import { auth, db, realtimeDB } from '../../firebase/firebase.js';
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

const MyDevices = () => {
  const [selectedPi, setSelectedPi] = useState(null);
  const [userId, setUserId] = useState(null);
  const [pairedPis, setPairedPis] = useState([]);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("");
  
// Move activeListeners outside the useEffect
const activeListeners = new Map();

useEffect(() => {
  const currentCaseIds = new Set();

  pairedPis.forEach((pi) => {
    if (pi.online && pi.timeLapseCase) {
      const caseId = pi.timeLapseCase.id;

      // Track currently active caseIds
      currentCaseIds.add(caseId);

      // Check if a listener for this case is already active
      if (activeListeners.has(caseId)) {
        console.log(`Listener for case ${caseId} is already active.`);
        return;
      }

      // console.log(`Setting up listener for running case: ${caseId}`);

      const caseRef = doc(
        db,
        "raspberrys",
        pi.serial,
        "TimeLapseCase",
        caseId
      );

      // Set up a real-time listener
      const unsubscribe = onSnapshot(caseRef, (snapshot) => {
        if (snapshot.exists()) {
          const caseData = snapshot.data();
          // console.log(`Real-time update for case ${caseId}:`, caseData);
      
          // Check if the case status or other important fields changed before updating state
          setPairedPis((prevPairedPis) =>
            prevPairedPis.map((innerPi) => {
              if (innerPi.serial === pi.serial) {
                // Compare current state with the new data
                const currentData = innerPi.timeLapseCase?.data;
                if (
                  currentData?.status !== caseData.status ||
                  JSON.stringify(currentData) !== JSON.stringify(caseData)
                ) {
                  console.log(`Updating state for case ${caseId} due to changes.`);
                  return {
                    ...innerPi,
                    timeLapseCase: { id: snapshot.id, data: caseData },
                  };
                }
              }
              return innerPi;
            })
          );
        } else {
          console.log(`Running case ${caseId} no longer exists.`);
          setPairedPis((prevPairedPis) =>
            prevPairedPis.map((innerPi) =>
              innerPi.serial === pi.serial ? { ...innerPi, timeLapseCase: null } : innerPi
            )
          );
        }
      });
      

      // Add the unsubscribe function to the map
      activeListeners.set(caseId, unsubscribe);
    }
  });

  // Cleanup: Unsubscribe only listeners that are no longer in use
  activeListeners.forEach((unsubscribe, caseId) => {
    if (!currentCaseIds.has(caseId)) {
      // console.log(`Cleaning up listener for case ${caseId}`);
      unsubscribe();
      activeListeners.delete(caseId);
    }
  });

  // No need for a return cleanup function here because we handle it dynamically
}, [pairedPis]); // Runs whenever `pairedPis` updates
  
  useEffect(() => {
    if (pairedPis.length > 0) {
      // Map over the pairedPis array and extract the status dynamically
      const statuses = pairedPis.map((pi, index) => 
        pi?.timeLapseCase?.data?.status || `Status for Pi ${index + 1}: N/A`
      );
      // Join all statuses into a single string
      setStatus(statuses.join(", "));
    }
  }, [pairedPis]);
  // console.log(status)

  // Loop for all paired raspberry Pi...
  useEffect(() => {
    if (!pairedPis || pairedPis.length === 0) return; // Wait until the paired raspberry found
    
    for(let i = 0; i < pairedPis.length; i++){
      listenToPiStatus(pairedPis[i]); // Listen to current status
    }
    // console.log(pairedPis);
    // console.log(pairedPis[1].timeLapseCase.data.status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // setUserId
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid); // Set the user's UID
      } else {
        setUserId(null); // User is not logged in
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  
  // setPairedRasps from database
  useEffect(() => {
    const fetchPairedPis = async () => {
      if (!userId) return; // Wait until userId is set
      else setPairedPis([]);  // Reset pairedPi

      try {
        const piRef = collection(db, "raspberrys");
        const q = query(piRef, where("UID", "==", userId));
        const querySnapshot = await getDocs(q);
  
        const matchedPis = await Promise.all(
          querySnapshot.docs.map(async (doc) => {
            const serial = doc.id;
            const data = doc.data();

            const latestNetwork = await fetchLatestNetwork(serial);
  
            // Fetch temperature log
            const temperatureLog = await fetchTemperatureLog(serial);
  
            // Fetch timelapse case === running
            const timeLapseCase = await fetchRunningTimeLapseCases(serial);

            // Fetch timelapse case if the Pi is online
            // const timeLapseCase = data?.online ? await fetchTimeLapseCases(serial) : null;
              
              return {
                serial,
                data,
                temperatureLog: temperatureLog ? temperatureLog : null,
                timeLapseCase: timeLapseCase ? timeLapseCase : null,
                network: latestNetwork ? latestNetwork : null,
              };
            })
          );
        setPairedPis(matchedPis);
        // console.log(matchedPis);
      } catch(err){
        const errorMsg = "Error fetching Raspberry Pis: " + err;
        // console.log(errorMsg);
        setError(errorMsg);
      }
    };
    fetchPairedPis();
  }, [userId]);

  // Get "tempetureLog" for this device
  const fetchTemperatureLog = async (serial) => {
    
    const temperatureLogRef = collection(
      db, "raspberrys",
      serial, "TemperatureLog"
    );
    // Query to get the last document based on the timestamp (document ID)
    const lastDocQuery = query(temperatureLogRef, orderBy("createAt", "desc"), limit(1));
    const snapshot = await getDocs(lastDocQuery);

    if (!snapshot.empty){
      // console.log(snapshot)
      return snapshot.docs[0];
    }
  };

  // Get lastest "timeLapseCases" for this device
  const fetchRunningTimeLapseCases = async (serial) => {
    // console.log("Fetching the running timeLapseCase for Pi:", serial);
  
    try {
      const timeLapseRef = collection(db, "raspberrys", serial, "TimeLapseCase");
      const q = query(timeLapseRef, where("status", "==", "running")); // Only fetch the running case
      const snapshot = await getDocs(q);
  
      if (!snapshot.empty) {
        const runningCase = snapshot.docs[0]; // Since there can only be one running case
        // console.log("Fetched running TimeLapseCase:", runningCase.data());
        return { id: runningCase.id, data: runningCase.data() };
      } else {
        // console.log("No running TimeLapseCase found for Pi:", serial);
        return null;
      }
    } catch (error) {
      console.error("Error fetching TimeLapseCases:", error);
      return null;
    }
  };
  
    // const fetchTimeLapseCases = async (serial) => {
    //   console.log("entered Get lastest TimeLapseCase for this device")
    //   try {
    //     const timeLapseRef = collection(db, "raspberrys", serial, "TimeLapseCase");
    //     const snapshot = await getDocs(timeLapseRef);
    
    //     const snapshotDocs = snapshot.docs.map((doc) => ({
    //       id: doc.id,
    //       data: doc.data(),
    //     }));
    
    //     console.log("Fetched TimeLapseCase Docs:", snapshotDocs);
    
    //     // Filter and sort
    //     const sortedSnapshotDocs = snapshotDocs
    //       .filter(doc => doc.data?.status !== "standby")
    //       .sort((a, b) => {
    //         const dateA = new Date(a.data.updated_at?.toDate?.() || a.data.updated_at).getTime();
    //         const dateB = new Date(b.data.updated_at?.toDate?.() || b.data.updated_at).getTime();
    //         return dateB - dateA;
    //       });
    
    //     console.log("Sorted TimeLapseCases:", sortedSnapshotDocs);
    
    //     return sortedSnapshotDocs.length > 0 ? sortedSnapshotDocs[0] : null;
    //   } catch (error) {
    //     console.error("Error fetching TimeLapseCases:", error);
    //     return null;
    //   }
    // };
    
    // Fetch the latest network
    const fetchLatestNetwork = async (piId) => {
      const networkCollectionRef = collection(db, "raspberrys", piId, "network");
      const networkDocs = await getDocs(networkCollectionRef);

      let latestNetwork = null;

      networkDocs.forEach((doc) => {
        const networkData = doc.data();
        if (networkData.timeAdd?.seconds) {
          if (!latestNetwork || networkData.timeAdd.seconds > latestNetwork.data.timeAdd.seconds) {
            latestNetwork = { id: doc.id, data: networkData };
          }
        }
      });

      return latestNetwork;
    };

  // // Get lastest connected "network" for this device
  // const fetchNetwork = async (serial) => {
  //   const networkRef = collection(
  //     db, "raspberrys",
  //     serial, "network"
  //   );
  //   const snapshot = await getDocs(networkRef);
  //   const snapshotDocs = snapshot.docs.map((doc) => ({
  //     id: doc.id, data: doc.data()
  //   }));

  //   // Sort the cases by "timeAdd" in descending order
  //   const sortedSnapshotDocs =  snapshotDocs.sort((a, b) => {
  //     const dateA = new Date(a.data.timeAdd).getTime();
  //     const dateB = new Date(b.data.timeAdd).getTime();
  //     return dateB - dateA; // Descending order
  //   });

  //   // Return the first (latest) case if available
  //   return sortedSnapshotDocs.length > 0 ? sortedSnapshotDocs[0] : null;
  // };

  // Listen to realtime data in firebase for raspberry Pi status
  const listenToPiStatus = async (pairedPi) => {
    const statusRef = ref(realtimeDB, "raspberrys/" + pairedPi.serial);

    onValue(statusRef, (snapshot) => {
      const data = snapshot.val();
      // console.log(statusRef);
      const currentTime = Date.now() / 1000;

      setPairedPis((prevPairedPis) => 
        prevPairedPis.map((pi) => {
          if (pi.serial !== pairedPi.serial)
            return pi;  // If Pi is not map with pairedPi

          if (data){  // If this device available...
            const realtimeTime = data.timestamp;
            const intervalTime = currentTime - realtimeTime;
            
            return {
              ...pi,
              online: intervalTime <= 3.5 * 60, // Return true if within 3.5 minutes
              lastStatusUpdate: realtimeTime
            };
          } else{
            if (!pi.lastStatusUpdate || pi.online){
              return {
                ...pi,
                online: false, // Mark offline
                lastStatusUpdate: currentTime // Record the time once
              };
            }
            
            return pi;
            
          } 
        })
      );
    });

    // Periodic Interval to Check Offline Status
    setInterval(() => {
      setPairedPis((prevPairedPis) =>
        prevPairedPis.map((pi) => {
          const currentTime = Date.now() / 1000;

          // Check if Pi is offline based on lastStatusUpdate
          if (pi.lastStatusUpdate && currentTime - pi.lastStatusUpdate > 3.5 * 60) {
            return { ...pi, online: false }; // Mark offline
          }

          return pi;
        })
      );
    }, 5000); // Check every second
  };

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
                    // console.log(pi.timeLapseCase?.data?.status)
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
                Lastest connected: <br />
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