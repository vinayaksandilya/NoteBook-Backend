const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs').promises;
require('dotenv').config();

class S3Service {
  constructor() {
    // Validate required environment variables
    const requiredEnvVars = [
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY',
      'AWS_REGION',
      'AWS_BUCKET_NAME'
    ];

    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingEnvVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    }

    this.s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
    this.bucketName = process.env.AWS_BUCKET_NAME;
  }

  async uploadFile(filePath, key) {
    try {
      const fileContent = await fs.readFile(filePath);
      
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: fileContent,
        ContentType: 'application/pdf'
      });

      await this.s3Client.send(command);
      
      // Generate permanent URL for the uploaded file
      const url = `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
      
      return {
        key,
        url
      };
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
  }

  async getFileUrl(key) {
    try {
      // Generate permanent URL
      return `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    } catch (error) {
      console.error('Error generating URL:', error);
      throw new Error(`Failed to generate URL: ${error.message}`);
    }
  }

  async deleteFile(key) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      await this.s3Client.send(command);
    } catch (error) {
      console.error('Error deleting file from S3:', error);
      throw new Error(`Failed to delete file from S3: ${error.message}`);
    }
  }
}

module.exports = new S3Service(); 