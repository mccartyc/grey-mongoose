import React from 'react';
import PropTypes from 'prop-types';

const ClientSelector = ({ 
  selectedClientId, 
  filteredClients, 
  onClientSelect, 
  disabled 
}) => {
  return (
    <div className="form-row">
      <label className="client-label new-session-label">
        Client:
        <select
          value={selectedClientId}
          onChange={(e) => onClientSelect(e.target.value)}
          required
          disabled={disabled}
        >
          <option value="">Select a client</option>
          {filteredClients.map((client) => (
            <option key={client._id} value={client._id}>
              {client.firstName} {client.lastName}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
};

ClientSelector.propTypes = {
  selectedClientId: PropTypes.string.isRequired,
  filteredClients: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      firstName: PropTypes.string.isRequired,
      lastName: PropTypes.string.isRequired,
    })
  ).isRequired,
  onClientSelect: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

ClientSelector.defaultProps = {
  disabled: false,
};

export default ClientSelector;
