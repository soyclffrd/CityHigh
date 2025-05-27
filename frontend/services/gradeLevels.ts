import pool from '../config/database';

interface GradeLevel {
  id: number;
  name: string;
  description: string;
  created_at: Date;
  updated_at: Date;
}

export const gradeLevelsService = {
  // Get all grade levels with pagination
  async getAll(page: number = 1, limit: number = 10, search: string = '') {
    const offset = (page - 1) * limit;
    const query = `
      SELECT * FROM grade_levels 
      WHERE name ILIKE $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;
    const values = [`%${search}%`, limit, offset];
    
    try {
      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      console.error('Error fetching grade levels:', error);
      throw error;
    }
  },

  // Get a single grade level by ID
  async getById(id: number) {
    const query = 'SELECT * FROM grade_levels WHERE id = $1';
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error fetching grade level:', error);
      throw error;
    }
  },

  // Create a new grade level
  async create(gradeLevel: Omit<GradeLevel, 'id' | 'created_at' | 'updated_at'>) {
    const query = `
      INSERT INTO grade_levels (name, description) 
      VALUES ($1, $2) 
      RETURNING *
    `;
    const values = [gradeLevel.name, gradeLevel.description];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating grade level:', error);
      throw error;
    }
  },

  // Update a grade level
  async update(id: number, gradeLevel: Partial<GradeLevel>) {
    const query = `
      UPDATE grade_levels 
      SET name = $1, description = $2 
      WHERE id = $3 
      RETURNING *
    `;
    const values = [gradeLevel.name, gradeLevel.description, id];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating grade level:', error);
      throw error;
    }
  },

  // Delete a grade level
  async delete(id: number) {
    const query = 'DELETE FROM grade_levels WHERE id = $1 RETURNING *';
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error deleting grade level:', error);
      throw error;
    }
  },

  // Count total grade levels (for pagination)
  async count(search: string = '') {
    const query = 'SELECT COUNT(*) FROM grade_levels WHERE name ILIKE $1';
    
    try {
      const result = await pool.query(query, [`%${search}%`]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error counting grade levels:', error);
      throw error;
    }
  }
}; 