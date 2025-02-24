import React from 'react';
import PropTypes from 'prop-types';

const SessionDetails = ({ 
  date, 
  length, 
  type, 
  onDateChange, 
  onLengthChange, 
  onTypeChange 
}) => {
  return (
    <div className="form-row-group">
      <div className="form-row-item type-selector">
        <label className="type-label new-session-label">
          Type:
          <select
            value={type}
            onChange={(e) => onTypeChange(e.target.value)}
            required
          >
            <option value="">Select Type</option>
            <option value="In Person">In Person</option>
            <option value="Phone">Phone</option>
            <option value="Virtual">Virtual</option>
            <option value="Text">Text</option>
            <option value="Email">Email</option>
            <option value="Other">Other</option>
          </select>
        </label>
      </div>

      <div className="form-row-item length-selector">
        <label className="length-label new-session-label">
          Length (minutes):
          <input
            type="number"
            value={length}
            onChange={(e) => onLengthChange(e.target.value)}
            required
            min="1"
            max="480"
          />
        </label>
      </div>
    </div>
  );
};

SessionDetails.propTypes = {
  date: PropTypes.string.isRequired,
  length: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  onDateChange: PropTypes.func.isRequired,
  onLengthChange: PropTypes.func.isRequired,
  onTypeChange: PropTypes.func.isRequired,
};

export default SessionDetails;
