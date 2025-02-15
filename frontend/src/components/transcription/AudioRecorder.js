// src/components/transcription/AudioRecorder.js

import { useState, useEffect, useCallback } from 'react';

export const useAudioRecorder = () => {
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);

  // Initialize the media recorder with proper error handling
  const initializeRecorder = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks(chunks => [...chunks, event.data]);
        }
      };

      setMediaRecorder(recorder);
      setError(null);
    } catch (err) {
      setError('Failed to access microphone. Please check permissions.');
      console.error('Microphone access error:', err);
    }
  }, []);

  // Start recording function with proper cleanup
  const startRecording = useCallback(async () => {
    if (!mediaRecorder) {
      await initializeRecorder();
    }

    try {
      setAudioChunks([]);
      mediaRecorder?.start(1000); // Collect chunks every second
      setIsRecording(true);
    } catch (err) {
      setError('Failed to start recording');
      console.error('Recording start error:', err);
    }
  }, [mediaRecorder, initializeRecorder]);

  // Stop recording and clean up resources
  const stopRecording = useCallback(() => {
    try {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
      }
    } catch (err) {
      setError('Failed to stop recording');
      console.error('Recording stop error:', err);
    }
  }, [mediaRecorder]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (mediaRecorder) {
        stopRecording();
      }
    };
  }, [mediaRecorder, stopRecording]);

  return {
    isRecording,
    error,
    audioChunks,
    startRecording,
    stopRecording
  };
};