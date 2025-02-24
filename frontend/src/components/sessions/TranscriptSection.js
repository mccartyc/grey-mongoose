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
    <div>
      <div>
        <label className="client-label new-session-label">
        Transcript:
        </label>
        <div className="transcript-controls">
          <button 
            type="button" 
            onClick={handleTranscriptAction}
            className={`btn primary-btn ${isTranscribing ? 'recording' : ''}`}
          >
            {isTranscribing ? 'Stop Transcript' : 'Start Transcript'}
          </button>
        </div>
      </div>

      <div className="form-row transcript-box">
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
