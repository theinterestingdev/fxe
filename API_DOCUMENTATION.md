# FxE API Documentation

This document details the API endpoints available in the FxE platform.

## Base URL

```
http://localhost:5000/api
```

For production:

```
https://your-production-domain.com/api
```

## Authentication

Most endpoints require authentication using JWT tokens.

### Headers

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## API Endpoints

### Authentication

#### Register a new user

```
POST /auth/register
```

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response (200 OK):**

```json
{
  "token": "JWT_TOKEN",
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### Login

```
POST /auth/login
```

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response (200 OK):**

```json
{
  "token": "JWT_TOKEN",
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### Admin Login

```
POST /auth/admin/login
```

**Request Body:**

```json
{
  "email": "admin@example.com",
  "password": "adminpassword123"
}
```

**Response (200 OK):**

```json
{
  "token": "JWT_TOKEN",
  "user": {
    "_id": "user_id",
    "name": "Admin User",
    "email": "admin@example.com",
    "isAdmin": true
  }
}
```

### User Profile

#### Get Current User Profile

```
GET /profile
```

**Headers:**
- Authorization: Bearer JWT_TOKEN

**Response (200 OK):**

```json
{
  "_id": "profile_id",
  "userId": "user_id",
  "bio": "Full-stack developer with 5 years of experience",
  "skills": ["JavaScript", "React", "Node.js"],
  "education": [
    {
      "school": "University of Technology",
      "degree": "Computer Science",
      "year": "2018"
    }
  ],
  "experience": [
    {
      "company": "Tech Corp",
      "position": "Frontend Developer",
      "from": "2018-01",
      "to": "2021-01",
      "current": false,
      "description": "Developed web applications using React"
    }
  ],
  "social": {
    "github": "https://github.com/johndoe",
    "linkedin": "https://linkedin.com/in/johndoe",
    "twitter": "https://twitter.com/johndoe",
    "website": "https://johndoe.com"
  },
  "updatedAt": "2023-05-15T12:00:00.000Z"
}
```

#### Create or Update Profile

```
POST /profile
```

**Headers:**
- Authorization: Bearer JWT_TOKEN

**Request Body:**

```json
{
  "bio": "Full-stack developer with 5 years of experience",
  "skills": ["JavaScript", "React", "Node.js"],
  "education": [
    {
      "school": "University of Technology",
      "degree": "Computer Science",
      "year": "2018"
    }
  ],
  "experience": [
    {
      "company": "Tech Corp",
      "position": "Frontend Developer",
      "from": "2018-01",
      "to": "2021-01",
      "current": false,
      "description": "Developed web applications using React"
    }
  ],
  "social": {
    "github": "https://github.com/johndoe",
    "linkedin": "https://linkedin.com/in/johndoe",
    "twitter": "https://twitter.com/johndoe",
    "website": "https://johndoe.com"
  }
}
```

**Response (200 OK):**

```json
{
  "_id": "profile_id",
  "userId": "user_id",
  "bio": "Full-stack developer with 5 years of experience",
  "skills": ["JavaScript", "React", "Node.js"],
  "education": [...],
  "experience": [...],
  "social": {...},
  "updatedAt": "2023-05-15T12:00:00.000Z"
}
```

#### Get Profile by ID

```
GET /profile/:id
```

**Headers:**
- Authorization: Bearer JWT_TOKEN

**Response (200 OK):**

```json
{
  "_id": "profile_id",
  "userId": "user_id",
  "bio": "Full-stack developer with 5 years of experience",
  "skills": ["JavaScript", "React", "Node.js"],
  "education": [...],
  "experience": [...],
  "social": {...},
  "updatedAt": "2023-05-15T12:00:00.000Z"
}
```

### Projects

#### Get All Projects

```
GET /projects
```

**Headers:**
- Authorization: Bearer JWT_TOKEN

**Query Parameters:**
- `limit` (optional): Number of projects to return (default: 10)
- `page` (optional): Page number for pagination (default: 1)

**Response (200 OK):**

```json
{
  "projects": [
    {
      "_id": "project_id",
      "userId": {
        "_id": "user_id",
        "name": "John Doe"
      },
      "title": "E-commerce Website",
      "description": "A full-stack e-commerce platform with payment integration",
      "screenshots": ["url1", "url2"],
      "liveLink": "https://example.com",
      "videoLink": "https://youtube.com/watch?v=example",
      "createdAt": "2023-05-15T12:00:00.000Z"
    },
    // More projects...
  ],
  "pagination": {
    "total": 50,
    "pages": 5,
    "currentPage": 1,
    "limit": 10
  }
}
```

#### Create New Project

```
POST /projects
```

**Headers:**
- Authorization: Bearer JWT_TOKEN

**Request Body:**

```json
{
  "title": "E-commerce Website",
  "description": "A full-stack e-commerce platform with payment integration",
  "screenshots": ["url1", "url2"],
  "liveLink": "https://example.com",
  "videoLink": "https://youtube.com/watch?v=example"
}
```

**Response (201 Created):**

```json
{
  "_id": "project_id",
  "userId": "user_id",
  "title": "E-commerce Website",
  "description": "A full-stack e-commerce platform with payment integration",
  "screenshots": ["url1", "url2"],
  "liveLink": "https://example.com",
  "videoLink": "https://youtube.com/watch?v=example",
  "createdAt": "2023-05-15T12:00:00.000Z"
}
```

#### Get Project by ID

```
GET /projects/:id
```

**Headers:**
- Authorization: Bearer JWT_TOKEN

**Response (200 OK):**

```json
{
  "_id": "project_id",
  "userId": {
    "_id": "user_id",
    "name": "John Doe"
  },
  "title": "E-commerce Website",
  "description": "A full-stack e-commerce platform with payment integration",
  "screenshots": ["url1", "url2"],
  "liveLink": "https://example.com",
  "videoLink": "https://youtube.com/watch?v=example",
  "createdAt": "2023-05-15T12:00:00.000Z"
}
```

#### Update Project

```
PUT /projects/:id
```

**Headers:**
- Authorization: Bearer JWT_TOKEN

**Request Body:**

```json
{
  "title": "Updated E-commerce Website",
  "description": "Updated description",
  "screenshots": ["url1", "url2", "url3"],
  "liveLink": "https://updated-example.com",
  "videoLink": "https://youtube.com/watch?v=updated-example"
}
```

**Response (200 OK):**

```json
{
  "_id": "project_id",
  "userId": "user_id",
  "title": "Updated E-commerce Website",
  "description": "Updated description",
  "screenshots": ["url1", "url2", "url3"],
  "liveLink": "https://updated-example.com",
  "videoLink": "https://youtube.com/watch?v=updated-example",
  "createdAt": "2023-05-15T12:00:00.000Z",
  "updatedAt": "2023-05-16T12:00:00.000Z"
}
```

#### Delete Project

```
DELETE /projects/:id
```

**Headers:**
- Authorization: Bearer JWT_TOKEN

**Response (200 OK):**

```json
{
  "message": "Project deleted successfully"
}
```

### Admin Routes

#### Get All Users (Admin Only)

```
GET /admin/users
```

**Headers:**
- Authorization: Bearer ADMIN_JWT_TOKEN

**Response (200 OK):**

```json
{
  "users": [
    {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "isAdmin": false,
      "createdAt": "2023-05-15T12:00:00.000Z"
    },
    // More users...
  ]
}
```

#### Get All Projects (Admin Only)

```
GET /admin/projects
```

**Headers:**
- Authorization: Bearer ADMIN_JWT_TOKEN

**Response (200 OK):**

```json
{
  "projects": [
    {
      "_id": "project_id",
      "userId": {
        "_id": "user_id",
        "name": "John Doe"
      },
      "title": "E-commerce Website",
      "description": "A full-stack e-commerce platform with payment integration",
      "screenshots": ["url1", "url2"],
      "liveLink": "https://example.com",
      "videoLink": "https://youtube.com/watch?v=example",
      "createdAt": "2023-05-15T12:00:00.000Z"
    },
    // More projects...
  ]
}
```

### Notifications

#### Get User Notifications

```
GET /notifications
```

**Headers:**
- Authorization: Bearer JWT_TOKEN

**Response (200 OK):**

```json
{
  "notifications": [
    {
      "_id": "notification_id",
      "userId": "user_id",
      "type": "message",
      "relatedId": "chat_id",
      "content": "You have a new message from Jane Doe",
      "read": false,
      "createdAt": "2023-05-15T12:00:00.000Z"
    },
    // More notifications...
  ]
}
```

#### Mark Notification as Read

```
PUT /notifications/:id/read
```

**Headers:**
- Authorization: Bearer JWT_TOKEN

**Response (200 OK):**

```json
{
  "_id": "notification_id",
  "userId": "user_id",
  "type": "message",
  "relatedId": "chat_id",
  "content": "You have a new message from Jane Doe",
  "read": true,
  "createdAt": "2023-05-15T12:00:00.000Z",
  "updatedAt": "2023-05-16T12:00:00.000Z"
}
```

## Error Responses

### 400 Bad Request

```json
{
  "error": "Invalid input data",
  "details": [
    {
      "field": "email",
      "message": "Valid email is required"
    }
  ]
}
```

### 401 Unauthorized

```json
{
  "error": "Unauthorized access",
  "message": "Invalid token or token expired"
}
```

### 403 Forbidden

```json
{
  "error": "Access denied",
  "message": "You do not have permission to access this resource"
}
```

### 404 Not Found

```json
{
  "error": "Resource not found",
  "message": "The requested resource does not exist"
}
```

### 500 Server Error

```json
{
  "error": "Server error",
  "message": "An unexpected error occurred"
}
```

## WebSocket Events

The FxE platform uses Socket.io for real-time communication. Here are the important socket events:

### Connection

```javascript
// Client-side
const socket = io('http://localhost:5000', {
  auth: {
    token: 'JWT_TOKEN'
  }
});
```

### Chat Events

#### Join Chat

```javascript
// Client emits
socket.emit('joinChat', { chatId: 'chat_id' });

// Server responds
socket.on('chatJoined', (data) => {
  // data contains chat information and previous messages
});
```

#### Send Message

```javascript
// Client emits
socket.emit('sendMessage', {
  chatId: 'chat_id',
  content: 'Hello, how are you?'
});

// Server broadcasts to recipients
socket.on('newMessage', (message) => {
  // message contains the new message data
});
```

#### Typing Indicator

```javascript
// Client emits
socket.emit('typing', { chatId: 'chat_id' });

// Server broadcasts
socket.on('userTyping', (data) => {
  // data.userId is typing in data.chatId
});
```

### Online Status

```javascript
// Server broadcasts
socket.on('userOnline', (userId) => {
  // userId is now online
});

socket.on('userOffline', (userId) => {
  // userId is now offline
});
```

### Notifications

```javascript
// Server emits
socket.on('newNotification', (notification) => {
  // notification contains notification data
});
``` 