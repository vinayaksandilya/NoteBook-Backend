const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');

class File {
  static async create({ userId, filename, originalName, mimeType, size, path, url }) {
    const id = uuidv4();
    
    const [result] = await pool.query(
      'INSERT INTO files (id, user_id, filename, original_name, mime_type, size, path, url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, userId, filename, originalName, mimeType, size, path, url]
    );
    
    return this.findById(id);
  }

  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM files WHERE id = ?', [id]);
    return rows[0];
  }

  static async findByUserId(userId) {
    const [rows] = await pool.query('SELECT * FROM files WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    return rows;
  }

  static async delete(id, userId) {
    const [result] = await pool.query('DELETE FROM files WHERE id = ? AND user_id = ?', [id, userId]);
    return result.affectedRows > 0;
  }
}

module.exports = File; 