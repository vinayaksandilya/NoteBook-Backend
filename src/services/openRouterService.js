const axios = require('axios');
const fs = require('fs').promises;
const FormData = require('form-data');
const s3Service = require('./s3Service');
const LoggingService = require('./loggingService');

class OpenRouterService {
  constructor() {
    this.apiKey = process.env.OPEN_ROUTER_KEY;
    this.baseUrl = 'https://openrouter.ai/api/v1';
    this.headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'HTTP-Referer': 'http://localhost:3000', // Replace with your actual domain
      'X-Title': 'NoteBook-Backend',
      'Content-Type': 'application/json'
    };

    // Available models and their capabilities
    this.availableModels = {
      'openai/gpt-4': {
        name: 'GPT-4',
        description: 'Best for multimodal tasks and complex document processing',
        capabilities: ['multimodal', 'complex-analysis', 'detailed-summarization']
      },
      'anthropic/claude-3.7-sonnet': {
        name: 'Claude Sonnet 3.7',
        description: 'Advanced reasoning and detailed content analysis',
        capabilities: ['reasoning', 'content-analysis', 'structured-output']
      },
      'google/gemini-2.5-flash-preview-05-20': {
        name: 'Gemini 2.5 Flash',
        description: 'High performance in understanding and summarizing extensive documents',
        capabilities: ['document-understanding', 'summarization', 'key-points']
      }
    };

