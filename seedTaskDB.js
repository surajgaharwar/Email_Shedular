// task-reminder-app/seedDatabase.js
require('dotenv').config();
const mongoose = require('mongoose');
const Task = require('./src/models/Tasks');
const { addDays } = require('date-fns');

// Sample task data
const sampleTasks = [
  {
    title: 'Complete Project Proposal',
    description: 'Finish and submit the proposal for the new client project',
    deadline: addDays(new Date(), 3), // 3 days from now - should trigger reminder
    email: 'user1@example.com',
    userName: 'John Doe',
    completed: false,
    reminderSent: false
  },
  {
    title: 'Quarterly Report',
    description: 'Prepare and submit Q2 financial reports',
    deadline: addDays(new Date(), 4), // 4 days from now - should trigger reminder
    email: 'user2@example.com',
    userName: 'Jane Smith',
    completed: false,
    reminderSent: false
  },
  {
    title: 'Team Meeting',
    description: 'Prepare agenda for weekly team meeting',
    deadline: addDays(new Date(), 2), // 2 days from now - too soon for reminder
    email: 'user1@example.com',
    userName: 'John Doe',
    completed: false,
    reminderSent: false
  },
  {
    title: 'Client Presentation',
    description: 'Prepare slides for the client presentation',
    deadline: addDays(new Date(), 5), // 5 days from now - too far for reminder
    email: 'user3@example.com',
    userName: 'Robert Johnson',
    completed: false,
    reminderSent: false
  },
  {
    title: 'Software Update',
    description: 'Deploy the latest software update to production',
    deadline: addDays(new Date(), 3), // 3 days from now - should trigger reminder
    email: 'user4@example.com',
    userName: 'Emily Brown',
    completed: false,
    reminderSent: false
  }
];

// Seed the database
async function seedDatabase() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Clear existing tasks
    console.log('Clearing existing tasks...');
    await Task.deleteMany({});
    
    // Insert sample tasks
    console.log('Inserting sample tasks...');
    const result = await Task.insertMany(sampleTasks);
    
    console.log(`Database seeded with ${result.length} tasks`);
    console.log('Tasks that should trigger reminders:');
    result.forEach(task => {
      const daysUntilDeadline = Math.ceil((task.deadline - new Date()) / (1000 * 60 * 60 * 24));
      if (daysUntilDeadline >= 3 && daysUntilDeadline <= 4) {
        console.log(`- "${task.title}" (${daysUntilDeadline} days until deadline)`);
      }
    });
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the seeding
seedDatabase();