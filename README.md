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
- [License](#license)

## Overview

This location tracking system enables users to register, log in, and track their GPS coordinates in real-time. It includes an administrative interface for user monitoring and detailed location history viewing.

## Features

- User authentication and authorization
- Real-time GPS location tracking
- Interactive map visualization
- Administrative dashboard
- Location history logging
- WebSocket support for live updates
- Redis caching
- Comprehensive API

## Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/location-tracking-system.git
cd location-tracking-system
```

2. Install server dependencies:
```bash
npm install
```

3. Install client dependencies:
```bash
cd client
npm install
cd ..
```

## Environment Setup

Create a `.env` file in the root directory with the following configurations:

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

1. Start required services:
```bash
sudo service postgresql start
sudo service redis-server start
```

2. Initialize database:
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

Execute load tests using Artillery:
```bash
artillery run location-test.yml
```

## Architecture

### Frontend Components

- **Login**: User authentication interface
- **Dashboard**: Main user interface for location tracking
- **LocationMap**: Interactive map component
- **AdminDashboard**: User monitoring interface
- **UserLocationLogs**: Location history viewer

### Backend Structure

- Node.js with Express
- PostgreSQL database
- WebSocket server for real-time updates
- Redis for caching and sessions
- JWT authentication

## API Documentation

### User Endpoints

#### Authentication

##### Register User
- **POST** `/api/users/register`
- **Body**: 
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
- **Response**: 
```json
{
  "id": 1,
  "email": "user@example.com"
}
```

##### Login
- **POST** `/api/users/login`
- **Body**: 
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
- **Response**: 
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

#### Location Management

##### Get User Profile
- **GET** `/api/users/profile`
- **Headers**: `Authorization: Bearer jwt_token`
- **Response**: User profile with location history

##### Get Location History
- **GET** `/api/users/locations`
- **Headers**: `Authorization: Bearer jwt_token`
- **Response**: Array of location records

##### Store Location
- **POST** `/api/users/locations`
- **Headers**: `Authorization: Bearer jwt_token`
- **Body**:
```json
{
  "latitude": 37.7749,
  "longitude": -122.4194,
  "accuracy": 10,
  "timestamp": "2024-12-30T10:03:00.257Z"
}
```

##### Clean Test Data
- **POST** `/api/users/cleanup`
- **Headers**: `Authorization: Bearer jwt_token`
- **Body**:
```json
{
  "emails": ["user@example.com"],
  "locationIds": [1, 2, 3]
}
```

### Admin Endpoints

##### List Users
- **GET** `/api/admin/users`
- **Headers**: `Authorization: Bearer jwt_token`
- **Response**: Paginated user list

##### User Location History
- **GET** `/api/admin/users/:userId/locations`
- **Headers**: `Authorization: Bearer jwt_token`
- **Response**: User's complete location history

##### System Metrics
- **GET** `/api/admin/metrics`
- **Headers**: `Authorization: Bearer jwt_token`
- **Response**: 
```json
{
  "activeUsers": 10,
  "totalLocations": 1000,
  "timestamp": "2024-12-30T10:03:00.257Z"
}
```

## License

This project is licensed under the MIT License.