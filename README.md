# Notebook Backend

A Node.js backend application with user authentication using JWT tokens and MySQL database.

## Features

- User registration and login with JWT authentication
- Secure password hashing using bcrypt
- MySQL database integration
- User profile management
- UUID-based user identification
- File upload and management system (PDF files only)
- AI-powered course generation
- Comprehensive usage statistics and logging

## Prerequisites

- Node.js (v14 or higher)
- MySQL Server
- npm or yarn

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update the database credentials and JWT secret

4. Start the server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication

- `POST /api/users/register`
  - Register a new user
  - Body: `{ "username": "string", "email": "string", "password": "string" }`

- `POST /api/users/login`
  - Login user
  - Body: `{ "login": "string", "password": "string" }`

### User Profile

- `GET /api/users/profile`
  - Get user profile
  - Requires Authentication header: `Bearer <token>`

- `PATCH /api/users/profile`
  - Update user profile
  - Requires Authentication header: `Bearer <token>`
  - Body: `{ "username": "string", "email": "string", "password": "string" }` (all fields optional)

### File Management

- `POST /api/files/upload`
  - Upload a new file
  - Requires Authentication header: `Bearer <token>`
  - Content-Type: `multipart/form-data`
  - Body: form-data with key 'file' and your file
  - File size limit: 5MB
  - Allowed file types:
    - PDF (.pdf) only
  - Returns: File metadata including ID, path, and original name

- `GET /api/files/my-files`
  - Get list of user's uploaded files
  - Requires Authentication header: `Bearer <token>`
  - Returns: Array of file metadata

- `DELETE /api/files/:fileId`
  - Delete a specific file
  - Requires Authentication header: `Bearer <token>`
  - Returns: Success message

### Course Management (AI-Powered)

- `GET /api/courses/available-models`
  - Get list of available AI models and their capabilities
  - Requires Authentication header: `Bearer <token>`
  - Returns: Object containing model information

- `GET /api/courses/available-engines`
  - Get list of available PDF processing engines
  - Requires Authentication header: `Bearer <token>`
  - Returns: Object containing engine information

- `POST /api/courses/create-from-file`
  - Create a course from an uploaded file using AI
  - Requires Authentication header: `Bearer <token>`
  - Body:
    ```json
    {
      "fileId": "string",
      "options": {
        "pdfEngine": "pdf-text" | "mistral-ocr",
        "aiModel": "openai/gpt-4" | "anthropic/claude-3.7-sonnet" | "google/gemini-2.5-flash-preview-05-20"
      }
    }
    ```
  - Returns: Created course object

- `GET /api/courses/my-courses`
  - Get list of user's courses
  - Requires Authentication header: `Bearer <token>`
  - Returns: Array of course objects

- `GET /api/courses/:courseId`
  - Get specific course details
  - Requires Authentication header: `Bearer <token>`
  - Returns: Course object

- `PUT /api/courses/:courseId`
  - Update course details
  - Requires Authentication header: `Bearer <token>`
  - Body: Course update data
  - Returns: Updated course object

- `DELETE /api/courses/:courseId`
  - Delete a course
  - Requires Authentication header: `Bearer <token>`
  - Returns: Success message

- `GET /api/courses/:courseId/export/markdown`
  - Export course as markdown file
  - Requires Authentication header: `Bearer <token>`
  - Returns: Markdown file download

### Usage Statistics and Logging

- `GET /api/stats/user`
  - Get user statistics
  - Requires Authentication header: `Bearer <token>`
  - Returns: User statistics including:
    - Total files and courses
    - Model usage statistics
    - Token usage
    - Processing time
    - Last login timestamp

- `GET /api/stats/model-usage`
  - Get model usage statistics
  - Requires Authentication header: `Bearer <token>`
  - Returns: Per-model statistics including:
    - Total calls
    - Total tokens used
    - Processing time
    - Success rate
    - Last used timestamp

- `GET /api/stats/recent-activity`
  - Get recent user activity
  - Requires Authentication header: `Bearer <token>`
  - Query Parameters:
    - `limit`: Number of records to return (default: 10)
  - Returns: Array of recent user actions

## Database Configuration

The application uses the following database configuration:
- Database name: notebook
- Host: localhost
- User: root
- Password: root

The database and required tables will be created automatically when the server starts.

## File Storage

- Uploaded files are stored in the `public/uploads` directory
- Each file is assigned a unique UUID filename
- Files are accessible via `/uploads/<filename>`
- Files are linked to users in the database
- Users can only access and manage their own files
- Only PDF files are allowed

## Deploying with Coolify

This project is ready to be deployed on [Coolify](https://coolify.io/).

### Quick Start with Coolify

1. **Clone this repository** to your server or connect it to Coolify.
2. **Set environment variables** in Coolify for your database and any required secrets (see `.env.example`).
3. **Coolify will detect the Dockerfile** and build the project automatically.
4. The app will run on port `3000` by default.

For more details, see the [Coolify Node.js Example](https://github.com/coollabsio/coolify-examples/tree/v4.x/nodejs).

--- 