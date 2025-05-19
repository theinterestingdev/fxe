const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skill_exchange';

async function fixDatabase() {
  try {
    // Connect to the database
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the messages collection
    const db = mongoose.connection.db;
    
    try {
      // Drop the existing messages collection
      await db.collection('messages').drop();
      console.log('Successfully dropped the messages collection');
    } catch (err) {
      console.log('Collection does not exist or already dropped:', err.message);
    }
    
    try {
      // Create a new messages collection with proper indexes
      await db.createCollection('messages');
      console.log('Created messages collection');
      
      // Create proper indexes
      await db.collection('messages').createIndex({ senderId: 1, receiverId: 1 });
      await db.collection('messages').createIndex({ receiverId: 1, senderId: 1 });
      console.log('Created new indexes for messages collection');
    } catch (err) {
      console.error('Error creating collection or indexes:', err);
    }
    
    console.log('Database fix completed!');
    process.exit(0);
  } catch (err) {
    console.error('Database fix failed:', err);
    process.exit(1);
  }
}

// Run the fix
fixDatabase();
