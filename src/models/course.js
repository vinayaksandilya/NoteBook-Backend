const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');

class Course {
  static async create({ userId, title, description, modules, fileId }) {
    const courseId = uuidv4();
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Insert course
      await connection.query(
        'INSERT INTO courses (id, user_id, title, description) VALUES (?, ?, ?, ?)',
        [courseId, userId, title, description]
      );

      // Link file to course
      if (fileId) {
        await connection.query(
          'INSERT INTO course_files (id, course_id, file_id) VALUES (?, ?, ?)',
          [uuidv4(), courseId, fileId]
        );
      }

      // Insert modules and key takeaways
      if (modules && Array.isArray(modules)) {
        for (const module of modules) {
          const moduleId = uuidv4();
          await connection.query(
            'INSERT INTO modules (id, course_id, heading, summary, order_index) VALUES (?, ?, ?, ?, ?)',
            [moduleId, courseId, module.heading, module.summary, module.order_index]
          );
          if (module.key_takeaways && Array.isArray(module.key_takeaways)) {
            const takeawayValues = module.key_takeaways.map(takeaway => [
              uuidv4(),
              moduleId,
              takeaway.content,
              takeaway.order_index
            ]);
            if (takeawayValues.length > 0) {
              await connection.query(
                'INSERT INTO key_takeaways (id, module_id, content, order_index) VALUES ?',
                [takeawayValues]
              );
            }
          }
        }
      }

      await connection.commit();
      connection.release();

      // Fetch the created course with all its relations
      const [course] = await pool.query(
        `SELECT c.*, 
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', m.id,
              'heading', m.heading,
              'summary', m.summary,
              'order_index', m.order_index,
              'key_takeaways', (
                SELECT JSON_ARRAYAGG(
                  JSON_OBJECT(
                    'id', kt.id,
                    'content', kt.content,
                    'order_index', kt.order_index
                  )
                )
                FROM key_takeaways kt
                WHERE kt.module_id = m.id
                ORDER BY kt.order_index
              )
            )
          ) as modules
        FROM courses c
        LEFT JOIN modules m ON c.id = m.course_id
        WHERE c.id = ?
        GROUP BY c.id`,
        [courseId]
      );

      return course[0];
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  }

  static async findById(id) {
    const [course] = await pool.query('SELECT * FROM courses WHERE id = ?', [id]);
    if (!course[0]) return null;

    const [modules] = await pool.query(
      'SELECT * FROM modules WHERE course_id = ? ORDER BY order_index',
      [id]
    );

    const courseData = {
      ...course[0],
      modules: await Promise.all(
        modules.map(async (module) => {
          const [takeaways] = await pool.query(
            'SELECT content FROM key_takeaways WHERE module_id = ? ORDER BY order_index',
            [module.id]
          );
          return {
            ...module,
            key_takeaways: takeaways.map(t => t.content)
          };
        })
      )
    };

    return courseData;
  }

  static async findByUserId(userId) {
    const [courses] = await pool.query('SELECT * FROM courses WHERE user_id = ?', [userId]);
    return courses;
  }

  static async update(id, { title, description, modules }) {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      if (title || description) {
        await connection.query(
          'UPDATE courses SET title = COALESCE(?, title), description = COALESCE(?, description) WHERE id = ?',
          [title, description, id]
        );
      }

      if (modules) {
        // Delete existing modules and their takeaways
        const [existingModules] = await connection.query(
          'SELECT id FROM modules WHERE course_id = ?',
          [id]
        );

        for (const module of existingModules) {
          await connection.query('DELETE FROM key_takeaways WHERE module_id = ?', [module.id]);
        }
        await connection.query('DELETE FROM modules WHERE course_id = ?', [id]);

        // Create new modules and takeaways
        for (let i = 0; i < modules.length; i++) {
          const module = modules[i];
          const moduleId = uuidv4();

          await connection.query(
            'INSERT INTO modules (id, course_id, heading, summary, order_index) VALUES (?, ?, ?, ?, ?)',
            [moduleId, id, module.heading, module.summary, i]
          );

          if (module.key_takeaways && module.key_takeaways.length > 0) {
            const takeawaysValues = module.key_takeaways.map((takeaway, index) => [
              uuidv4(),
              moduleId,
              typeof takeaway === 'string' ? takeaway : takeaway.content,
              index
            ]);

            await connection.query(
              'INSERT INTO key_takeaways (id, module_id, content, order_index) VALUES ?',
              [takeawaysValues]
            );
          }
        }
      }

      await connection.commit();
      return this.findById(id);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async delete(id) {
    const [result] = await pool.query('DELETE FROM courses WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async updateModules(courseId, modules) {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Delete existing modules and their takeaways
      const [existingModules] = await connection.query(
        'SELECT id FROM modules WHERE course_id = ?',
        [courseId]
      );

      for (const module of existingModules) {
        await connection.query('DELETE FROM key_takeaways WHERE module_id = ?', [module.id]);
      }
      await connection.query('DELETE FROM modules WHERE course_id = ?', [courseId]);

      // Create new modules and takeaways
      for (let i = 0; i < modules.length; i++) {
        const module = modules[i];
        const moduleId = uuidv4();

        await connection.query(
          'INSERT INTO modules (id, course_id, heading, summary, order_index) VALUES (?, ?, ?, ?, ?)',
          [moduleId, courseId, module.heading, module.summary, i]
        );

        if (module.key_takeaways && module.key_takeaways.length > 0) {
          const takeawaysValues = module.key_takeaways.map((takeaway, index) => [
            uuidv4(),
            moduleId,
            typeof takeaway === 'string' ? takeaway : takeaway.content,
            index
          ]);

          await connection.query(
            'INSERT INTO key_takeaways (id, module_id, content, order_index) VALUES ?',
            [takeawaysValues]
          );
        }
      }

      await connection.commit();
      return this.findById(courseId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = Course; 