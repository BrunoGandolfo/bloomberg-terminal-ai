const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
console.log('API URL:', API_BASE_URL);

/**
 * A centralized API call function to interact with the backend.
 * @param {string} endpoint - The API endpoint to call (e.g., '/api/portfolio').
 * @param {string} [method='GET'] - The HTTP method to use.
 * @param {object} [body=null] - The request body for POST/PUT requests.
 * @param {object} [headers={}] - Custom headers to add to the request.
 * @returns {Promise<any>} The JSON response from the API.
 * @throws {Error} Throws an error if the network request fails or the API returns an error status.
 */
export async function apiCall(endpoint, method = 'GET', body = null, headers = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log('Calling:', url);

  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`API Error: ${response.status} ${errorData.message || response.statusText}`);
    }

    if (response.status === 204) {
      return null;
    }

    // Clonar la respuesta para poder leerla y devolverla
    const clonedResponse = response.clone();
    const data = await clonedResponse.json();
    console.log('Response:', data);

    return await response.json();
  } catch (error) {
    console.error('API Call Failed:', error);
    throw error;
  }
} 