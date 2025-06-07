const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

class User {
  static async create({ username, email, password }) {
    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const query = `
      INSERT INTO users (id, username, email, password, created_at, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;
    
    await pool.query(query, [id, username, email, hashedPassword]);
    return this.findById(id);
  }

  static async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, username, email, created_at, updated_at FROM users WHERE id = ?', 
      [id]
    );
    return rows[0];
  }

  static async findByEmailOrUsername(login) {
    const query = `
      SELECT id, username, email, password, created_at, updated_at 
      FROM users 
      WHERE email = ? OR username = ?
    `;
    const [rows] = await pool.query(query, [login, login]);
    return rows[0];
  }

  static async findByEmail(email) {
    const [rows] = await pool.query(
      'SELECT id, username, email, created_at, updated_at FROM users WHERE email = ?', 
      [email]
    );
    return rows[0];
  }

  static async findByUsername(username) {
    const [rows] = await pool.query(
      'SELECT id, username, email, created_at, updated_at FROM users WHERE username = ?', 
      [username]
    );
    return rows[0];
  }

  static async update(id, { username, email, password }) {
    const updates = [];
    const values = [];

    if (username) {
      updates.push('username = ?');
      values.push(username);
    }
    if (email) {
      updates.push('email = ?');
      values.push(email);
    }
    if (password) {
      updates.push('password = ?');
      values.push(await bcrypt.hash(password, 10));
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    // Always update the updated_at timestamp
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = ?
    `;

    await pool.query(query, values);
    return this.findById(id);
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static async validatePassword(user, password) {
    return bcrypt.compare(password, user.password);
  }
}

module.exports = User; 