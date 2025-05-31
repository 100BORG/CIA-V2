import React, { useEffect } from 'react';

const Modal = ({ isOpen, onClose, title, children, actions }) => {
  // Close modal when Escape key is pressed
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Stop click propagation from the modal content
  const handleContentClick = (e) => {
    e.stopPropagation();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={handleContentClick}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        {actions && (
          <div className="modal-footer">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;