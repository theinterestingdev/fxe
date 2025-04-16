# FxE - Freelance Exchange Platform

## Project Overview

FxE (Freelance Exchange) is a web-based platform designed to connect freelance developers with potential clients and create a community for networking, collaboration, and project showcase. The application features project sharing, community interaction through real-time chat, and user profiles.

## Tech Stack

### Frontend
- React.js with React Router for navigation
- Framer Motion for animations
- Socket.io client for real-time communication
- CSS for styling

### Backend
- Node.js with Express
- MongoDB with Mongoose for database operations
- Socket.io for real-time chat functionality
- JWT for authentication

## Features

### User Authentication
- Sign up / Sign in functionality
- JWT-based authentication
- Admin authentication

### User Profiles
- Profile setup and customization
- Profile viewing

### Projects
- Project showcase
- Project uploads with screenshots, descriptions, and links
- Browse other users' projects

### Community
- Real-time chat functionality
- Direct messaging between users
- Community forum

### Dashboard
- User dashboard with personalized information
- Admin dashboard for platform management

## Project Structure

### Frontend (/client)
```
/src
  /api - API communication with backend
  /assets - Static assets like images
  /components - React components
  /hooks - Custom React hooks
  /utils - Utility functions
  App.jsx - Main application component
  main.jsx - Entry point
```

### Backend (/backend)
```
/config - Database configuration
/controllers - Request handlers
/middleware - Express middleware
/models - Mongoose schemas
/routes - API routes
/socketHandlers - Socket.io event handlers
app.js - Express application setup
server.js - Main server entry point
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Backend Setup
1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   PORT=5000
   ```

4. Start the backend server:
   ```
   npm start
   ```

### Frontend Setup
1. Navigate to the client directory:
   ```
   cd client
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   VITE_API_URL=http://localhost:5000
   ```

4. Start the frontend development server:
   ```
   npm run dev
   ```

## Usage

1. Register a new account on the sign-up page
2. Set up your profile
3. Browse projects and community features
4. Upload your own projects to showcase
5. Interact with other users through the community chat

## Contributors

- [Add contributor names here]

## License

[Choose and add an appropriate license]