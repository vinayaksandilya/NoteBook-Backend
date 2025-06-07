# Changelog

## [1.0.0] - Initial Setup
- Created basic Node.js backend structure
- Set up MySQL database configuration
- Implemented user authentication with JWT
- Added user registration and login functionality
- Added secure password hashing with bcrypt
- Created user profile management endpoints

## [1.1.0] - File Upload System
- Added file upload functionality
- Created files table in database
- Implemented file storage in public/uploads directory
- Added file management endpoints (upload, list, delete)
- Added file type validation for document files
- Implemented file size limits (5MB)
- Added user-specific file access control

### File Upload Features
- Restricted file types to:
  - PDF (.pdf)
  - Microsoft Word (.doc, .docx)
  - Text files (.txt)
  - Markdown (.md)
- Added validation for:
  - Single file upload only
  - File size limits
  - File type validation
  - File extension validation
- Implemented error handling for:
  - Multiple file uploads
  - Invalid file types
  - File size exceeded
  - Missing files
  - Invalid extensions

### Security Features
- Files are stored with UUID filenames
- Files are linked to user accounts
- Users can only access their own files
- Files are automatically cleaned up on failed uploads
- Secure file deletion with user verification

### Database Changes
- Added files table with fields:
  - id (UUID)
  - user_id (Foreign Key)
  - filename
  - original_name
  - mime_type
  - size
  - path
  - created_at
  - Foreign key constraint to users table

### API Endpoints Added
- POST /api/files/upload
- GET /api/files/my-files
- DELETE /api/files/:fileId

## [1.1.1] - Error Handling Improvements
- Enhanced error messages for file uploads
- Added file cleanup on failed uploads
- Improved validation error responses
- Added detailed error logging

## [1.2.0] - Course Management System
- Added course creation from uploaded files
- Implemented modular course structure
- Added course export functionality
- Created course management endpoints

### Database Changes
- Added courses table with fields:
  - id (UUID)
  - user_id (Foreign Key)
  - title
  - description
  - created_at
  - updated_at
- Added modules table with fields:
  - id (UUID)
  - course_id (Foreign Key)
  - heading
  - summary
  - order_index
  - created_at
  - updated_at
- Added key_takeaways table with fields:
  - id (UUID)
  - module_id (Foreign Key)
  - content
  - order_index
  - created_at
- Added course_files table for linking courses with source files

### Course Features
- Create courses from uploaded files
- Modular course structure with:
  - Course title and description
  - Multiple modules
  - Module headings and summaries
  - Key takeaways for each module
- Course export to markdown format
- Full CRUD operations for courses
- User-specific course access

### API Endpoints Added
- POST /api/courses/create-from-file
- GET /api/courses/my-courses
- GET /api/courses/:courseId
- PUT /api/courses/:courseId
- DELETE /api/courses/:courseId
- GET /api/courses/:courseId/export/markdown

## [1.2.1] - OpenRouter AI Integration
- Added OpenRouter AI service for PDF processing
- Integrated AI-powered course generation from uploaded files
- Added support for multiple PDF processing engines:
  - pdf-text: For well-structured PDFs
  - mistral-ocr: For scanned documents
- Added support for multiple AI models:
  - gpt-4: For multimodal tasks
  - claude-sonnet-3.7: For advanced reasoning
  - gemini-2.5-pro: For extensive document processing
- Enhanced course creation with AI-generated structure
- Added automatic module and key takeaway generation

### New Features
- Automatic course structure generation from PDFs
- Intelligent module organization
- AI-powered key takeaway extraction
- Configurable PDF processing engines
- Multiple AI model support

### API Changes
- Updated POST /api/courses/create-from-file endpoint:
  - Now accepts options for PDF engine and AI model
  - Automatically processes uploaded files
  - Generates course structure using AI

## [1.2.2] - Enhanced Model Selection
- Added model selection capabilities
- Added PDF engine selection
- Added model and engine validation
- Added endpoints to fetch available models and engines

### New Features
- Model selection with detailed capabilities
- PDF engine selection with use cases
- Model and engine validation
- Detailed model and engine information

### API Changes
- Added GET /api/courses/available-models endpoint:
  - Returns list of available AI models
  - Includes model descriptions and capabilities
- Added GET /api/courses/available-engines endpoint:
  - Returns list of available PDF processing engines
  - Includes engine descriptions and use cases
