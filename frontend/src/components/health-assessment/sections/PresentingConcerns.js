import React from 'react';
import PropTypes from 'prop-types';
import Input from '../../common/Input';

const PresentingConcerns = ({ data, onChange }) => {
  const handleChange = (field) => (e) => {
    onChange({
      ...data,
      [field]: e.target.value,
    });
  };

  return (
    <div className="assessment-section">
      <h3>Presenting Concerns</h3>
      
      <Input
        label="Primary Concerns"
        value={data.concerns}
        onChange={handleChange('concerns')}
        required
        placeholder="Describe the main issues bringing the client to therapy"
      />

      <Input
        label="Duration"
        value={data.duration}
        onChange={handleChange('duration')}
        required
        placeholder="How long have these concerns been present?"
      />

      <Input
        label="Impact on Daily Life"
        value={data.dailyImpact}
        onChange={handleChange('dailyImpact')}
        required
        placeholder="How do these concerns affect daily functioning?"
      />
    </div>
  );
};

PresentingConcerns.propTypes = {
  data: PropTypes.shape({
    concerns: PropTypes.string.isRequired,
    duration: PropTypes.string.isRequired,
    dailyImpact: PropTypes.string.isRequired,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
};

export default PresentingConcerns;
