const mongoose = require('mongoose');

const intakeFormSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
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