# FxE - Developer Documentation

This document provides technical details for developers working on the FxE platform.

## Architecture Overview

FxE follows a client-server architecture:

- **Frontend**: React-based SPA (Single Page Application)
- **Backend**: Node.js REST API with WebSocket support
- **Database**: MongoDB document database

## Frontend Architecture

### Core Libraries
- React (UI library)
- React Router (Navigation)
- Socket.io Client (Real-time communication)
- Framer Motion (Animations)

### State Management
The application uses React Context API for global state management:
- `AuthContext` - Manages user authentication state
- `SocketContext` - Manages WebSocket connections

### Component Structure
- Lazy-loaded components for code splitting
- Protected routes using custom wrappers
- Reusable UI components

### API Communication
API calls are centralized in the `/api` directory using Axios for HTTP requests.

## Backend Architecture

### API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/admin/login` - Admin login

#### Projects
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get specific project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

#### Profiles
- `GET /api/profile` - Get current user profile
- `POST /api/profile` - Create/update user profile
- `GET /api/profile/:id` - Get specific user profile

#### Admin
- `GET /api/admin/users` - Get all users (admin only)
- `GET /api/admin/projects` - Get all projects (admin only)

### Database Models

#### User Model
```javascript
{
  email: String (required, unique),
  password: String (required, hashed),
  name: String,
  isAdmin: Boolean (default: false),
  createdAt: Date
}
```

#### Profile Model
```javascript
{
  userId: ObjectId (reference to User),
  bio: String,
  skills: [String],
  education: [Object],
  experience: [Object],
  social: {
    github: String,
    linkedin: String,
    twitter: String,
    website: String
  }
}
```

#### Project Model
```javascript
{
  userId: ObjectId (reference to User),
  title: String (required),
  description: String (required),
  screenshots: [String],
  liveLink: String,
  videoLink: String,
  createdAt: Date
}
```

### Authentication Flow
1. User submits credentials
2. Server validates credentials
3. Server generates JWT token
4. Client stores token in localStorage
5. Token is sent with subsequent requests via Authorization header

### WebSocket Implementation
- Socket.io is used for real-time communication
- Chat messages are sent and received through socket events
- Online status updates use socket connections

## Development Guidelines

### Code Style
- Use ES6+ features
- Follow React Hooks patterns
- Use async/await for asynchronous operations

### Git Workflow
1. Create feature branches from main
2. Use descriptive commit messages
3. Submit pull requests for review
4. Squash commits when merging

### Testing
- Write unit tests for critical components and API endpoints
- Test real-time functionality manually

## Environment Setup

### Required Environment Variables

#### Backend (.env)
```
MONGODB_URI=mongodb://localhost:27017/fxe
JWT_SECRET=your_secret_key
PORT=5000
NODE_ENV=development
```

#### Frontend (.env)
```
VITE_API_URL=http://localhost:5000
```

### Development Commands

#### Backend
```
npm run dev    # Start server with nodemon
npm start      # Start server
npm test       # Run tests
```

#### Frontend
```
npm run dev    # Start development server
npm run build  # Build for production
npm run preview # Preview production build
```

## Deployment

### Backend Deployment
1. Set up MongoDB Atlas cluster
2. Configure environment variables in deployment platform
3. Deploy Node.js application

### Frontend Deployment
1. Build React application (`npm run build`)
2. Deploy static files to hosting service (Netlify, Vercel, etc.)
3. Configure environment variables in deployment platform

## Troubleshooting

### Common Issues
- CORS errors: Ensure backend has proper CORS configuration
- Authentication issues: Check JWT token expiration and validation
- Socket connection problems: Verify socket server URL and connection event handlers

## Future Development

### Planned Features
- Enhanced notification system
- Project collaboration tools
- Advanced search and filtering
- Mobile application 