import React from 'react';
import './Modal.css';

const Modal = ({ isOpen, onClose, children, onPrevious, onNext, imageName, currentIndex, totalImages }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        <div className="modal-header">
          <h3>{imageName}</h3>
        </div>
        <div className="modal-navigation">
          <button className="prev-button" onClick={onPrevious} disabled={currentIndex === 0}>Previous</button>
          <div className="modal-image">
            {children}
            <p className="image-counter">{`${currentIndex + 1} / ${totalImages}`}</p> {/* Display current image number out of total */}
          </div>
          <button className="next-button" onClick={onNext} disabled={currentIndex === totalImages - 1}>Next</button>
        </div>
      </div>
    </div>
  );
};

export default Modal;