const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Course = require('../models/course');
const File = require('../models/file');
const openRouterService = require('../services/openRouterService');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const s3Service = require('../services/s3Service');
const LoggingService = require('../services/loggingService');

// Get available AI models and their capabilities
router.get('/available-models', auth, (req, res) => {
  try {
    const models = openRouterService.getAvailableModels();
    res.json(models);
  } catch (error) {
    console.error('Error fetching available models:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get available PDF processing engines
router.get('/available-engines', auth, (req, res) => {
  try {
    const engines = openRouterService.getAvailableEngines();
    res.json(engines);
  } catch (error) {
    console.error('Error fetching available engines:', error);
    res.status(400).json({ error: error.message });
  }
});

// Create course from file with AI processing
router.post('/create-from-file', auth, async (req, res) => {
  try {
    const { fileId, options } = req.body;

    if (!fileId) {
      return res.status(400).json({ 
        error: 'File ID is required' 
      });
    }

    // Verify file exists and belongs to user
    const file = await File.findById(fileId);
    if (!file || file.user_id !== req.user.id) {
      return res.status(404).json({ 
        error: 'File not found or not authorized' 
      });
    }

    // Get the file URL from S3
    const fileUrl = await s3Service.getFileUrl(file.path);

    // Process the file with AI
    const courseData = await openRouterService.processPDF(fileUrl, options, req.user.id);

    // Validate course data structure
    if (!courseData || !courseData.title || !courseData.modules || !Array.isArray(courseData.modules)) {
      return res.status(400).json({
        error: 'Invalid course data structure received from AI service'
      });
    }

    // Create course with processed data
    const course = await Course.create({
      userId: req.user.id,
      title: courseData.title,
      description: courseData.description || '',
      modules: courseData.modules.map((module, index) => ({
        heading: module.heading,
        summary: module.summary,
        order_index: index,
        key_takeaways: Array.isArray(module.key_takeaways) ? module.key_takeaways.map((takeaway, takeawayIndex) => ({
          content: typeof takeaway === 'string' ? takeaway : takeaway.content,
          order_index: takeawayIndex
        })) : []
      })),
      fileId
    });

    // Log course creation
    await LoggingService.logUserAction(req.user.id, 'course_create', {
      courseId: course.id,
      title: course.title,
      moduleCount: courseData.modules.length
    });

    // Return the created course with its structure
    res.status(201).json({
      id: course.id,
      title: course.title,
      description: course.description,
      modules: course.modules.map(module => ({
        heading: module.heading,
        summary: module.summary,
        key_takeaways: module.key_takeaways.map(takeaway => takeaway.content)
      })),
      created_at: course.created_at,
      file_id: fileId
    });

  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ 
      error: 'Failed to create course',
      details: error.message 
    });
  }
});

// Get user's courses
router.get('/my-courses', auth, async (req, res) => {
  try {
    const courses = await Course.findByUserId(req.user.id);
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get course by ID
router.get('/:courseId', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (course.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to access this course' });
    }

    res.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(400).json({ error: error.message });
  }
});

// Update course
router.put('/:courseId', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (course.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this course' });
    }

    const updatedCourse = await Course.update(req.params.courseId, req.body);
    res.json(updatedCourse);
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete course
router.delete('/:courseId', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (course.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this course' });
    }

    await Course.delete(req.params.courseId);
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(400).json({ error: error.message });
  }
});

// Export course as markdown
router.get('/:courseId/export/markdown', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (course.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to export this course' });
    }

    // Generate markdown content
    let markdown = `# ${course.title}\n\n`;
    if (course.description) {
      markdown += `${course.description}\n\n`;
    }

    course.modules.forEach((module, index) => {
      markdown += `## ${module.heading}\n\n`;
      if (module.summary) {
        markdown += `${module.summary}\n\n`;
      }
      if (module.key_takeaways && module.key_takeaways.length > 0) {
        markdown += '### Key Takeaways\n\n';
        module.key_takeaways.forEach(takeaway => {
          markdown += `- ${takeaway}\n`;
        });
        markdown += '\n';
      }
    });

    // Create temporary file
    const filename = `${course.title.toLowerCase().replace(/\s+/g, '-')}.md`;
    const filepath = path.join(__dirname, '../../public/exports', filename);
    
    // Ensure exports directory exists
    const exportsDir = path.join(__dirname, '../../public/exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    fs.writeFileSync(filepath, markdown);

    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('Error sending file:', err);
      }
      // Clean up the temporary file
      fs.unlinkSync(filepath);
    });
  } catch (error) {
    console.error('Error exporting course:', error);
    res.status(400).json({ error: error.message });
  }
});

// Update course modules and key takeaways
router.put('/:courseId/modules', auth, async (req, res) => {
  try {
    const { modules } = req.body;
    
    if (!modules || !Array.isArray(modules)) {
      return res.status(400).json({ 
        error: 'Modules array is required' 
      });
    }

    // Validate minimum requirements
    if (modules.length < 3) {
      return res.status(400).json({ 
        error: 'At least 3 modules are required' 
      });
    }

    // Validate each module
    for (const module of modules) {
      if (!module.heading || !module.summary) {
        return res.status(400).json({ 
          error: 'Each module must have a heading and summary' 
        });
      }

      if (!module.key_takeaways || !Array.isArray(module.key_takeaways) || module.key_takeaways.length < 3) {
        return res.status(400).json({ 
          error: 'Each module must have at least 3 key takeaways' 
        });
      }
    }

    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (course.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this course' });
    }

    // Update modules and key takeaways
    const updatedCourse = await Course.updateModules(req.params.courseId, modules);
    res.json(updatedCourse);
  } catch (error) {
    console.error('Error updating course modules:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 