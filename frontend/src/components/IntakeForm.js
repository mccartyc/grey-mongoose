// src/pages/IntakeForm.js
import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';

const IntakeForm = () => {
  const { clientId } = useParams(); // Get the client ID from the route
  const { user } = useAuth(); // Access the current user from AuthContext
  const navigate = useNavigate(); // Use navigate hook

  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: '',
    preferredPronouns: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phoneNumber: '',
    emailAddress: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
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
        <h3>Client Information:</h3>
        <label>Full Name:
          <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required />
        </label>
        <label>Date of Birth:
          <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required />
        </label>
        <label>Gender:
          <select name="gender" value={formData.gender} onChange={handleChange} required>
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Non-Binary">Non-Binary</option>
            <option value="Other">Other</option>
          </select>
        </label>
        <label>Preferred Pronouns:
          <input type="text" name="preferredPronouns" value={formData.preferredPronouns} onChange={handleChange} />
        </label>
        <label>Address:
          <input type="text" name="address" value={formData.address} onChange={handleChange} required />
        </label>
        <label>City:
          <input type="text" name="city" value={formData.city} onChange={handleChange} required />
        </label>
        <label>State:
          <input type="text" name="state" value={formData.state} onChange={handleChange} required />
        </label>
        <label>Zip Code:
          <input type="text" name="zipCode" value={formData.zipCode} onChange={handleChange} required />
        </label>
        <label>Phone Number:
          <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required />
        </label>
        <label>Email Address:
          <input type="email" name="emailAddress" value={formData.emailAddress} onChange={handleChange} required />
        </label>
        <label>Emergency Contact Name:
          <input type="text" name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} required />
        </label>
        <label>Emergency Contact Phone Number:
          <input type="text" name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleChange} required />
        </label>

        <h3>Part 1: Referral Information</h3>
        <label>How did you hear about our services?
          <select name="referralInfo.source" value={formData.referralInfo.source} onChange={handleChange} required>
            <option value="Referral">Referral</option>
            <option value="Internet Search">Internet Search</option>
            <option value="Social Media">Social Media</option>
            <option value="Other">Other (Please specify)</option>
          </select>
          <input type="text" name="referralInfo.referralName" value={formData.referralInfo.referralName} onChange={handleChange} placeholder="Name (if applicable)" />
        </label>

        <h3>Part 2: Presenting Concerns</h3>
        <label>What brings you in today? (Briefly describe your current concerns or symptoms.)
          <textarea name="presentingConcerns.concerns" value={formData.presentingConcerns.concerns} onChange={handleChange} required />
        </label>
        <label>When did these concerns begin?
          <input type="text" name="presentingConcerns.startDate" value={formData.presentingConcerns.startDate} onChange={handleChange} />
        </label>
        <label>How have these concerns affected your daily life? (e.g., work, relationships, self-care)
          <textarea name="presentingConcerns.dailyImpact" value={formData.presentingConcerns.dailyImpact} onChange={handleChange} />
        </label>

        <h3>Part 3: Mental Health History</h3>
        <label>Have you previously received mental health treatment?
          <select name="mentalHealthHistory.previousTreatment" value={formData.mentalHealthHistory.previousTreatment} onChange={handleChange}>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
          <textarea name="mentalHealthHistory.previousTreatmentDetails" value={formData.mentalHealthHistory.previousTreatmentDetails} onChange={handleChange} placeholder="Details (if yes)" />
        </label>
        <label>Any previous diagnoses? (List any mental health diagnoses you have received.)
          <textarea name="mentalHealthHistory.previousDiagnoses" value={formData.mentalHealthHistory.previousDiagnoses} onChange={handleChange} />
        </label>
        <label>Have you ever been hospitalized for mental health issues?
          <select name="mentalHealthHistory.hospitalizationHistory" value={formData.mentalHealthHistory.hospitalizationHistory} onChange={handleChange}>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
          <textarea name="mentalHealthHistory.hospitalizationDetails" value={formData.mentalHealthHistory.hospitalizationDetails} onChange={handleChange} placeholder="Details (if yes)" />
        </label>

        <h3>Part 4: Medical History</h3>
        <label>Do you have any current medical conditions?
          <select name="medicalHistory.currentConditions" value={formData.medicalHistory.currentConditions} onChange={handleChange}>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
          <textarea name="medicalHistory.currentConditionsDetails" value={formData.medicalHistory.currentConditionsDetails} onChange={handleChange} placeholder="List conditions (if yes)" />
        </label>
        <label>Are you currently taking any medications?
          <select name="medicalHistory.currentMedications" value={formData.medicalHistory.currentMedications} onChange={handleChange}>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
          <textarea name="medicalHistory.medicationsDetails" value={formData.medicalHistory.medicationsDetails} onChange={handleChange} placeholder="List medications (if yes)" />
        </label>
        <label>Do you have any allergies?
          <select name="medicalHistory.allergies" value={formData.medicalHistory.allergies} onChange={handleChange}>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
          <textarea name="medicalHistory.allergiesDetails" value={formData.medicalHistory.allergiesDetails} onChange={handleChange} placeholder="List allergies (if yes)" />
        </label>

        <h3>Part 5: Family and Social History</h3>
        <label>Family History of Mental Health Issues:
          <textarea name="familyAndSocialHistory.familyMentalHealthHistory" value={formData.familyAndSocialHistory.familyMentalHealthHistory} onChange={handleChange} />
        </label>
        <label>Current Living Situation:
          <textarea name="familyAndSocialHistory.livingSituation" value={formData.familyAndSocialHistory.livingSituation} onChange={handleChange} />
        </label>
        <label>Employment/School Status:
          <textarea name="familyAndSocialHistory.employmentStatus" value={formData.familyAndSocialHistory.employmentStatus} onChange={handleChange} />
        </label>

        <h3>Part 6: Substance Use</h3>
        <label>Do you use any substances? (e.g., alcohol, tobacco, recreational drugs)
          <select name="substanceUse.substances" value={formData.substanceUse.substances} onChange={handleChange}>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
          <textarea name="substanceUse.substancesDetails" value={formData.substanceUse.substancesDetails} onChange={handleChange} placeholder="Specify substance, frequency, and amount" />
        </label>

        <h3>Part 7: Mental Health Assessments</h3>
        <label>How would you rate your mood over the past week?
          <select name="mentalHealthAssessments.moodRating" value={formData.mentalHealthAssessments.moodRating} onChange={handleChange}>
            <option value="Very Poor">Very Poor</option>
            <option value="Poor">Poor</option>
            <option value="Fair">Fair</option>
            <option value="Good">Good</option>
            <option value="Very Good">Very Good</option>
          </select>
        </label>
        <label>Do you experience any of the following?
          <textarea name="mentalHealthAssessments.symptoms" value={formData.mentalHealthAssessments.symptoms} onChange={handleChange} placeholder="List any symptoms" />
        </label>

        <h3>Part 8: Goals for Treatment</h3>
        <label>What are your goals for therapy? (What do you hope to achieve through treatment?)
          <textarea name="treatmentGoals" value={formData.treatmentGoals} onChange={handleChange} />
        </label>

        <h3>Part 9: Additional Information</h3>
        <label>Is there anything else you would like us to know?
          <textarea name="additionalInformation" value={formData.additionalInformation} onChange={handleChange} />
        </label>

        <h3>Consent and Confidentiality</h3>
        <label>I understand the nature of the intake process and consent to the collection of this information.
          <select name="consent" value={formData.consent} onChange={handleChange} required>
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </label>
        
        <div>
          Client Signature: <input type="text" name="clientSignature" value={formData.clientSignature} onChange={handleChange} />
          <br />
          Date: <input type="date" name="date" value={formData.date} onChange={handleChange} />
          <br />
          Therapist Signature: <input type="text" name="therapistSignature" value={formData.therapistSignature} onChange={handleChange} />
          <br />
          Date: <input type="date" name="therapistDate" value={formData.therapistDate} onChange={handleChange} />
        </div>

        <button type="submit" className="btn primary-btn">Submit</button>
      </form>
    </div>
  );
};

export default IntakeForm;
