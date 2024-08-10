import React from 'react';
import './Modal.css';
import { GrNext, GrPrevious } from "react-icons/gr";

const Modal = ({ isOpen, onClose, children, onPrevious, onNext, imageName, currentIndex, totalImages }) => {
  if (!isOpen) return null;

  return (
    <div className="imagePopup" onClick={onClose}>
      <div className="popupContent" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        <h3>{imageName}</h3>
        <div className="mainContent">
          <div className="holdImgContent">
            <button className="prev-button" onClick={onPrevious} disabled={currentIndex === 0}><GrPrevious/></button>
            {children}
            <button className="next-button" onClick={onNext} disabled={currentIndex === totalImages - 1}><GrNext/></button>
          </div>
          <p>{`${currentIndex + 1} / ${totalImages}`}</p> {/* Display current image number out of total */}
        </div>
      </div>
    </div>
  );
};

export default Modal;