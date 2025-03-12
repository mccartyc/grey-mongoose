import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { createApiInstance } from '../utils/apiConfig';

export const useSession = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const createSession = async (sessionData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(
        '/api/sessions',
        {
          ...sessionData,
          tenantId: user.tenantId,
          userId: user.userId,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create session');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const startTranscript = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(
        '/api/sessions/start-transcript',
        {},
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start transcription');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const stopTranscript = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(
        '/api/sessions/stop-transcript',
        {},
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to stop transcription');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createSession,
    startTranscript,
    stopTranscript,
    isLoading,
    error,
  };
};
