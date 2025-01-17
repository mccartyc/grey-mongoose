// src/pages/IntakeForm.js
import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
// import ClientNavBar from './ClientNavBar';

const IntakeForm = () => {
  const { clientId } = useParams(); // Get the client ID from the route
  const { user } = useAuth(); // Access the current user from AuthContext
  const navigate = useNavigate(); // Use navigate hook

  const [formData, setFormData] = useState({
    // fullName: '',
    // dateOfBirth: '',
    // gender: '',
    // preferredPronouns: '',
    // address: '',
    // city: '',
    // state: '',
    // zipCode: '',
    // phoneNumber: '',
    // emailAddress: '',
    // emergencyContactName: '',
    // emergencyContactPhone: '',
    referralInfo: { source: '', referralName: '' },
    presentingConcerns: { concerns: '', startDate: '', dailyImpact: '' },
    mentalHealthHistory: { previousTreatment: '', previousDiagnoses: '', hospitalizationHistory: '' },
    medicalHistory: { currentConditions: '', currentMedications: '', allergies: '' },
    familyAndSocialHistory: { familyMentalHealthHistory: '', livingSituation: '', employmentStatus: '' },
    substanceUse: { substances: '' },
    mentalHealthAssessments: { moodRating: '', symptoms: [] },
    treatmentGoals: '',
    additionalInformation: '',
    consent: false,
    clientSignature: '',
    therapistSignature: '',
  });

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
        { ...formData, clientId }, // Include the clientId in the request body
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      console.log("Intake form submitted:", response.data);
      // Navigate to a confirmation page or back to client detail
      navigate(`/clients/${clientId}`);
    } catch (error) {
      console.error('Error submitting intake form:', error);
      // Handle error (e.g., show an error message)
    }
  };

  return (
    <div className="intake-form">
    
      <h1>Mental Health Intake Form</h1>
      <form onSubmit={handleSubmit}>
        

      <h3>Part 1: Referral Information</h3>
      <div className="form-group">
        <label className="form-label">How did you hear about our services?</label>
        <select
          name="referralInfo.source"
          value={formData.referralInfo.source}
          onChange={handleChange}
          className="form-input-dropdown"
          required
        >
          <option value="">--</option>
          <option value="Referral">Referral</option>
          <option value="Internet Search">Internet Search</option>
          <option value="Social Media">Social Media</option>
          <option value="Other">Other (Please specify)</option>
        </select>
        <input
          type="text"
          name="referralInfo.referralName"
          value={formData.referralInfo.referralName}
          onChange={handleChange}
          className="form-input-text"
          placeholder="Name (if applicable)"
        />
      </div>

      <h3>Part 2: Presenting Concerns</h3>
      <div className="form-group">
        <label className="form-label">
          What brings you in today? (Briefly describe your current concerns or symptoms.)
        </label>
        <textarea
          name="presentingConcerns.concerns"
          value={formData.presentingConcerns.concerns}
          onChange={handleChange}
          className="form-input-text"
          required
        />
      </div>
      <div className="form-group">
        <label className="form-label">When did these concerns begin?</label>
        <input
          type="text"
          name="presentingConcerns.startDate"
          value={formData.presentingConcerns.startDate}
          onChange={handleChange}
          className="form-input-text"
        />
      </div>
      <div className="form-group">
        <label className="form-label">
          How have these concerns affected your daily life? (e.g., work, relationships, self-care)
        </label>
        <textarea
          name="presentingConcerns.dailyImpact"
          value={formData.presentingConcerns.dailyImpact}
          onChange={handleChange}
          className="form-input-text"
        />
      </div>

        <h3>Part 3: Mental Health History</h3>
        <div className="form-group">
        <label className="form-label">Have you previously received mental health treatment?</label>
          <select className="form-input-dropdown" name="mentalHealthHistory.previousTreatment" value={formData.mentalHealthHistory.previousTreatment} onChange={handleChange}>
            <option value="">--</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
          <textarea className="form-input-text" name="mentalHealthHistory.previousTreatmentDetails" value={formData.mentalHealthHistory.previousTreatmentDetails} onChange={handleChange} placeholder="Details (if yes)" />
        </div>

        <div className="form-group">
        <label className="form-label">Any previous diagnoses? (List any mental health diagnoses you have received.)</label>
          <textarea className="form-input-text" name="mentalHealthHistory.previousDiagnoses" value={formData.mentalHealthHistory.previousDiagnoses} onChange={handleChange} />

        <label className="form-label">Have you ever been hospitalized for mental health issues?</label>
          <select className="form-input-dropdown" name="mentalHealthHistory.hospitalizationHistory" value={formData.mentalHealthHistory.hospitalizationHistory} onChange={handleChange}>
            <option value="">--</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
          <textarea className="form-input-text" name="mentalHealthHistory.hospitalizationDetails" value={formData.mentalHealthHistory.hospitalizationDetails} onChange={handleChange} placeholder="Details (if yes)" />
        
        </div>

        <h3>Part 4: Medical History</h3>
        <div className="form-group">
        <label  className="form-label">Do you have any current medical conditions?</label>
          <select className="form-input-dropdown" name="medicalHistory.currentConditions" value={formData.medicalHistory.currentConditions} onChange={handleChange}>
            <option value="">--</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
          <textarea name="medicalHistory.currentConditionsDetails" value={formData.medicalHistory.currentConditionsDetails} onChange={handleChange} placeholder="List conditions (if yes)" />
        </div>

        <div className="form-group">
        <label className="form-label">Are you currently taking any medications?</label>
          <select className="form-input-dropdown" name="medicalHistory.currentMedications" value={formData.medicalHistory.currentMedications} onChange={handleChange}>
            <option value="">--</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
          <textarea name="medicalHistory.medicationsDetails" value={formData.medicalHistory.medicationsDetails} onChange={handleChange} placeholder="List medications (if yes)" />
        </div>

        <div className="form-group">
        <label className="form-label">Do you have any allergies?</label>
          <select className="form-input-dropdown" name="medicalHistory.allergies" value={formData.medicalHistory.allergies} onChange={handleChange}>
            <option value="">--</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
          <textarea name="medicalHistory.allergiesDetails" value={formData.medicalHistory.allergiesDetails} onChange={handleChange} placeholder="List allergies (if yes)" />
        </div>

        <h3>Part 5: Family and Social History</h3>
        <div className="form-group">
        <label className="form-label">Family History of Mental Health Issues:</label>
          <textarea name="familyAndSocialHistory.familyMentalHealthHistory" value={formData.familyAndSocialHistory.familyMentalHealthHistory} onChange={handleChange} />
    
        <label className="form-label">Current Living Situation:</label>
          <textarea name="familyAndSocialHistory.livingSituation" value={formData.familyAndSocialHistory.livingSituation} onChange={handleChange} />
        
        <label className="form-label">Employment/School Status:</label>
          <textarea name="familyAndSocialHistory.employmentStatus" value={formData.familyAndSocialHistory.employmentStatus} onChange={handleChange} />
        </div>

        <h3>Part 6: Substance Use</h3>
        <div className="form-group">
        <label className="form-label">Do you use any substances? (e.g., alcohol, tobacco, recreational drugs)</label>
          <select className="form-input-dropdown" name="substanceUse.substances" value={formData.substanceUse.substances} onChange={handleChange}>
          <option value="">--</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
          <textarea name="substanceUse.substancesDetails" value={formData.substanceUse.substancesDetails} onChange={handleChange} placeholder="Specify substance, frequency, and amount" />
        </div>

        <h3>Part 7: Mental Health Assessments</h3>
        <div className="form-group">
        <label className="form-label">How would you rate your mood over the past week?</label>
          <select className="form-input-dropdown" name="mentalHealthAssessments.moodRating" value={formData.mentalHealthAssessments.moodRating} onChange={handleChange}>
            <option value="">--</option>
            <option value="Very Poor">Very Poor</option>
            <option value="Poor">Poor</option>
            <option value="Fair">Fair</option>
            <option value="Good">Good</option>
            <option value="Very Good">Very Good</option>
          </select>
        </div>

        <div className="form-group">
        <label className="form-label">Do you experience any of the following?</label>
          <textarea name="mentalHealthAssessments.symptoms" value={formData.mentalHealthAssessments.symptoms} onChange={handleChange} placeholder="List any symptoms" />
        </div>

        <h3>Part 8: Goals for Treatment</h3>
        <div className="form-group">
        <label className="form-label">What are your goals for therapy? (What do you hope to achieve through treatment?)</label>
          <textarea name="treatmentGoals" value={formData.treatmentGoals} onChange={handleChange} />
        </div>

        <h3>Part 9: Additional Information</h3>
        <div className="form-group">
        <label className="form-label">Is there anything else you would like us to know?</label>
          <textarea name="additionalInformation" value={formData.additionalInformation} onChange={handleChange} />
        </div>

        <h3>Consent and Confidentiality</h3>
        <div className="form-group">
        <label className="form-label">
        <input
            type="checkbox"
            name="consent"
            checked={formData.consent}
            onChange={(e) =>
              setFormData((prevData) => ({
                ...prevData,
                consent: e.target.checked, // Update consent based on checkbox state
              }))
            }
            className="form-input-checkbox"
          />
          I understand the nature of the intake process and consent to the collection of this information.
        </label>
        </div>
      
        <br />


        <button type="submit" className="btn primary-btn">Submit</button>
      </form>
    </div>
  );
};

export default IntakeForm;
