// src/components/transcription/SecureTranscriptionService.js

import { useState, useEffect } from 'react';
import { useAudioRecorder } from './AudioRecorder';
import { TranscriptionAPI } from '../../utils/apiClient';
import { EncryptionService } from '../../utils/encryption';

export const useSecureTranscription = (onTranscriptionUpdate) => {
  const [transcriptionInProgress, setTranscriptionInProgress] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);

  const {
    isRecording,
    error: recordingError,
    audioChunks,
    startRecording,
    stopRecording
  } = useAudioRecorder();

  const transcriptionAPI = new TranscriptionAPI(
    process.env.REACT_APP_ANTHROPIC_API_KEY,
    process.env.REACT_APP_ENCRYPTION_KEY
  );

  // Process audio chunks and get transcription
  const processAudioChunks = async (chunks) => {
    try {
      // Convert audio chunks to base64
      const blob = new Blob(chunks, { type: 'audio/webm;codecs=opus' });
      const buffer = await blob.arrayBuffer();
      const base64Audio = btoa(
        new Uint8Array(buffer)
          .reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      // Send for transcription
      const transcription = await transcriptionAPI.sendAudioForTranscription(base64Audio);
      
      // Update transcripts
      setFinalTranscript(current => `${current} ${transcription}`.trim());
      onTranscriptionUpdate?.(transcription);
      
    } catch (err) {
      setError('Transcription failed: ' + err.message);
      console.error('Transcription error:', err);
    }
  };

  // Handle start/stop transcription
  const handleStartStopTranscription = async () => {
    if (isRecording) {
      stopRecording();
      setTranscriptionInProgress(false);
      setFinalTranscript(current => 
        `${current}\n[Transcript stopped at ${new Date().toLocaleString()}]\n`
      );
    } else {
      const confirmStart = window.confirm('Do you want to start recording your notes?');
      if (confirmStart) {
        try {
          await startRecording();
          setTranscriptionInProgress(true);
          setError(null);
          setFinalTranscript(current => 
            `${current}\n[Transcript started at ${new Date().toLocaleString()}]\n`
          );
        } catch (err) {
          setError('Failed to start transcription: ' + err.message);
        }
      }
    }
  };

  // Process audio chunks when they're available
  useEffect(() => {
    if (audioChunks.length > 0 && !isRecording) {
      processAudioChunks(audioChunks);
    }
  }, [audioChunks, isRecording]);

  // Handle recording errors
  useEffect(() => {
    if (recordingError) {
      setError(recordingError);
      setTranscriptionInProgress(false);
    }
  }, [recordingError]);

  return {
    isRecording,
    transcriptionInProgress,
    finalTranscript,
    interimTranscript,
    error,
    handleStartStopTranscription
  };
};