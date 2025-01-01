// frontend/src/services/eventService.js

const API_URL = 'http://localhost:5000/api/events';

export const getEvents = async () => {
  const response = await fetch(API_URL, {
    headers: { 'Content-Type': 'application/json' }
  });
  return response.json();
};

export const addEvent = async (event) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event)
  });
  return response.json();
};

export const updateEvent = async (id, event) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event)
  });
  return response.json();
};

export const deleteEvent = async (id) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' }
  });
  return response.json();
};
