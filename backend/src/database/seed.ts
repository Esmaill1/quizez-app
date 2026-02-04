import sql from './connection';

async function seed() {
  console.log('🌱 Seeding database with example data...\n');

  try {
    // Clear existing data (order matters due to foreign keys)
    await sql`DELETE FROM student_answer_items`;
    await sql`DELETE FROM student_answers`;
    await sql`DELETE FROM quiz_sessions`;
    await sql`DELETE FROM question_items`;
    await sql`DELETE FROM questions`;
    await sql`DELETE FROM topics`;
    await sql`DELETE FROM chapters`;
    console.log('✅ Cleared existing data\n');

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

    // Question: Morning routine
    const q1 = await sql`
      INSERT INTO questions (topic_id, title, description, order_index)
      VALUES (${topic1_1[0].id}, 'Morning Routine', 'Arrange these morning activities in the correct order', 1)
      RETURNING id
    `;
    const morningItems = ['Wake up', 'Brush teeth', 'Take a shower', 'Get dressed', 'Eat breakfast', 'Leave for school'];
    for (let i = 0; i < morningItems.length; i++) {
      await sql`INSERT INTO question_items (question_id, item_text, correct_position) VALUES (${q1[0].id}, ${morningItems[i]}, ${i + 1})`;
    }
    console.log('      ✓ Morning Routine (6 items)');

    // Question: Getting ready for bed
    const q1b = await sql`
      INSERT INTO questions (topic_id, title, description, order_index)
      VALUES (${topic1_1[0].id}, 'Bedtime Routine', 'Arrange these bedtime activities in order', 2)
      RETURNING id
    `;
    const bedItems = ['Finish homework', 'Take a bath', 'Put on pajamas', 'Brush teeth', 'Read a book', 'Go to sleep'];
    for (let i = 0; i < bedItems.length; i++) {
      await sql`INSERT INTO question_items (question_id, item_text, correct_position) VALUES (${q1b[0].id}, ${bedItems[i]}, ${i + 1})`;
    }
    console.log('      ✓ Bedtime Routine (6 items)');

    // Topic 1.2: Cooking & Food
    const topic1_2 = await sql`
      INSERT INTO topics (chapter_id, name, description, order_index)
      VALUES (${chapter1[0].id}, 'Cooking & Food', 'Making food and meals', 2)
      RETURNING id
    `;
    console.log('   📁 Topic: Cooking & Food');

    // Question: Making a sandwich
    const q2 = await sql`
      INSERT INTO questions (topic_id, title, description, order_index)
      VALUES (${topic1_2[0].id}, 'Making a Sandwich', 'Put these steps in order to make a sandwich', 1)
      RETURNING id
    `;
    const sandwichItems = ['Get two slices of bread', 'Add cheese', 'Add lettuce and tomato', 'Put the top bread slice', 'Cut in half'];
    for (let i = 0; i < sandwichItems.length; i++) {
      await sql`INSERT INTO question_items (question_id, item_text, correct_position) VALUES (${q2[0].id}, ${sandwichItems[i]}, ${i + 1})`;
    }
    console.log('      ✓ Making a Sandwich (5 items)');

    // Question: Making tea
    const q2b = await sql`
      INSERT INTO questions (topic_id, title, description, order_index)
      VALUES (${topic1_2[0].id}, 'Making Tea', 'Order the steps to make a cup of tea', 2)
      RETURNING id
    `;
    const teaItems = ['Boil water', 'Put tea bag in cup', 'Pour hot water', 'Wait 3 minutes', 'Remove tea bag', 'Add sugar if desired'];
    for (let i = 0; i < teaItems.length; i++) {
      await sql`INSERT INTO question_items (question_id, item_text, correct_position) VALUES (${q2b[0].id}, ${teaItems[i]}, ${i + 1})`;
    }
    console.log('      ✓ Making Tea (6 items)');

    // ============================================
    // Chapter 2: Science
    // ============================================
    const chapter2 = await sql`
      INSERT INTO chapters (name, description, order_index)
      VALUES ('Science', 'Order scientific processes and concepts', 2)
      RETURNING id
    `;
    console.log('\n📖 Created Chapter 2: Science');

    // Topic 2.1: Nature Cycles
    const topic2_1 = await sql`
      INSERT INTO topics (chapter_id, name, description, order_index)
      VALUES (${chapter2[0].id}, 'Nature Cycles', 'Natural cycles in our environment', 1)
      RETURNING id
    `;
    console.log('   📁 Topic: Nature Cycles');

    // Question: Water cycle
    const q3 = await sql`
      INSERT INTO questions (topic_id, title, description, order_index)
      VALUES (${topic2_1[0].id}, 'The Water Cycle', 'Arrange the stages of the water cycle in order', 1)
      RETURNING id
    `;
    const waterItems = ['Evaporation (water heats up)', 'Condensation (clouds form)', 'Precipitation (rain falls)', 'Collection (water gathers)'];
    for (let i = 0; i < waterItems.length; i++) {
      await sql`INSERT INTO question_items (question_id, item_text, correct_position) VALUES (${q3[0].id}, ${waterItems[i]}, ${i + 1})`;
    }
    console.log('      ✓ The Water Cycle (4 items)');

    // Topic 2.2: Living Things
    const topic2_2 = await sql`
      INSERT INTO topics (chapter_id, name, description, order_index)
      VALUES (${chapter2[0].id}, 'Living Things', 'Growth and life cycles', 2)
      RETURNING id
    `;
    console.log('   📁 Topic: Living Things');

    // Question: Plant growth
    const q4 = await sql`
      INSERT INTO questions (topic_id, title, description, order_index)
      VALUES (${topic2_2[0].id}, 'Plant Growth', 'Order the stages of plant growth from seed to fruit', 1)
      RETURNING id
    `;
    const plantItems = ['Plant the seed', 'Seed germinates', 'Roots grow down', 'Stem grows up', 'Leaves appear', 'Flower blooms', 'Fruit develops'];
    for (let i = 0; i < plantItems.length; i++) {
      await sql`INSERT INTO question_items (question_id, item_text, correct_position) VALUES (${q4[0].id}, ${plantItems[i]}, ${i + 1})`;
    }
    console.log('      ✓ Plant Growth (7 items)');

    // Question: Butterfly lifecycle
    const q4b = await sql`
      INSERT INTO questions (topic_id, title, description, order_index)
      VALUES (${topic2_2[0].id}, 'Butterfly Life Cycle', 'Order the stages of a butterfly life cycle', 2)
      RETURNING id
    `;
    const butterflyItems = ['Egg is laid', 'Caterpillar hatches', 'Caterpillar eats and grows', 'Forms a chrysalis', 'Butterfly emerges', 'Butterfly flies away'];
    for (let i = 0; i < butterflyItems.length; i++) {
      await sql`INSERT INTO question_items (question_id, item_text, correct_position) VALUES (${q4b[0].id}, ${butterflyItems[i]}, ${i + 1})`;
    }
    console.log('      ✓ Butterfly Life Cycle (6 items)');

    // ============================================
    // Chapter 3: History
    // ============================================
    const chapter3 = await sql`
      INSERT INTO chapters (name, description, order_index)
      VALUES ('History', 'Order historical events chronologically', 3)
      RETURNING id
    `;
    console.log('\n📖 Created Chapter 3: History');

    // Topic 3.1: Inventions
    const topic3_1 = await sql`
      INSERT INTO topics (chapter_id, name, description, order_index)
      VALUES (${chapter3[0].id}, 'Inventions', 'Important inventions through history', 1)
      RETURNING id
    `;
    console.log('   📁 Topic: Inventions');

    // Question: Famous inventions
    const q5 = await sql`
      INSERT INTO questions (topic_id, title, description, order_index)
      VALUES (${topic3_1[0].id}, 'Famous Inventions', 'Order these inventions from oldest to newest', 1)
      RETURNING id
    `;
    const inventionItems = ['Wheel', 'Printing Press', 'Steam Engine', 'Telephone', 'Computer', 'Smartphone'];
    for (let i = 0; i < inventionItems.length; i++) {
      await sql`INSERT INTO question_items (question_id, item_text, correct_position) VALUES (${q5[0].id}, ${inventionItems[i]}, ${i + 1})`;
    }
    console.log('      ✓ Famous Inventions (6 items)');

    // ============================================
    // Chapter 4: Math Steps
    // ============================================
    const chapter4 = await sql`
      INSERT INTO chapters (name, description, order_index)
      VALUES ('Math Steps', 'Order of operations and problem solving', 4)
      RETURNING id
    `;
    console.log('\n📖 Created Chapter 4: Math Steps');

    // Topic 4.1: Order of Operations
    const topic4_1 = await sql`
      INSERT INTO topics (chapter_id, name, description, order_index)
      VALUES (${chapter4[0].id}, 'Order of Operations', 'Learn PEMDAS and problem solving steps', 1)
      RETURNING id
    `;
    console.log('   📁 Topic: Order of Operations');

    // Question: PEMDAS
    const q6 = await sql`
      INSERT INTO questions (topic_id, title, description, order_index)
      VALUES (${topic4_1[0].id}, 'Order of Operations (PEMDAS)', 'Arrange the order of operations from first to last', 1)
      RETURNING id
    `;
    const mathItems = ['Parentheses', 'Exponents', 'Multiplication', 'Division', 'Addition', 'Subtraction'];
    for (let i = 0; i < mathItems.length; i++) {
      await sql`INSERT INTO question_items (question_id, item_text, correct_position) VALUES (${q6[0].id}, ${mathItems[i]}, ${i + 1})`;
    }
    console.log('      ✓ Order of Operations (6 items)');

    // Question: Problem solving
    const q7 = await sql`
      INSERT INTO questions (topic_id, title, description, order_index)
      VALUES (${topic4_1[0].id}, 'Solving Word Problems', 'Order the steps to solve a math word problem', 2)
      RETURNING id
    `;
    const problemItems = ['Read the problem carefully', 'Identify what is being asked', 'Find the important numbers', 'Choose the operation', 'Solve the problem', 'Check your answer'];
    for (let i = 0; i < problemItems.length; i++) {
      await sql`INSERT INTO question_items (question_id, item_text, correct_position) VALUES (${q7[0].id}, ${problemItems[i]}, ${i + 1})`;
    }
    console.log('      ✓ Solving Word Problems (6 items)');

    console.log('\n🎉 Seed completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   • 4 Chapters');
    console.log('   • 7 Topics');
    console.log('   • 10 Questions');
    console.log('\n🚀 Start the app and try the quizzes!');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
