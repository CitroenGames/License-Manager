const axios = require('axios');
const fs = require('fs');
const https = require('https');
const exampleConfig = require('./example.json');

const instance = axios.create({
  baseURL: exampleConfig.serverUrl,
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
});

(async () => {
  try {
    const credentials = {
      username: 'testuser',
      password: 'testpassword',
    };

    // Attempt to log in with provided credentials
    let loginResponse;
    try {
      loginResponse = await instance.post('/login', credentials);
      console.log('Login response:', loginResponse.data);
    } catch (error) {
      // If the user is not found, register a new user with the provided credentials
      if (error.response && error.response.data.message === 'User not found') {
        console.log('User not found, attempting to register...');
        const registerResponse = await instance.post('/register', credentials);
        console.log('Register response:', registerResponse.data);

        // Log in the new user
        loginResponse = await instance.post('/login', credentials);
        console.log('Login response:', loginResponse.data);
      } else {
        throw error;
      }
    }

    const userToken = loginResponse.data.token;

    // Authenticate the user
    try {
      const authResponse = await instance.post('/authenticate', { token: userToken });
      console.log('Authenticate response:', authResponse.data);
    } catch (error) {
      console.log(error);
    }

    // Log in as an admin
    try {
      const adminLoginResponse = await instance.post('/login', {
        username: 'admin1',
        password: 'password1',
      });
      console.log('Admin login response:', adminLoginResponse.data);
      const adminToken = adminLoginResponse.data.token;

      // Generate a license key as an admin
      const generateKeyResponse = await instance.post('/admin/generate', { duration: 30 }, { headers: { Authorization: adminToken } });
      console.log('Generate key response:', generateKeyResponse.data);

      // Activate a license key as a user
      const activateResponse = await instance.post('/activate', {
        key: generateKeyResponse.data.key,
        token: userToken,
      });
      console.log('Activate response:', activateResponse.data);

      // Fetch all users as an admin
      const usersResponse = await instance.get('/admin/users', { headers: { Authorization: adminToken } });
      console.log('Users response:', usersResponse.data);
    } catch (error) {
      console.log(error);
    }
  } catch (error) {
    if (error.response) {
      console.error('Error:', error.response.data.message);
    } else {
      console.error('Error:', error.message);
    }
  }
})();
