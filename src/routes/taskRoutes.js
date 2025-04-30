const express = require('express');
const router = express.Router();
const Task = require('../models/Tasks');
const { checkTaskDeadlines }= require("../services/reminderService");
// Get all tasks
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find().sort({ deadline: 1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a specific task
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new task
router.post('/', async (req, res) => {
  try {
    const { title, description, deadline, email, userName } = req.body;
    
    if (!title || !deadline || !email || !userName ) {
      return res.status(400).json({ message: 'Title, deadline, email and userName,time are required' });
    }
    
    const newTask = new Task({
      title,
      description,
      deadline: new Date(deadline),
      email,
      userName,
    });
    
    const savedTask = await newTask.save();
    
    // Notify clients about new task
    req.io.emit('new-task', savedTask);
    try{
        checkTaskDeadlines(req.io);
    }catch(err){
        console.log("error while triggring task check");
    }
    res.status(201).json(savedTask);
  } catch (error) {
    res.status(400).json({ message: 'Invalid task data', error: error.message });
  }
});

// Update a task
router.put('/:id', async (req, res) => {
  try {
    const { title, description, deadline, email, userName, completed } = req.body;
    
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { title, description, deadline: new Date(deadline), email, userName, completed },
      { new: true, runValidators: true }
    );
    
    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Notify clients about updated task
    req.io.emit('update-task', updatedTask);
    try{
        checkTaskDeadlines(req.io);
    }catch(err){
        console.log("error while triggring task check");
    }
    res.json(updatedTask);
  } catch (error) {
    res.status(400).json({ message: 'Invalid task data', error: error.message });
  }
});

// Mark a task as completed
router.patch('/:id/complete', async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { completed: true },
      { new: true }
    );
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Notify clients about completed task
    req.io.emit('complete-task', task);
    
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Notify clients about deleted task
    req.io.emit('delete-task', req.params.id);
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});



module.exports = router;
