// src/utils/apiClient.js

import axios from 'axios';
import { EncryptionService } from './encryption';

export class TranscriptionAPI {
  constructor(apiKey, encryptionKey) {
    this.apiKey = apiKey;
    this.encryptionService = new EncryptionService(encryptionKey);
    this.axiosInstance = axios.create({
      baseURL: process.env.REACT_APP_API_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });
  }

  // Sends encrypted audio data to the backend for transcription
  async sendAudioForTranscription(audioData) {
    try {
      // Encrypt the audio data before sending
      const encryptedData = this.encryptionService.encrypt(audioData);
      
      const response = await this.axiosInstance.post('/api/transcribe', {
        audio: encryptedData,
        timestamp: new Date().toISOString()
      });

      // Decrypt the response
      if (response.data && response.data.text) {
        return this.encryptionService.decrypt(response.data.text);
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Transcription request failed:', error);
      throw error;
    }
  }
}