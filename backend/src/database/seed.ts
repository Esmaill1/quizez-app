import sql from './connection';
import bcrypt from 'bcrypt';

async function seed() {
  console.log('🌱 Seeding database with enriched data...\n');

  try {
    // Clear existing data (order matters due to foreign keys)
    await sql`DELETE FROM student_answer_items`;
    await sql`DELETE FROM student_answers`;
    await sql`DELETE FROM quiz_sessions`;
    await sql`DELETE FROM question_items`;
    await sql`DELETE FROM questions`;
    await sql`DELETE FROM topics`;
    await sql`DELETE FROM chapters`;
    await sql`DELETE FROM users`;
    console.log('✅ Cleared existing data\n');

    // ============================================
    // Default Admin User
    // ============================================
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash('admin123', saltRounds);
    await sql`
      INSERT INTO users (username, password_hash, role)
      VALUES ('admin', ${passwordHash}, 'admin')
    `;
    console.log('👤 Created Default Admin: admin / admin123');

    // ============================================
    // Chapter 1: Daily Routine
    // ============================================
    const chapter1 = await sql`
      INSERT INTO chapters (name, description, order_index)
      VALUES ('Daily Routine', 'Practice ordering everyday activities', 1)
      RETURNING id
    `;
    console.log('📖 Created Chapter 1: Daily Routine');

    // Topic 1.1: Morning Activities
    const topic1_1 = await sql`
      INSERT INTO topics (chapter_id, name, description, order_index)
      VALUES (${chapter1[0].id}, 'Morning Activities', 'Things we do every morning', 1)
      RETURNING id
    `;
    console.log('   📁 Topic: Morning Activities');

    // Question: Morning routine (Easy, Timed)
    const q1 = await sql`
      INSERT INTO questions (
        topic_id, title, description, explanation, 
        time_limit, difficulty, tags, order_index
      )
      VALUES (
        ${topic1_1[0].id}, 
        'Morning Routine', 
        'Arrange these morning activities in the correct order', 
        'A good morning routine starts with self-care (waking up, hygiene) and ends with preparation for the day (breakfast, leaving).',
        30,
        'easy',
        ${['lifestyle', 'health'] as any},
        1
      )
      RETURNING id
    `;
    const morningItems = ['Wake up', 'Brush teeth', 'Take a shower', 'Get dressed', 'Eat breakfast', 'Leave for school'];
    for (let i = 0; i < morningItems.length; i++) {
      await sql`INSERT INTO question_items (question_id, item_text, correct_position) VALUES (${q1[0].id}, ${morningItems[i]}, ${i + 1})`;
    }
    console.log('      ✓ Morning Routine (Easy, 30s)');

    // ============================================
    // Chapter 2: Science (Visual & Hard)
    // ============================================
    const chapter2 = await sql`
      INSERT INTO chapters (name, description, order_index)
      VALUES ('Science', 'Order scientific processes and concepts', 2)
      RETURNING id
    `;
    console.log('\n📖 Created Chapter 2: Science');

    // Topic 2.1: Space & Astronomy
    const topic2_1 = await sql`
      INSERT INTO topics (chapter_id, name, description, order_index)
      VALUES (${chapter2[0].id}, 'Space & Astronomy', 'Our universe and solar system', 1)
      RETURNING id
    `;
    console.log('   📁 Topic: Space & Astronomy');

    // Question: Planets (Visual, Hard)
    const qSpace = await sql`
      INSERT INTO questions (
        topic_id, title, description, explanation, 
        difficulty, tags, order_index
      )
      VALUES (
        ${topic2_1[0].id}, 
        'Planets by Distance from Sun', 
        'Order the planets starting closest to the Sun', 
        'Mercury is closest, followed by Venus, Earth, and Mars. These are the inner rocky planets.',
        'medium',
        ${['astronomy', 'space', 'visual'] as any},
        1
      )
      RETURNING id
    `;
    
    // Items with placeholder images (using reliable placeholder service)
    const planetItems = [
      { text: 'Mercury', img: 'https://placehold.co/100x100/95a5a6/ffffff?text=Mercury' },
      { text: 'Venus', img: 'https://placehold.co/100x100/e67e22/ffffff?text=Venus' },
      { text: 'Earth', img: 'https://placehold.co/100x100/3498db/ffffff?text=Earth' },
      { text: 'Mars', img: 'https://placehold.co/100x100/c0392b/ffffff?text=Mars' }
    ];
    
    for (let i = 0; i < planetItems.length; i++) {
      await sql`
        INSERT INTO question_items (question_id, item_text, image_url, correct_position) 
        VALUES (${qSpace[0].id}, ${planetItems[i].text}, ${planetItems[i].img}, ${i + 1})
      `;
    }
    console.log('      ✓ Planets (Visual items)');

    // ============================================
    // Chapter 3: History (Rich Feedback)
    // ============================================
    const chapter3 = await sql`
      INSERT INTO chapters (name, description, order_index)
      VALUES ('History', 'Order historical events chronologically', 3)
      RETURNING id
    `;
    console.log('\n📖 Created Chapter 3: History');

    // Topic 3.1: US History
    const topic3_1 = await sql`
      INSERT INTO topics (chapter_id, name, description, order_index)
      VALUES (${chapter3[0].id}, 'US History', 'Key events in American history', 1)
      RETURNING id
    `;

    // Question: Founding Documents
    const qHist = await sql`
      INSERT INTO questions (
        topic_id, title, description, explanation, 
        difficulty, tags, order_index
      )
      VALUES (
        ${topic3_1[0].id}, 
        'Founding Documents', 
        'Order these documents by the year they were signed', 
        'The Magna Carta (1215) influenced the Mayflower Compact (1620). The Declaration (1776) declared independence, followed by the Constitution (1787) which established the government.',
        'hard',
        ${['history', 'usa', 'politics'] as any},
        1
      )
      RETURNING id
    `;
    
    const docItems = ['Magna Carta', 'Mayflower Compact', 'Declaration of Independence', 'US Constitution'];
    for (let i = 0; i < docItems.length; i++) {
      await sql`INSERT INTO question_items (question_id, item_text, correct_position) VALUES (${qHist[0].id}, ${docItems[i]}, ${i + 1})`;
    }
    console.log('      ✓ Founding Documents (Hard, Rich Explanation)');

    console.log('\n🎉 Seed completed successfully with new features!');
    console.log('   • Images, Timers, Difficulties, and Tags seeded.');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();