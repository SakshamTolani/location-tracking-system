# Location Tracking System

A comprehensive system for real-time GPS location tracking with user authentication and admin monitoring capabilities.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [Architecture](#architecture)
- [API Documentation](#api-documentation)
- [Postman Testing](#postman-testing)
- [License](#license)

## Overview

This location tracking system enables users to register, log in, and track their GPS coordinates in real-time. It includes an administrative interface for user monitoring and detailed location history viewing.

## Features

- User registration and login
- Real-time GPS location tracking
- Admin interface for user monitoring
- Detailed location history viewing
- WebSocket server for real-time updates
- REST API for user and admin operations
- Redis for caching and session management

## Installation

1. Clone the repository:
```bash
git clone https://github.com/SakshamTolani/location-tracking-system.git
cd location-tracking-system
```

2. Install dependencies:
```bash
npm install
cd client
npm install
cd ..
```

## Environment Setup

Create a `.env` file in the root directory and add the following environment variables:

```env
# Server
NODE_ENV=development
PORT=3000

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=location_tracker
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=location_tracker
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# JWT
JWT_SECRET=your_jwt_secret

# Google Maps
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Database Setup

1. Start PostgreSQL and Redis:
```bash
sudo service postgresql start
sudo service redis-server start
```

2. Create the database and tables:
```bash
npm run db:setup
```

## Running the Application

1. Start the backend server:
```bash
npm run dev
```

2. Start the frontend development server:
```bash
cd client
npm start
```

## Testing

Run the load test using Artillery:
```bash
artillery run location-test.yml
```

## Architecture

The system is divided into two main parts: the frontend and the backend.

### Frontend

The frontend is built with React and includes the following components:

- `Login`: User login form
- `Dashboard`: User dashboard with location tracking
- `LocationMap`: Map displaying the user's location and path
- `AdminDashboard`: Admin interface to monitor users
- `UserLocationLogs`: Admin interface to view user location logs

### Backend

The backend is built with Node.js, Express, and PostgreSQL. It includes the following features:

- User authentication with JWT
- WebSocket server for real-time location tracking
- REST API for user and admin operations
- Redis for caching and session management

## API Documentation

### User Routes

#### POST /api/users/register
- Request body: 
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
- Response: 
```json
{
  "id": 1,
  "email": "user@example.com"
}
```

#### POST /api/users/login
- Request body: 
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
- Response: 
```json
{
  "token": "jwt_token",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "user"
  }
}
```

#### GET /api/users/profile
- Headers: `Authorization: Bearer jwt_token`
- Response: 
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "user"
  },
  "locations": [...]
}
```

#### GET /api/users/locations
- Headers: `Authorization: Bearer jwt_token`
- Response: 
```json
[
  {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "accuracy": 10,
    "timestamp": "2024-12-30T10:03:00.257Z"
  }
]
```

### Admin Routes

#### GET /api/admin/users
- Headers: `Authorization: Bearer jwt_token`
- Response: 
```json
{
  "users": [
    {
      "id": 1,
      "email": "user@example.com",
      "role": "user",
      "created_at": "2024-12-30T10:03:00.257Z"
    }
  ],
  "total": 100,
  "page": 1,
  "pages": 10
}
```

#### GET /api/admin/users/:userId/locations
- Headers: `Authorization: Bearer jwt_token`
- Response: 
```json
[
  {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "timestamp": "2024-12-30T10:03:00.257Z"
  }
]
```

#### GET /api/admin/metrics
- Headers: `Authorization: Bearer jwt_token`
- Response: 
```json
{
  "activeUsers": 10,
  "totalLocations": 1000,
  "timestamp": "2024-12-30T10:03:00.257Z"
}
```

## Postman Testing

To test the location tracking functionality using Postman:

1. Register a new user:
   - URL: `POST http://localhost:3000/api/users/register`
   - Body: 
   ```json
   {
     "email": "user@example.com",
     "password": "password123"
   }
   ```

2. Log in the user:
   - URL: `POST http://localhost:3000/api/users/login`
   - Body: 
   ```json
   {
     "email": "user@example.com",
     "password": "password123"
   }
   ```
   - Save the `token` from the response.

3. Track the user's GPS location and send a ping to the server every 4 seconds:
   - URL: `ws://localhost:3000?token=YOUR_JWT_TOKEN`
   - Use a WebSocket client (e.g., Postman or a browser extension) to connect.
   - Send location updates every 4 seconds:
   ```json
   {
     "latitude": 37.7749,
     "longitude": -122.4194,
     "accuracy": 10,
     "timestamp": "2024-12-30T10:03:00.257Z"
   }
   ```

## License

This project is licensed under the MIT License.