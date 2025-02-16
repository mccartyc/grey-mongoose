import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useHealthAssessment } from './hooks/useHealthAssessment';
import PresentingConcerns from './sections/PresentingConcerns';
import MedicalHistory from './sections/MedicalHistory';
import SocialHistory from './sections/SocialHistory';
import BehavioralObservations from './sections/BehavioralObservations';
import Button from '../common/Button';
import './HealthAssessmentForm.css';

const HealthAssessmentForm = () => {
  const { id: clientId } = useParams();
  const navigate = useNavigate();
  
  const {
    formData,
    updateFormSection,
    addMedication,
    updateMedication,
    removeMedication,
    submitAssessment,
    loadAssessment,
    isLoading,
    error,
  } = useHealthAssessment(clientId);

  useEffect(() => {
    const assessmentId = new URLSearchParams(window.location.search).get('assessmentId');
    if (assessmentId) {
      loadAssessment(assessmentId);
    }
  }, [loadAssessment]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await submitAssessment();
      navigate(`/clients/${clientId}/overview`);
    } catch (error) {
      // Error is handled by the hook and displayed in the UI
      console.error('Failed to submit assessment:', error);
    }
  };

  if (isLoading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  return (
    <div className="health-assessment-form">
      <h2>Mental Health Intake Assessment</h2>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <PresentingConcerns
          data={formData.presentingConcerns}
          onChange={(data) => updateFormSection('presentingConcerns', data)}
        />

        <MedicalHistory
          data={formData.medicalHistory}
          onChange={(data) => updateFormSection('medicalHistory', data)}
          onAddMedication={addMedication}
          onUpdateMedication={updateMedication}
          onRemoveMedication={removeMedication}
        />

        <SocialHistory
          data={formData.socialHistory}
          onChange={(data) => updateFormSection('socialHistory', data)}
        />

        <BehavioralObservations
          data={formData.behavioralObservations}
          onChange={(data) => updateFormSection('behavioralObservations', data)}
        />

        <div className="form-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(`/clients/${clientId}/overview`)}
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
            variant="primary"
            loading={isLoading}
          >
            Submit Assessment
          </Button>
        </div>
      </form>
    </div>
  );
};

export default HealthAssessmentForm;
