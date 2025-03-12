import React from 'react';
import '../../styles/settingsStyles.css';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="confirmation-modal-overlay">
      <div className="confirmation-modal">
        <div className="confirmation-modal-header">
          <h3>{title || 'Confirm Action'}</h3>
          <button className="secondary-btn" onClick={onClose}>×</button>
        </div>
        <div className="confirmation-modal-content">
          <p>{message || 'Are you sure you want to proceed?'}</p>
        </div>
        <div className="confirmation-modal-footer">
          <button className="secondary-button" onClick={onClose}>Cancel</button>
          <button className="primary-button" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
