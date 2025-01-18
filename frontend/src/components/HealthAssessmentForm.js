import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';


const MentalHealthIntakeAssessment = () => {
  const { id } = useParams(); // Get the client ID from the route
  const { user } = useAuth(); // Access the current user from AuthContext
  const navigate = useNavigate(); // Use navigate hook
  const [client, setClient] = useState({});

  const [medications, setMedications] = useState([
    { name: '', dosage: '', physician: '' },
  ]);

  const [formData, setFormData] = useState({
    clientInfo: { name: '',  id: ''},
    presentingConcerns: { concerns: '', duration: '', dailyImpact: '' },
    mentalHealthHistory: {
      diagnoses: '',
      treatment: { type: '', provider: '', dates: '' },
      familyHistory: '',
    },
    medicalHistory: {
      conditions: '',
      medications: { name: '', dosage: '', physician: '' },
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
  });


  const handleMedicationChange = (index, field, value) => {
    const updatedMedications = [...medications];
    updatedMedications[index][field] = value;
    setMedications(updatedMedications);
  };
  
  const handleAddMedication = () => {
    setMedications([...medications, { name: '', dosage: '', physician: '' }]);
  };
  
  const handleRemoveMedication = (index) => {
    const updatedMedications = medications.filter((_, i) => i !== index);
    setMedications(updatedMedications);
  };

  useEffect(() => {
    const fetchClients = async () => {

      const clientResponse = await axios.get(`http://localhost:5001/api/clients/${id}`, {
        params: {
          tenantId: user.tenantId,
          userId: user.userId,
        },
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        });
        setClient(clientResponse.data);
  };
  fetchClients();
}, [user, id]); // Re-run the effect when the user changes


  const handleChange = (e) => {
    const { name, value } = e.target;
    // Handle nested objects in state
    if (name.includes('.')) {
      const keys = name.split('.');
      setFormData((prevData) => ({
        ...prevData,
        [keys[0]]: {
          ...prevData[keys[0]],
          [keys[1]]: value,
        },
      }));
    } else {
      setFormData((prevData) => ({ ...prevData, [name]: value }));
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        `http://localhost:5001/api/intake-forms`,
        { ...formData, id }, // Include the clientId in the request body
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      console.log('Intake form submitted:', response.data);
      navigate(`/clients/${id}`); // Navigate to a confirmation or client detail page
    } catch (error) {
      console.error('Error submitting intake form:', error);
    }
  };

  return (
    <div className="intake-form">
      <h1>Mental Health Intake Assessment</h1>
      <form onSubmit={handleSubmit}>
        {/* Client Information */}
        <div className='intake-form-header intake-form-header-row'> 
        <p>Client: {client.firstName} {client.lastName}</p>
        <p>{id}</p> 
        </div>
        {/* Presenting Concerns */}
        <h3>Presenting Concerns</h3>
        <div className="form-group">
          <label>Primary Concern(s):</label>
          <textarea
            name="presentingConcerns.concerns"
            value={formData.presentingConcerns.concerns}
            onChange={handleChange}
            className="form-input-text"
          />
        </div>
        <div className="form-group">
          <label>Duration of Concern(s):</label>
          <input
            type="text"
            name="presentingConcerns.duration"
            value={formData.presentingConcerns.duration}
            onChange={handleChange}
            className="form-input-text"
          />
        </div>
        <div className="form-group">
          <label>Impact on Daily Functioning:</label>
          <textarea
            name="presentingConcerns.dailyImpact"
            value={formData.presentingConcerns.dailyImpact}
            onChange={handleChange}
            className="form-input-text"
          />
        </div>

        {/* Mental Health History */}
        <h3>Mental Health History</h3>
        <div className="form-group">
          <label>Previous Diagnoses:</label>
          <textarea
            name="mentalHealthHistory.diagnoses"
            value={formData.mentalHealthHistory.diagnoses}
            onChange={handleChange}
            className="form-input-text"
          />
        </div>
        <div className="form-group">
          <label>Past Treatment:</label>
          <input
            type="text"
            name="mentalHealthHistory.treatment.type"
            value={formData.mentalHealthHistory.treatment.type}
            onChange={handleChange}
            className="form-input-text"
            placeholder="Type (therapy, medication, etc.)"
          />
          <input
            type="text"
            name="mentalHealthHistory.treatment.provider"
            value={formData.mentalHealthHistory.treatment.provider}
            onChange={handleChange}
            className="form-input-text"
            placeholder="Provider(s)"
          />
          <input
            type="text"
            name="mentalHealthHistory.treatment.dates"
            value={formData.mentalHealthHistory.treatment.dates}
            onChange={handleChange}
            className="form-input-text"
            placeholder="Dates"
          />
        </div>
        <div className="form-group">
          <label>Family History of Mental Health Issues:</label>
          <textarea
            name="mentalHealthHistory.familyHistory"
            value={formData.mentalHealthHistory.familyHistory}
            onChange={handleChange}
            className="form-input-text"
          />
        </div>

        {/* Medical History */}
        <h3>Medical History</h3>
        <div className="form-group">
          <label>Current Medical Conditions:</label>
          <textarea
            name="medicalHistory.conditions"
            value={formData.medicalHistory.conditions}
            onChange={handleChange}
            className="form-input-text"
          />
        </div>
        <h3>Current Medications</h3>
<div className="form-group">
  {medications.map((medication, index) => (
    <div key={index} className="medication-row">
      <input
        type="text"
        placeholder="Name"
        className="form-input-text medication-input"
        value={medication.name}
        onChange={(e) =>
          handleMedicationChange(index, 'name', e.target.value)
        }
      />
      <input
        type="text"
        placeholder="Dosage"
        className="form-input-text medication-input"
        value={medication.dosage}
        onChange={(e) =>
          handleMedicationChange(index, 'dosage', e.target.value)
        }
      />
      <input
        type="text"
        placeholder="Prescribing Physician"
        className="form-input-text medication-input"
        value={medication.physician}
        onChange={(e) =>
          handleMedicationChange(index, 'physician', e.target.value)
        }
      />
      {medications.length > 1 && (
        <button
          type="button"
          className="btn remove-btn"
          onClick={() => handleRemoveMedication(index)}
        >
          Remove
        </button>
      )}
    </div>
  ))}
  <button
    type="button"
    className="btn add-btn"
    onClick={handleAddMedication}
  >
    Add Medication
  </button>
</div>
        <div className="form-group">
          <label>Allergies:</label>
          <textarea
            name="medicalHistory.allergies"
            value={formData.medicalHistory.allergies}
            onChange={handleChange}
            className="form-input-text"
          />
        </div>
        <div className="form-group">
          <label>Substance Use History (alcohol, drugs, etc.):</label>
          <textarea
            name="medicalHistory.substanceUse"
            value={formData.medicalHistory.substanceUse}
            onChange={handleChange}
            className="form-input-text"
          />
        </div>

        {/* Social History */}
        <h3>Social History</h3>
        <div className="form-group">
          <label>Living Situation:</label>
          <textarea
            name="socialHistory.livingSituation"
            value={formData.socialHistory.livingSituation}
            onChange={handleChange}
            className="form-input-text"
          />
        </div>
        <div className="form-group">
          <label>Relationship Status:</label>
          <textarea
            name="socialHistory.relationshipStatus"
            value={formData.socialHistory.relationshipStatus}
            onChange={handleChange}
            className="form-input-text"
          />
        </div>
        <div className="form-group">
          <label>Support System (family, friends, community):</label>
          <textarea
            name="socialHistory.supportSystem"
            value={formData.socialHistory.supportSystem}
            onChange={handleChange}
            className="form-input-text"
          />
        </div>
        <div className="form-group">
          <label>Employment/Education Status:</label>
          <textarea
            name="socialHistory.employmentStatus"
            value={formData.socialHistory.employmentStatus}
            onChange={handleChange}
            className="form-input-text"
          />
        </div>
        <div className="form-group">
          <label>Hobbies/Interests:</label>
          <textarea
            name="socialHistory.hobbies"
            value={formData.socialHistory.hobbies}
            onChange={handleChange}
            className="form-input-text"
          />
        </div>

        {/* Behavioral Observations */}
        <h3>Behavioral Observations</h3>
        <div className="form-group">
          <label>Appearance (e.g., grooming, hygiene):</label>
          <textarea
            name="behavioralObservations.appearance"
            value={formData.behavioralObservations.appearance}
            onChange={handleChange}
            className="form-input-text"
          />
        </div>
        <div className="form-group">
          <label>Mood/Affect:</label>
          <textarea
            name="behavioralObservations.mood"
            value={formData.behavioralObservations.mood}
            onChange={handleChange}
            className="form-input-text"
          />
        </div>
        <div className="form-group">
          <label>Speech (e.g., rate, volume, tone):</label>
          <textarea
            name="behavioralObservations.speech"
            value={formData.behavioralObservations.speech}
            onChange={handleChange}
            className="form-input-text"
          />
        </div>
        <div className="form-group">
          <label>Thought Process/Content:</label>
          <textarea
            name="behavioralObservations.thoughtProcess"
            value={formData.behavioralObservations.thoughtProcess}
            onChange={handleChange}
            className="form-input-text"
          />
        </div>
        <div className="form-group">
          <label>Orientation (time, place, person):</label>
          <textarea
            name="behavioralObservations.orientation"
            value={formData.behavioralObservations.orientation}
            onChange={handleChange}
            className="form-input-text"
          />
        </div>

        {/* Assessment Tools */}
        <h3>Assessment Tools</h3>
        <div className="form-group">
          <label>Screening Tools Administered:</label>
          <textarea
            name="assessmentTools.tools"
            value={formData.assessmentTools.tools}
            onChange={handleChange}
            className="form-input-text"
          />
        </div>
        <div className="form-group">
          <label>Results:</label>
          <textarea
            name="assessmentTools.results"
            value={formData.assessmentTools.results}
            onChange={handleChange}
            className="form-input-text"
          />
        </div>

        {/* Clinician's Notes */}
        <h3>Clinician’s Notes</h3>
        <div className="form-group">
          <label>Summary of Intake Session:</label>
          <textarea
            name="clinicianNotes.sessionSummary"
            value={formData.clinicianNotes.sessionSummary}
            onChange={handleChange}
            className="form-input-text"
          />
        </div>
        <div className="form-group">
          <label>Initial Impressions:</label>
          <textarea
            name="clinicianNotes.initialImpressions"
            value={formData.clinicianNotes.initialImpressions}
            onChange={handleChange}
            className="form-input-text"
          />
        </div>

        <button type="submit" className="btn primary-btn">Submit</button>
      </form>
    </div>
  );
};

export default MentalHealthIntakeAssessment;
