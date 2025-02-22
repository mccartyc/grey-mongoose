import React from 'react';
import PropTypes from 'prop-types';
import '../../styles/Transcript.css';

const TranscriptSection = ({
  isTranscribing,
  transcriptBoxContent,
  onStartTranscript,
  onStopTranscript
}) => {
  const handleTranscriptAction = () => {
    if (isTranscribing) {
      onStopTranscript();
    } else {
      onStartTranscript();
    }
  };

  return (
    <div className="form-row transcript-section">
      <div className="transcript-controls">
        <button 
          type="button" 
          onClick={handleTranscriptAction}
          className={`transcript-button ${isTranscribing ? 'recording' : ''}`}
        >
          {isTranscribing ? 'Stop Transcript' : 'Start Transcript'}
        </button>
      </div>
      
      <div className="transcript-box">
        <h4>Session Transcript:</h4>
        <div className="transcript-content">
          {transcriptBoxContent}
        </div>
      </div>
    </div>
  );
};

TranscriptSection.propTypes = {
  isTranscribing: PropTypes.bool.isRequired,
  transcriptBoxContent: PropTypes.string.isRequired,
  onStartTranscript: PropTypes.func.isRequired,
  onStopTranscript: PropTypes.func.isRequired,
};

export default TranscriptSection;