- Enhanced POST /api/courses/create-from-file endpoint:
  - Added model and engine validation
  - Improved error handling for invalid selections 

## [1.2.3] - Enhanced Module Flexibility
- Updated course structure generation to allow more flexible module creation
- Modified module and key takeaway requirements:
  - Minimum of 3 modules required (more allowed if content warrants)
  - Minimum of 3 key takeaways per module (more allowed if needed)
- Enhanced AI prompt for better content organization
- Improved validation logic for module structure
- Added support for dynamic module count based on content richness

### Changes
- Updated OpenRouter service prompt requirements
- Modified system message for AI model
- Enhanced validation logic for module structure
- Improved error handling for module generation
- Added support for content-driven module count

### API Behavior
- POST /api/courses/create-from-file now supports:
  - Dynamic number of modules (minimum 3)
  - Flexible number of key takeaways per module (minimum 3)
  - Content-driven module organization
  - Better handling of rich content sources 

## [1.2.4] - Module Update API
- Added new endpoint for updating course modules and key takeaways
- Enhanced module update functionality with validation
- Improved error handling for module updates
- Added support for flexible module and key takeaway updates

### Changes
- Added PUT /api/courses/:courseId/modules endpoint
- Added validation for minimum module and key takeaway requirements
- Enhanced Course model with updateModules method
- Improved transaction handling for module updates
- Added support for both string and object key takeaways

### API Behavior
- PUT /api/courses/:courseId/modules now supports:
  - Updating multiple modules at once
  - Maintaining minimum of 3 modules
  - Maintaining minimum of 3 key takeaways per module
  - Preserving module order
  - Atomic updates with transaction support 

## [1.2.5] - PDF-Only File Upload
- Restricted file uploads to PDF files only
- Removed support for other document types (.doc, .docx, .txt, .md)
- Updated file validation and error messages
- Updated documentation to reflect PDF-only restriction

### Changes
- Modified file upload configuration to only allow PDF files
- Updated error messages for invalid file types
- Enhanced file type validation
- Updated API documentation

### API Behavior
- POST /api/files/upload now:
  - Only accepts PDF files
  - Returns clear error messages for non-PDF files
  - Maintains existing size limit (5MB)
  - Maintains existing security features 

## [1.2.6] - Usage Statistics and Logging System
- Added comprehensive logging and usage statistics system
- Created new database tables for tracking usage
- Added logging service for centralized logging
- Added statistics endpoints for users

### Database Changes
- Added usage_logs table for tracking user actions
- Added model_usage table for tracking AI model usage
- Added user_stats table for aggregated statistics
- Added foreign key relationships to users table

### New Features
- User action logging (login, file operations, course operations)
- Model usage tracking (tokens, processing time, success/error)
- User statistics (total files, courses, model calls, tokens)
- Recent activity tracking
- Model-specific usage statistics

### API Endpoints Added
- GET /api/stats/user
  - Get user statistics
  - Returns total files, courses, model calls, and tokens used
- GET /api/stats/model-usage
  - Get model usage statistics
  - Returns per-model usage data
- GET /api/stats/recent-activity
  - Get recent user activity
  - Supports pagination with limit parameter

### Logging Features
- Automatic logging of all user actions
- Model usage tracking with performance metrics
- Error tracking and reporting
- Token usage monitoring
- Processing time tracking 

## [1.2.7] - Enhanced Statistics and Logging
- Improved model usage tracking and statistics
- Enhanced user statistics with detailed metrics
- Added success rate tracking for model calls
- Improved database schema for better performance
- Enhanced error handling in logging service

### Changes
- Simplified model_usage table structure
- Enhanced statistics calculations
- Added success rate tracking
- Improved query performance
- Better error handling in logging service

### API Improvements
- Enhanced GET /api/stats/user endpoint:
  - Added success rate per model
  - Improved token usage tracking
  - Better processing time calculations
- Enhanced GET /api/stats/model-usage endpoint:
  - Added success rate calculation
  - Improved average processing time calculation
  - Better organization of model statistics
- Improved error handling in all statistics endpoints

### Database Changes
- Simplified model_usage table:
  - Removed redundant aggregated columns
  - Added better indexing for performance
  - Improved foreign key relationships
- Enhanced user_stats table:
  - Added total_processing_time field
  - Improved timestamp handling
  - Better default values

### Logging Features
- Improved model usage logging
- Enhanced error tracking
- Better performance metrics
- More detailed success/failure tracking
- Improved timestamp handling 