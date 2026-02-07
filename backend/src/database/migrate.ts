import sql from './connection';

async function migrate() {
  console.log('🚀 Starting database migration...');

  try {
    // Drop existing tables in reverse order (for clean migration)
    console.log('🧹 Cleaning up existing tables...');
    await sql`DROP TABLE IF EXISTS student_answer_items CASCADE`;
    await sql`DROP TABLE IF EXISTS student_answers CASCADE`;
    await sql`DROP TABLE IF EXISTS quiz_sessions CASCADE`;
    await sql`DROP TABLE IF EXISTS question_items CASCADE`;
    await sql`DROP TABLE IF EXISTS questions CASCADE`;
    await sql`DROP TABLE IF EXISTS topics CASCADE`;
    await sql`DROP TABLE IF EXISTS chapters CASCADE`;
    await sql`DROP TABLE IF EXISTS users CASCADE`;
    console.log('✅ Cleaned up existing tables');

    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Created users table');

    // Create chapters table
    await sql`
      CREATE TABLE IF NOT EXISTS chapters (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        order_index INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Created chapters table');

    // Create topics table (between chapters and questions)
    await sql`
      CREATE TABLE IF NOT EXISTS topics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        order_index INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Created topics table');

    // Create questions table (references topics)
    await sql`
      CREATE TABLE IF NOT EXISTS questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        explanation TEXT,
        time_limit INTEGER,
        difficulty VARCHAR(50) DEFAULT 'medium',
        tags TEXT[],
        order_index INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Created questions table');

    // Create question_items table (the items to be ordered)
    await sql`
      CREATE TABLE IF NOT EXISTS question_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
        item_text TEXT NOT NULL,
        image_url TEXT,
        correct_position INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Created question_items table');

    // Create quiz_sessions table (tracks a complete topic quiz attempt)
    await sql`
      CREATE TABLE IF NOT EXISTS quiz_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
        student_session_id VARCHAR(255) NOT NULL,
        student_nickname VARCHAR(255),
        started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP WITH TIME ZONE,
        current_question_index INTEGER NOT NULL DEFAULT 0,
        total_questions INTEGER NOT NULL DEFAULT 0,
        total_score DECIMAL(10, 2) NOT NULL DEFAULT 0,
        max_possible_score DECIMAL(10, 2) NOT NULL DEFAULT 0,
        percentage DECIMAL(5, 2) NOT NULL DEFAULT 0,
        is_completed BOOLEAN NOT NULL DEFAULT FALSE
      )
    `;
    console.log('✅ Created quiz_sessions table');

    // Create student_answers table (stores each submission)
    await sql`
      CREATE TABLE IF NOT EXISTS student_answers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
        student_session_id VARCHAR(255) NOT NULL,
        quiz_session_id UUID REFERENCES quiz_sessions(id) ON DELETE CASCADE,
        submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        total_score DECIMAL(10, 2) NOT NULL DEFAULT 0,
        max_possible_score DECIMAL(10, 2) NOT NULL DEFAULT 0,
        percentage DECIMAL(5, 2) NOT NULL DEFAULT 0,
        time_taken INTEGER DEFAULT 0
      )
    `;
    console.log('✅ Created student_answers table');

    // Create student_answer_items table (stores each item's result)
    await sql`
      CREATE TABLE IF NOT EXISTS student_answer_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_answer_id UUID NOT NULL REFERENCES student_answers(id) ON DELETE CASCADE,
        question_item_id UUID NOT NULL REFERENCES question_items(id) ON DELETE CASCADE,
        submitted_position INTEGER NOT NULL,
        correct_position INTEGER NOT NULL,
        distance INTEGER NOT NULL,
        points_earned DECIMAL(10, 2) NOT NULL DEFAULT 0,
        max_points DECIMAL(10, 2) NOT NULL DEFAULT 0
      )
    `;
    console.log('✅ Created student_answer_items table');

    // Create indexes for better query performance
    await sql`CREATE INDEX IF NOT EXISTS idx_topics_chapter_id ON topics(chapter_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_questions_topic_id ON questions(topic_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_question_items_question_id ON question_items(question_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_student_answers_question_id ON student_answers(question_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_student_answers_session_id ON student_answers(student_session_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_student_answers_quiz_session ON student_answers(quiz_session_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_quiz_sessions_topic_id ON quiz_sessions(topic_id)`;
    console.log('✅ Created indexes');

    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
migrate();
