import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { createApiInstance } from '../utils/apiConfig';

export const useHealthAssessment = (clientId) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const initialFormState = {
    clientInfo: { name: '', id: clientId },
    presentingConcerns: { concerns: '', duration: '', dailyImpact: '' },
    mentalHealthHistory: {
      diagnoses: '',
      treatment: { type: '', provider: '', dates: '' },
      familyHistory: '',
    },
    medicalHistory: {
      conditions: '',
      medications: [{ name: '', dosage: '', physician: '' }],
      allergies: '',
      substanceUse: '',
    },
    socialHistory: {
      livingSituation: '',
      relationshipStatus: '',
      supportSystem: '',
      employmentStatus: '',
      hobbies: '',
    },
    behavioralObservations: {
      appearance: '',
      mood: '',
      speech: '',
      thoughtProcess: '',
      orientation: '',
    },
    assessmentTools: { tools: '', results: '' },
    clinicianNotes: { sessionSummary: '', initialImpressions: '' },
  };

  const [formData, setFormData] = useState(initialFormState);

  const updateFormSection = (section, data) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...data,
      },
    }));
  };

  const addMedication = () => {
    setFormData(prev => ({
      ...prev,
      medicalHistory: {
        ...prev.medicalHistory,
        medications: [
          ...prev.medicalHistory.medications,
          { name: '', dosage: '', physician: '' },
        ],
      },
    }));
  };

  const updateMedication = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      medicalHistory: {
        ...prev.medicalHistory,
        medications: prev.medicalHistory.medications.map((med, i) =>
          i === index ? { ...med, [field]: value } : med
        ),
      },
    }));
  };

  const removeMedication = (index) => {
    setFormData(prev => ({
      ...prev,
      medicalHistory: {
        ...prev.medicalHistory,
        medications: prev.medicalHistory.medications.filter((_, i) => i !== index),
      },
    }));
  };

  const submitAssessment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        "/api/assessments',
        {
          ...formData,
          tenantId: user.tenantId,
          userId: user.userId,
          clientId,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit assessment');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loadAssessment = async (assessmentId) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `/api/assessments/${assessmentId}`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      setFormData(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load assessment');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    formData,
    updateFormSection,
    addMedication,
    updateMedication,
    removeMedication,
    submitAssessment,
    loadAssessment,
    isLoading,
    error,
  };
};
