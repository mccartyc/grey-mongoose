const mongoose = require('mongoose');

const intakeFormSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client', // Assuming you have a Client model
    required: true,
  },
  fullName: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, required: true },
  preferredPronouns: { type: String },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  emailAddress: { type: String, required: true },
  emergencyContactName: { type: String, required: true },
  emergencyContactPhone: { type: String, required: true },
  referralInfo: {
    source: { type: String, required: true },
    referralName: { type: String },
  },
  presentingConcerns: {
    concerns: { type: String, required: true },
    startDate: { type: String },
    dailyImpact: { type: String },
  },
  mentalHealthHistory: {
    previousTreatment: { type: String },
    previousDiagnoses: { type: String },
    hospitalizationHistory: { type: String },
  },
  medicalHistory: {
    currentConditions: { type: String },
    currentMedications: { type: String },
    allergies: { type: String },
  },
  familyAndSocialHistory: {
    familyMentalHealthHistory: { type: String },
    livingSituation: { type: String },
    employmentStatus: { type: String },
  },
  substanceUse: {
    substances: { type: String },
  },
  mentalHealthAssessments: {
    moodRating: { type: String },
    symptoms: [{ type: String }],
  },
  treatmentGoals: { type: String },
  additionalInformation: { type: String },
  consent: { type: Boolean, required: true },
  clientSignature: { type: String },
  therapistSignature: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const IntakeForm = mongoose.model('IntakeForm', intakeFormSchema);
module.exports = IntakeForm;