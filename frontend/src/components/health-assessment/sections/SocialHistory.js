import React from 'react';
import PropTypes from 'prop-types';
import Input from '../../common/Input';
import Select from '../../common/Select';

const SocialHistory = ({ data, onChange }) => {
  const handleChange = (field) => (e) => {
    onChange({
      ...data,
      [field]: e.target.value,
    });
  };

  const relationshipOptions = [
    { value: 'single', label: 'Single' },
    { value: 'married', label: 'Married' },
    { value: 'partnered', label: 'Partnered' },
    { value: 'divorced', label: 'Divorced' },
    { value: 'widowed', label: 'Widowed' },
    { value: 'separated', label: 'Separated' },
  ];

  const employmentOptions = [
    { value: 'full-time', label: 'Full-time' },
    { value: 'part-time', label: 'Part-time' },
    { value: 'self-employed', label: 'Self-employed' },
    { value: 'unemployed', label: 'Unemployed' },
    { value: 'student', label: 'Student' },
    { value: 'retired', label: 'Retired' },
    { value: 'disabled', label: 'Disabled' },
  ];

  return (
    <div className="assessment-section">
      <h3>Social History</h3>
      
      <Input
        label="Living Situation"
        value={data.livingSituation}
        onChange={handleChange('livingSituation')}
        required
        placeholder="Describe current living arrangements"
      />

      <Select
        label="Relationship Status"
        value={data.relationshipStatus}
        onChange={handleChange('relationshipStatus')}
        options={relationshipOptions}
        required
      />

      <Input
        label="Support System"
        value={data.supportSystem}
        onChange={handleChange('supportSystem')}
        required
        placeholder="Describe available support network"
      />

      <Select
        label="Employment Status"
        value={data.employmentStatus}
        onChange={handleChange('employmentStatus')}
        options={employmentOptions}
        required
      />

      <Input
        label="Hobbies and Interests"
        value={data.hobbies}
        onChange={handleChange('hobbies')}
        placeholder="List hobbies and interests"
      />
    </div>
  );
};

SocialHistory.propTypes = {
  data: PropTypes.shape({
    livingSituation: PropTypes.string.isRequired,
    relationshipStatus: PropTypes.string.isRequired,
    supportSystem: PropTypes.string.isRequired,
    employmentStatus: PropTypes.string.isRequired,
    hobbies: PropTypes.string.isRequired,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
};

export default SocialHistory;
