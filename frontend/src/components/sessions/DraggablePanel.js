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
  
  // Call onWidthChange when the panel first opens
  useEffect(() => {
    if (isOpen && onWidthChange) {
      onWidthChange(initialWidth);
    }
  }, [isOpen, initialWidth, onWidthChange]);
  
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
      }, 200); // Match the animation duration
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
        {/* Process all children */}
        {React.Children.map(children, (child) => {
          // If this is a valid React element
          if (React.isValidElement(child)) {
            // Deep search for close buttons
            const processChildren = (element) => {
              if (!React.isValidElement(element)) return element;
              
              // If this is a close button, replace its onClick
              if (element.type === 'button' && 
                  element.props.className && 
                  element.props.className.includes('close-btn')) {
                return React.cloneElement(element, { 
                  onClick: handleClose 
                });
              }
              
              // If it has children, process them recursively
              if (element.props.children) {
                return React.cloneElement(element, {}, 
                  React.Children.map(element.props.children, processChildren)
                );
              }
              
              return element;
            };
            
            return processChildren(child);
          }
          
          return child;
        })}
      </div>
    </div>
  );
};

export default DraggablePanel;