    // Available PDF processing engines
    this.availableEngines = {
      'pdf-text': {
        name: 'PDF Text Extractor',
        description: 'For well-structured PDFs with clear text content',
        bestFor: ['digital-pdfs', 'text-based-content']
      },
      'mistral-ocr': {
        name: 'Mistral OCR',
        description: 'For scanned documents or PDFs with images and complex layouts',
        bestFor: ['scanned-documents', 'image-based-content', 'complex-layouts']
      }
    };
  }

  getAvailableModels() {
    return this.availableModels;
  }

  getAvailableEngines() {
    return this.availableEngines;
  }

  validateModel(model) {
    if (!this.availableModels[model]) {
      throw new Error(`Invalid model. Available models: ${Object.keys(this.availableModels).join(', ')}`);
    }
    return true;
  }

  validateEngine(engine) {
    if (!this.availableEngines[engine]) {
      throw new Error(`Invalid engine. Available engines: ${Object.keys(this.availableEngines).join(', ')}`);
    }
    return true;
  }

  async processPDF(fileUrl, options = {}, userId) {
    const {
      pdfEngine = 'pdf-text',
      aiModel = 'anthropic/claude-3.7-sonnet'
    } = options;

    const startTime = Date.now();
    let status = 'success';
    let errorMessage = null;
    let tokensUsed = 0;

    try {
      // Validate model and engine
      this.validateModel(aiModel);
      this.validateEngine(pdfEngine);

      // Fetch the PDF content from S3 URL
      const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
      const pdfBuffer = Buffer.from(response.data);
      const base64PDF = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;

      // Process the PDF directly with AI model
      const courseStructure = await this.generateCourseStructure(base64PDF, aiModel, pdfEngine);

      // Log successful model usage
      const processingTime = Date.now() - startTime;
      await LoggingService.logModelUsage(
        userId,
        aiModel,
        pdfEngine,
        tokensUsed,
        processingTime,
        status
      );

      // Log the model call action
      await LoggingService.logUserAction(userId, 'model_call', {
        model: aiModel,
        engine: pdfEngine,
        processingTime,
        tokensUsed
      });

      return courseStructure;
    } catch (error) {
      status = 'error';
      errorMessage = error.message;
      console.error('Error processing PDF:', error);

      // Log failed model usage
      const processingTime = Date.now() - startTime;
      await LoggingService.logModelUsage(
        userId,
        aiModel,
        pdfEngine,
        tokensUsed,
        processingTime,
        status,
        errorMessage
      );

      // Log the failed model call
      await LoggingService.logUserAction(userId, 'model_call', {
        model: aiModel,
        engine: pdfEngine,
        processingTime,
        error: errorMessage
      });

      throw new Error(`Failed to process PDF: ${error.message}`);
    }
  }

  async generateCourseStructure(base64PDF, model, pdfEngine) {
    try {
      const prompt = `You are a content structure generator. Your task is to analyze the provided content and create a structured course-style content with multiple modules.

      IMPORTANT: You must respond with ONLY a valid JSON object, no other text or explanations.

      The JSON must follow this exact structure:
      {
        "title": "Course Title",
        "description": "A brief overview of the entire course",
        "modules": [
          {
            "heading": "Module Title",
            "summary": "Detailed summary of this module's content",
            "key_takeaways": [
              "Key point 1 from this module",
              "Key point 2 from this module",
              "Key point 3 from this module"
            ]
          }
        ]
      }

      Requirements:
      1. Create AT LEAST 3 modules from the content (more modules are allowed if the content warrants it)
      2. Each module must have a distinct topic
      3. Each module must have AT LEAST 3 key takeaways (more takeaways are allowed if needed)
      4. Summaries must be detailed and informative
      5. Modules must follow a logical progression
      6. Response must be ONLY the JSON object, no other text
      7. Do not include any markdown formatting or code blocks`;

      console.log('Sending request to OpenRouter with model:', model);
      
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: model,
          messages: [
            {
              role: 'system',
              content: 'You are a JSON-only course structure generator. Never include any text outside the JSON object. Create at least 3 modules with at least 3 key takeaways each. You can create more modules and takeaways if the content warrants it.'
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt
                },
                {
                  type: 'file',
                  file: {
                    filename: 'document.pdf',
                    file_data: base64PDF
                  }
                }
              ]
            }
          ],
          temperature: 0.2,
          max_tokens: 2000,
          response_format: { type: "json_object" },
          plugins: [
            {
              id: 'file-parser',
              pdf: {
                engine: pdfEngine
              }
            }
          ]
        },
        { 
          headers: {
            ...this.headers,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Received response from OpenRouter');
      
      // Get the response content
      const aiResponse = response.data.choices[0].message.content;
      console.log('Raw AI Response:', aiResponse);

      // Try to parse the response as JSON
      let courseStructure;
      try {
        courseStructure = JSON.parse(aiResponse);
        console.log('Parsed course structure:', JSON.stringify(courseStructure, null, 2));
      } catch (parseError) {
        console.error('Failed to parse AI response:', aiResponse);
        throw new Error('AI response was not valid JSON. Please try again.');
      }

      // Validate the structure
      if (!courseStructure.title || !courseStructure.description || !Array.isArray(courseStructure.modules)) {
        console.error('Missing required fields in course structure:', courseStructure);
        throw new Error('AI response missing required fields. Please try again.');
      }

      if (courseStructure.modules.length < 3) {
        console.error('Incorrect number of modules:', courseStructure.modules.length);
        throw new Error(`AI generated ${courseStructure.modules.length} modules instead of at least 3. Please try again.`);
      }

      // Ensure each module has the required fields
      courseStructure.modules = courseStructure.modules.map((module, index) => {
        // Ensure at least 3 key takeaways
        let keyTakeaways = Array.isArray(module.key_takeaways) ? module.key_takeaways : [];
        if (keyTakeaways.length < 3) {
          console.log(`Module ${index + 1} has ${keyTakeaways.length} takeaways, adjusting to 3`);
          while (keyTakeaways.length < 3) {
            keyTakeaways.push(`Key point ${keyTakeaways.length + 1}`);
          }
        }

        return {
          heading: module.heading || `Module ${index + 1}`,
          summary: module.summary || 'No summary provided',
          key_takeaways: keyTakeaways
        };
      });

      console.log('Final course structure:', JSON.stringify(courseStructure, null, 2));
      return courseStructure;
    } catch (error) {
      console.error('Error generating course structure:', error);
      if (error.response) {
        console.error('OpenRouter API Error:', error.response.data);
      }
      throw new Error(`Failed to generate course structure: ${error.message}`);
    }
  }
}

module.exports = new OpenRouterService(); 