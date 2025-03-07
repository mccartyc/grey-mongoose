/**
 * Test script to fill out and submit the intake form for a specific client
 * 
 * Usage:
 * 1. Make sure the backend server is running
 * 2. Run this script with: node test-intake-form.js
 */

const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:5001/api';
const CLIENT_ID = '679e5b3a0974107dcd8a1e62';

// Replace with valid credentials for your application
const LOGIN_CREDENTIALS = {
  email: 'test@example.com',  // Replace with a valid email
  password: 'password123'     // Replace with a valid password
};

// Sample intake form data
const sampleIntakeFormData = {
  id: CLIENT_ID, // The client ID
  referralInfo: {
    source: 'Internet Search',
    referralName: 'Google Search'
  },
  presentingConcerns: {
    concerns: 'Experiencing anxiety and stress related to work and personal life.',
    startDate: '2024-12-01',
    dailyImpact: 'Difficulty sleeping, reduced productivity, and strained relationships.'
  },
  mentalHealthHistory: {
    previousTreatment: 'Brief counseling in 2022 for work-related stress.',
    previousDiagnoses: 'No formal diagnoses.',
    hospitalizationHistory: 'None.'
  },
  medicalHistory: {
    currentConditions: 'Mild hypertension, managed with lifestyle changes.',
    currentMedications: 'No prescription medications.',
    allergies: 'Seasonal allergies, no medication allergies.'
  },
  familyAndSocialHistory: {
    familyMentalHealthHistory: 'Mother experienced depression, father no known mental health issues.',
    livingSituation: 'Lives with spouse and two children.',
    employmentStatus: 'Full-time employment as a software engineer.'
  },
  substanceUse: {
    substances: 'No',
    substancesDetails: 'Occasional social drinking (1-2 drinks per week).'
  },
  mentalHealthAssessments: {
    moodRating: 'Fair',
    symptoms: 'Occasional insomnia, racing thoughts, irritability, and difficulty concentrating.'
  },
  treatmentGoals: 'Develop better coping mechanisms for stress, improve work-life balance, and enhance communication skills with family members.',
  additionalInformation: 'Interested in both individual and potentially couples therapy in the future.',
  consent: true,
  clientSignature: 'Test Client',
  therapistSignature: ''
};

// Main function to run the test
async function runTest() {
  try {
    console.log('Starting intake form submission test...');
    
    // Step 1: Login to get authentication token
    console.log('Logging in to get authentication token...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, LOGIN_CREDENTIALS);
    const token = loginResponse.data.token;
    
    if (!token) {
      throw new Error('Failed to get authentication token');
    }
    
    console.log('Successfully obtained authentication token');
    
    // Step 2: Submit the intake form
    console.log(`Submitting intake form for client ID: ${CLIENT_ID}...`);
    const intakeResponse = await axios.post(
      `${API_URL}/intake-forms`,
      sampleIntakeFormData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Intake form submission response:', JSON.stringify(intakeResponse.data, null, 2));
    console.log('Intake form submitted successfully!');
    
  } catch (error) {
    console.error('Error during test:');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
  }
}

// Run the test
runTest();
