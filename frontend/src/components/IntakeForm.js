// src/pages/IntakeForm.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useParams } from 'react-router-dom';

const IntakeForm = () => {
  const { clientId } = useParams(); // Get the client ID from the route
  const { user } = useAuth(); // Access the current user from AuthContext

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
      // Handle success (e.g., redirect or show a success message)
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
          <input type="text" name="gender" value={formData.gender} onChange={handleChange} required />
        </label>
        <label>Address:
          <input type="text" name="address" value={formData.address} onChange={handleChange} required />
        </label>
        <label>City, State, Zip Code:
          <input type="text" name="city" value={formData.city} onChange={handleChange} required />
          <input type="text" name="state" value={formData.state} onChange={handleChange} required />
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

        {/* Add additional parts of the form here... */}
        
        <button type="submit" className="btn primary-btn">Submit</button>
      </form>
    </div>
  );
};

export default IntakeForm;