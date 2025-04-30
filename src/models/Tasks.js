  const mongoose = require('mongoose');
  
  const TaskSchema = new mongoose.Schema({
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    deadline: {
      type: Date,
      required: true
    },
    time: { 
        type: String
    }, 
    email: {
      type: String,
      required: true,
      trim: true
    },
    userName: {
      type: String,
      required: true,
      trim: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    reminderSent: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  });
  
  const Task = mongoose.model('Task', TaskSchema);
  
  module.exports = Task;