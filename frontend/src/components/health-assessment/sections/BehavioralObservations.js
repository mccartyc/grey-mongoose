import React from 'react';
import PropTypes from 'prop-types';
import Select from '../../common/Select';
import Input from '../../common/Input';

const BehavioralObservations = ({ data, onChange }) => {
  const handleChange = (field) => (e) => {
    onChange({
      ...data,
      [field]: e.target.value,
    });
  };

  const appearanceOptions = [
    { value: 'well-groomed', label: 'Well-groomed' },
    { value: 'casual', label: 'Casual' },
    { value: 'disheveled', label: 'Disheveled' },
    { value: 'inappropriate', label: 'Inappropriate' },
  ];

  const moodOptions = [
    { value: 'euthymic', label: 'Euthymic' },
    { value: 'depressed', label: 'Depressed' },
    { value: 'anxious', label: 'Anxious' },
    { value: 'elevated', label: 'Elevated' },
    { value: 'irritable', label: 'Irritable' },
    { value: 'labile', label: 'Labile' },
  ];

  const speechOptions = [
    { value: 'normal', label: 'Normal' },
    { value: 'pressured', label: 'Pressured' },
    { value: 'slow', label: 'Slow' },
    { value: 'loud', label: 'Loud' },
    { value: 'soft', label: 'Soft' },
    { value: 'tangential', label: 'Tangential' },
  ];

  const thoughtProcessOptions = [
    { value: 'logical', label: 'Logical' },
    { value: 'circumstantial', label: 'Circumstantial' },
    { value: 'tangential', label: 'Tangential' },
    { value: 'loose', label: 'Loose Associations' },
    { value: 'flight-of-ideas', label: 'Flight of Ideas' },
  ];

  const orientationOptions = [
    { value: 'fully-oriented', label: 'Fully Oriented' },
    { value: 'time', label: 'Disoriented to Time' },
    { value: 'place', label: 'Disoriented to Place' },
    { value: 'person', label: 'Disoriented to Person' },
    { value: 'situation', label: 'Disoriented to Situation' },
  ];

  return (
    <div className="assessment-section">
      <h3>Behavioral Observations</h3>
      
      <Select
        label="Appearance"
        value={data.appearance}
        onChange={handleChange('appearance')}
        options={appearanceOptions}
        required
      />

      <Select
        label="Mood"
        value={data.mood}
        onChange={handleChange('mood')}
        options={moodOptions}
        required
      />

      <Select
        label="Speech"
        value={data.speech}
        onChange={handleChange('speech')}
        options={speechOptions}
        required
      />

      <Select
        label="Thought Process"
        value={data.thoughtProcess}
        onChange={handleChange('thoughtProcess')}
        options={thoughtProcessOptions}
        required
      />

      <Select
        label="Orientation"
        value={data.orientation}
        onChange={handleChange('orientation')}
        options={orientationOptions}
        required
      />

      <Input
        label="Additional Observations"
        value={data.additionalObservations || ''}
        onChange={handleChange('additionalObservations')}
        placeholder="Enter any additional behavioral observations"
      />
    </div>
  );
};

BehavioralObservations.propTypes = {
  data: PropTypes.shape({
    appearance: PropTypes.string.isRequired,
    mood: PropTypes.string.isRequired,
    speech: PropTypes.string.isRequired,
    thoughtProcess: PropTypes.string.isRequired,
    orientation: PropTypes.string.isRequired,
    additionalObservations: PropTypes.string,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
};

export default BehavioralObservations;
