# License Server

A simple license server implementation with Node.js and Express.

## Overview

This project provides a simple license server implementation that allows clients to register, authenticate, generate and activate license keys. The server uses JWT (JSON Web Tokens) to manage user sessions and protect routes that require authentication.

The server also includes an admin API that allows admin users to generate and manage license keys, and fetch information about registered users.

# Note

YOU NEED A SSL CETIFICATE TO USE THIS.

## Getting started

To get started, clone the repository and install the dependencies:

```
git clone https://github.com/CitroenGames/License-Manager/License-Manager.git
cd License-Manager
npm install
```

Then, generate a secret key for the server by running:

```
node keygen.js
```

This will generate a random secret key and save it to a `.env` file.

Next, start the server:

```
npm start
```

This will start the server on port 1337 by default. You can configure the port and SSL settings by editing the `config.json` file.

To test the server, you can use the `client_example.js` file in the `Example` directory. This script attempts to log in with a test user, registers a new user if the test user is not found, and then generates and activates a license key for the test user. The script also logs in as an admin and fetches information about registered users.

To run the example script, edit the `example.json` file in the `Example` directory to set the `serverUrl` to the URL of your server, and then run:

```
node Example/client_example.js
```

## API

The license server API consists of the following endpoints:

### POST /register

Registers a new user with the provided username and password.

#### Request body

```
{
  "username": string,
  "password": string
}
```

#### Response body

```
{
  "message": "User registered successfully"
}
```

### POST /login

Logs in a user with the provided username and password. Returns a JWT token that can be used to authenticate subsequent requests.

#### Request body

```
{
  "username": string,
  "password": string
}
```

#### Response body

```
{
  "message": "Login successful",
  "token": string
}
```

### POST /authenticate

Authenticates a user with a JWT token.

#### Request body

```
{
  "token": string
}
```

#### Response body

```
{
  "message": "Authentication successful"
}
```

### POST /admin/generate

Generates a new license key with the provided duration (in days). Only accessible to users with admin privileges (i.e., users with an admin role).

#### Request body

```
{
  "duration": number
}
```

#### Response body

```
{
  "message": "License key generated successfully",
  "key": string
}
```

### POST /activate

Activates a license key with the provided key value and user token.

#### Request body

```
{
  "key": string,
  "token": string
}
```

#### Response body

```
{
  "message": "License key activated successfully"
}
```

### GET /admin/users

Fetches information about all registered users. Only accessible to users with admin privileges (i.e., users with an admin role).

#### Response body

```
{
  "users": [
    {
      "id": string,
      "username": string,
      "role": string
    },
    ...
  ]
}
```

## License

This project is licensed under the MIT License. See the `LICENSE` file for details
