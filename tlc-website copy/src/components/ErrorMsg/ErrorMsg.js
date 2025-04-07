import React from 'react';
import { TbAlertTriangleFilled } from "../../images/Icons"
import './ErrorMsg.css';

const ErrorMsg = ({ error }) => {
  if (!error) return null; // Do not render the component if no error exists

  return (
    <div className="App-error-msg">
      <TbAlertTriangleFilled className="App-error-icon" />
      <span>{error}</span>
    </div>
  );
};

export default ErrorMsg;