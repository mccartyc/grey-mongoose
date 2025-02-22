import React from 'react';
import PropTypes from 'prop-types';
import Input from '../../common/Input';
import Button from '../../common/Button';

const MedicalHistory = ({ 
  data, 
  onChange,
  onAddMedication,
  onUpdateMedication,
  onRemoveMedication,
}) => {
  const handleChange = (field) => (e) => {
    onChange({
      ...data,
      [field]: e.target.value,
    });
  };

  return (
    <div className="assessment-section">
      <h3>Medical History</h3>
      
      <Input
        label="Current Medical Conditions"
        value={data.conditions}
        onChange={handleChange('conditions')}
        placeholder="List any current medical conditions"
      />

      <div className="medications-section">
        <h4>Current Medications</h4>
        {data.medications.map((medication, index) => (
          <div key={index} className="medication-entry">
            <Input
              label="Medication Name"
              value={medication.name}
              onChange={(e) => onUpdateMedication(index, 'name', e.target.value)}
              placeholder="Enter medication name"
            />
            
            <Input
              label="Dosage"
              value={medication.dosage}
              onChange={(e) => onUpdateMedication(index, 'dosage', e.target.value)}
              placeholder="Enter dosage"
            />
            
            <Input
              label="Prescribing Physician"
              value={medication.physician}
              onChange={(e) => onUpdateMedication(index, 'physician', e.target.value)}
              placeholder="Enter physician name"
            />
            
            {data.medications.length > 1 && (
              <Button
                type="button"
                variant="danger"
                onClick={() => onRemoveMedication(index)}
              >
                Remove Medication
              </Button>
            )}
          </div>
        ))}
        
        <Button
          type="button"
          variant="secondary"
          onClick={onAddMedication}
        >
          Add Medication
        </Button>
      </div>

      <Input
        label="Allergies"
        value={data.allergies}
        onChange={handleChange('allergies')}
        placeholder="List any allergies"
      />

      <Input
        label="Substance Use"
        value={data.substanceUse}
        onChange={handleChange('substanceUse')}
        placeholder="Document any substance use history"
      />
    </div>
  );
};

MedicalHistory.propTypes = {
  data: PropTypes.shape({
    conditions: PropTypes.string.isRequired,
    medications: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        dosage: PropTypes.string.isRequired,
        physician: PropTypes.string.isRequired,
      })
    ).isRequired,
    allergies: PropTypes.string.isRequired,
    substanceUse: PropTypes.string.isRequired,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onAddMedication: PropTypes.func.isRequired,
  onUpdateMedication: PropTypes.func.isRequired,
  onRemoveMedication: PropTypes.func.isRequired,
};

export default MedicalHistory;
