import React from "react";

const ErrorModal = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="error-modal-overlay">
      <div className="error-modal">
        <p className="error-message">{message}</p>
        <button className="close-button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default ErrorModal;
