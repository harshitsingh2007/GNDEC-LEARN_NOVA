import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Calendar from '../Models/Calendar.js';

dotenv.config();

const DEFAULT_JWT_SECRET = 'novalearn_dev_secret_key';
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = DEFAULT_JWT_SECRET;
}

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/learn_novar', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.once('open', async () => {
  console.log('✅ Connected to MongoDB');
  
  try {
    // Step 1: List all indexes to see what exists
    console.log('📋 Checking existing indexes...');
    const indexes = await Calendar.collection.indexes();
    console.log('Current indexes:', indexes.map(idx => idx.name));
    
    // Step 2: Drop the problematic unique index (try multiple possible names)
    const indexNames = ['tasks.taskId_1', 'tasks.taskId_1_1', 'taskId_1'];
    for (const indexName of indexNames) {
      try {
        await Calendar.collection.dropIndex(indexName);
        console.log(`✅ Dropped index: ${indexName}`);
      } catch (error) {
        if (error.code === 27 || error.codeName === 'IndexNotFound') {
          console.log(`ℹ️  Index ${indexName} does not exist, skipping...`);
        } else {
          console.error(`⚠️  Error dropping index ${indexName}:`, error.message);
        }
      }
    }
    
    // Also try to drop any index that contains taskId
    for (const index of indexes) {
      if (index.key && index.key['tasks.taskId']) {
        try {
          await Calendar.collection.dropIndex(index.name);
          console.log(`✅ Dropped index: ${index.name} (contains tasks.taskId)`);
        } catch (error) {
          console.error(`⚠️  Error dropping index ${index.name}:`, error.message);
        }
      }
    }

    // Step 2: Fix all calendars with null or missing taskIds
    console.log('🔧 Fixing calendars with null or missing taskIds...');
    const calendars = await Calendar.find({});
    let fixedCount = 0;
    let taskFixedCount = 0;

    for (const calendar of calendars) {
      let needsSave = false;
      
      if (calendar.tasks && Array.isArray(calendar.tasks)) {
        calendar.tasks.forEach((task) => {
          if (!task.taskId || task.taskId === null || task.taskId === '') {
            task.taskId = new mongoose.Types.ObjectId().toString();
            needsSave = true;
            taskFixedCount++;
          }
        });
        
        if (needsSave) {
          await calendar.save();
          fixedCount++;
          console.log(`✅ Fixed calendar ${calendar._id}: ${calendar.tasks.length} tasks`);
        }
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   - Fixed ${fixedCount} calendars`);
    console.log(`   - Fixed ${taskFixedCount} tasks with null/missing taskIds`);
    
  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  }
});

db.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

