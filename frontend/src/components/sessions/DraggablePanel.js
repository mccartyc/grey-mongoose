import React, { useState, useEffect } from 'react';

const DraggablePanel = ({ 
  children, 
  isOpen, 
  onClose, 
  initialWidth = 500, 
  minWidth = 300, 
  maxWidth = 800,
  onWidthChange
}) => {
  // Reference to the panel element for animations
  const panelRef = React.useRef(null);
  const [width, setWidth] = useState(initialWidth);
  const [isDragging, setIsDragging] = useState(false);
  
  // Handle drag start
  const handleDragStart = (e) => {
    // Store the initial mouse position and panel width
    const startX = e.clientX;
    const startWidth = width;
    
    const handleDrag = (moveEvent) => {
      // Calculate new width based on mouse movement (right to left)
      const deltaX = startX - moveEvent.clientX;
      let newWidth = startWidth + deltaX;
      
      // Apply constraints
      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      
      // Update width
      setWidth(newWidth);
      if (onWidthChange) onWidthChange(newWidth);
    };
    
    const handleDragEnd = () => {
      // Remove event listeners when drag ends
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', handleDragEnd);
      setIsDragging(false);
      document.body.style.cursor = '';
    };
    
    // Set dragging state and cursor
    setIsDragging(true);
    document.body.style.cursor = 'ew-resize';
    
    // Add event listeners for drag and drag end
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', handleDragEnd);
    
    // Prevent default behavior
    e.preventDefault();
  };
  
  // Clean up event listeners on unmount
  useEffect(() => {
    return () => {
      document.body.style.cursor = '';
    };
  }, []);
  
  // Handle closing the panel with animation
  const handleClose = () => {
    if (panelRef.current) {
      // Add closing animation class
      panelRef.current.classList.add('closing');
      
      // Wait for animation to complete before actually closing
      setTimeout(() => {
        onClose();
      }, 300); // Match the animation duration
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;
  
  return (
    <div 
      ref={panelRef}
      className={`draggable-panel ${isDragging ? 'dragging' : ''}`}
      style={{ width: `${width}px` }}
    >
      {/* Drag handle */}
      <div 
        className="drag-handle"
        onMouseDown={handleDragStart}
        title="Drag to resize panel width"
      >
        <div className="drag-handle-indicator">
          <div className="drag-handle-line"></div>
          <div className="drag-handle-line"></div>
          <div className="drag-handle-line"></div>
        </div>
      </div>
      
      {/* Panel content */}
      <div className="panel-content">
        {/* Replace the first close button with our custom close handler */}
        {React.Children.map(children, (child, index) => {
          if (index === 0 && React.isValidElement(child)) {
            // Clone the header element and replace the close button's onClick
            return React.cloneElement(child, {}, 
              React.Children.map(child.props.children, (headerChild) => {
                if (headerChild.type === 'button' && headerChild.props.className === 'close-btn') {
                  return React.cloneElement(headerChild, { onClick: handleClose });
                }
                return headerChild;
              })
            );
          }
          return child;
        })}
      </div>
    </div>
  );
};

export default DraggablePanel;
