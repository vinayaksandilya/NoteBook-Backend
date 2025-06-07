const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');

class LoggingService {
  static async logUserAction(userId, actionType, details = {}) {
    try {
      const id = uuidv4();
      await pool.query(
        'INSERT INTO usage_logs (id, user_id, action_type, details) VALUES (?, ?, ?, ?)',
        [id, userId, actionType, JSON.stringify(details)]
      );

      // Update user stats based on action type
      switch (actionType) {
        case 'file_upload':
          await this.incrementUserStat(userId, 'total_files');
          break;
        case 'course_create':
          await this.incrementUserStat(userId, 'total_courses');
          break;
        case 'model_call':
          await this.incrementUserStat(userId, 'total_model_calls');
          break;
        case 'login':
          await this.updateLastLogin(userId);
          break;
      }
    } catch (error) {
      console.error('Error logging user action:', error);
    }
  }

  static async logModelUsage(userId, modelName, engineName, tokensUsed, processingTimeMs, status, errorMessage = null) {
    try {
      const id = uuidv4();
      const query = `
        INSERT INTO model_usage (
          id, user_id, model_name, engine_name, tokens_used, 
          processing_time_ms, status, error_message, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;
      
      await pool.query(query, [
        id, userId, modelName, engineName, tokensUsed,
        processingTimeMs, status, errorMessage
      ]);

      // Update user stats with token usage
      await this.incrementUserStat(userId, 'total_tokens_used', tokensUsed);
      await this.incrementUserStat(userId, 'total_model_calls', 1);
      await this.incrementUserStat(userId, 'total_processing_time', processingTimeMs);

      return id;
    } catch (error) {
      console.error('Error logging model usage:', error);
      throw error;
    }
  }

  static async incrementUserStat(userId, statField, increment = 1) {
    try {
      await pool.query(
        `UPDATE user_stats SET ${statField} = ${statField} + ? WHERE user_id = ?`,
        [increment, userId]
      );
    } catch (error) {
      console.error(`Error incrementing user stat ${statField}:`, error);
    }
  }

  static async updateLastLogin(userId) {
    try {
      await pool.query(
        'UPDATE user_stats SET last_login_at = CURRENT_TIMESTAMP WHERE user_id = ?',
        [userId]
      );
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  static async initializeUserStats(userId) {
    try {
      await pool.query(
        'INSERT INTO user_stats (user_id) VALUES (?)',
        [userId]
      );
    } catch (error) {
      console.error('Error initializing user stats:', error);
    }
  }

  static async getUserStats(userId) {
    try {
      // 1. Get user stats
      const [userStatsRows] = await pool.query(
        'SELECT * FROM user_stats WHERE user_id = ?',
        [userId]
      );
      if (userStatsRows.length === 0) {
        throw new Error('User statistics not found');
      }
      const userStats = userStatsRows[0];

      // 2. Get model usage stats
      const [modelStatsRows] = await pool.query(
        `SELECT 
          model_name,
          COUNT(*) as total_calls,
          SUM(tokens_used) as total_tokens,
          SUM(processing_time_ms) as total_processing_time,
          MAX(created_at) as last_used,
          ROUND(
            (SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) * 100.0) / 
            COUNT(*), 
            2
          ) as success_rate
        FROM model_usage
        WHERE user_id = ?
        GROUP BY model_name`,
        [userId]
      );
      userStats.model_stats = modelStatsRows;
      return userStats;
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }

  static async getModelUsageStats(userId) {
    try {
      const query = `
        SELECT 
          model_name,
          COUNT(*) as total_calls,
          SUM(tokens_used) as total_tokens,
          SUM(processing_time_ms) as total_processing_time,
          ROUND(AVG(processing_time_ms), 2) as avg_processing_time,
          MAX(created_at) as last_used,
          ROUND(
            (SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) * 100.0) / 
            COUNT(*), 
            2
          ) as success_rate
        FROM model_usage
        WHERE user_id = ?
        GROUP BY model_name
        ORDER BY total_calls DESC
      `;
      
      const [rows] = await pool.query(query, [userId]);
      return rows;
    } catch (error) {
      console.error('Error getting model usage stats:', error);
      throw error;
    }
  }

  static async getRecentActivity(userId, limit = 10) {
    try {
      const [logs] = await pool.query(
        `SELECT * FROM usage_logs 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT ?`,
        [userId, limit]
      );
      return logs;
    } catch (error) {
      console.error('Error getting recent activity:', error);
      return [];
    }
  }
}

module.exports = LoggingService; 