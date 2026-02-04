import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create a SQL query function using Neon serverless driver
export const sql = neon(DATABASE_URL);

// Helper function to execute queries
export async function query<T>(queryText: string, params?: any[]): Promise<T[]> {
  try {
    const result = await sql(queryText, params);
    return result as T[];
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export default sql;
