# Development Prompts

## Initial Setup
1. "build a nodejs backend that allows users to login using email and password login while it gives out a JWT token password should be stored in secure format. also surers should have ability to set email, username, password and assigned a unique uuid for the same. the database name is 'notebook' $db_host = 'localhost' or '127.0.0.1' $db_user = 'root'; $db_password = 'root'; check connection to database and auto write the db"

## Authentication Improvements
1. "password and email are required fields in register cannot be empty"
2. "allow login to use both email / username"

## File Upload System
1. "build a way for users to upload files to the server on a public folder where files are tagged to users id and store it in the database linking it"
2. "allow only upload of .md, .pdf , .docx, .doc, .txt and only document like files"
3. "throw structure error if multiple files are uploaded or not uploaded as per mentioned file format"

## Documentation
1. "@README.md update the changes to readme with new file upload apis"
2. "make a local log of all the changes done till now on a new file and all prompts used to reach here on a new file"

## Implementation Details

### Authentication System
- Implemented JWT-based authentication
- Added email/username login support
- Required field validation for registration
- Secure password hashing with bcrypt
- User profile management

### File Upload System
- Implemented PDF-only file uploads
- Added file type restrictions
- Implemented size limits
- Added user-specific file management
- Enhanced error handling and validation

### Database Structure
- Users table with UUID primary keys
- Files table with user associations
- Automatic table creation
- Foreign key constraints

### Course Structure Generation
- Implemented AI-powered course structure generation
- Added support for multiple AI models
- Added PDF processing engine selection
- Enhanced error handling and validation

### Module Flexibility
- Updated module generation requirements:
  - Minimum of 3 modules required
  - Support for additional modules based on content
  - Minimum of 3 key takeaways per module
  - Support for additional takeaways when needed
- Enhanced AI prompts for better content organization
- Improved validation for module structure
- Added support for content-driven module count

### Statistics and Logging
- Implemented comprehensive logging system:
  - User action tracking
  - Model usage monitoring
  - Performance metrics
  - Error tracking
- Added usage statistics:
  - Per-user statistics
  - Model-specific metrics
  - Token usage tracking
  - Processing time monitoring
- Enhanced database schema:
  - Optimized for performance
  - Better data organization
  - Improved query efficiency

### Security Features
- JWT token authentication
- Secure password storage
- User-specific file access
- File type validation
- Size restrictions
- Comprehensive logging
- Usage monitoring 