const API_URL = 'https://api.example.com/user'; // Replace with your API URL

export const fetchUserData = async (token) => {
  try {
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
};
