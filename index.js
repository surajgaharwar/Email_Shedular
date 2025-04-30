// // task-reminder-app/package.json
// {
//   "name": "task-reminder-app",
//   "version": "1.0.0",
//   "description": "Task Reminder System with daily notifications",
//   "main": "server.js",
//   "scripts": {
//     "start": "node server.js",
//     "dev": "nodemon server.js"
//   },
//   "dependencies": {
//     "cron": "^2.3.0",
//     "date-fns": "^2.30.0",
//     "dotenv": "^16.0.3",
//     "express": "^4.18.2",
//     "mongoose": "^7.1.0",
//     "nodemailer": "^6.9.1",
//     "socket.io": "^4.6.1"
//   },
//   "devDependencies": {
//     "nodemon": "^2.0.22"
//   }
// }

// // task-reminder-app/.env (create this file with your actual credentials)
// PORT=3000
// MONGODB_URI=mongodb://localhost:27017/task-reminder
// EMAIL_SERVICE=gmail
// EMAIL_USER=your-email@gmail.com
// EMAIL_PASS=your-app-password
// NODE_ENV=development

// // task-reminder-app/server.js
// require('dotenv').config();
// const express = require('express');
// const mongoose = require('mongoose');
// const path = require('path');
// const http = require('http');
// const socketIo = require('socket.io');

// // Import services
// const { startScheduler } = require('./services/schedulerService');
// const taskRoutes = require('./routes/taskRoutes');

// // Initialize Express app
// const app = express();
// const server = http.createServer(app);
// const io = socketIo(server);

// // Middleware
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(express.static(path.join(__dirname, 'public')));

// // Socket.io for real-time notifications
// io.on('connection', (socket) => {
//   console.log('A client connected:', socket.id);
  
//   socket.on('disconnect', () => {
//     console.log('Client disconnected:', socket.id);
//   });
// });

// // Make io accessible to our routes
// app.use((req, res, next) => {
//   req.io = io;
//   next();
// });

// // Routes
// app.use('/api/tasks', taskRoutes);

// // Serve the frontend
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

// // Connect to MongoDB
// mongoose.connect(process.env.MONGODB_URI)
//   .then(() => {
//     console.log('Connected to MongoDB');
    
//     // Start the server
//     const PORT = process.env.PORT || 3000;
//     server.listen(PORT, () => {
//       console.log(`Server running on port ${PORT}`);
      
//       // Start the scheduler
//       startScheduler(io);
//     });
//   })
//   .catch(err => console.error('Failed to connect to MongoDB:', err));

// // task-reminder-app/models/Task.js
// const mongoose = require('mongoose');

// const TaskSchema = new mongoose.Schema({
//   title: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   description: {
//     type: String,
//     trim: true
//   },
//   deadline: {
//     type: Date,
//     required: true
//   },
//   email: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   userName: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   completed: {
//     type: Boolean,
//     default: false
//   },
//   reminderSent: {
//     type: Boolean,
//     default: false
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// const Task = mongoose.model('Task', TaskSchema);

// module.exports = Task;

// // task-reminder-app/services/schedulerService.js
// const cron = require('cron');
// const { checkTaskDeadlines } = require('./reminderService');

// /**
//  * Start the scheduler that runs the task deadline check daily
//  * @param {Object} io - Socket.io instance for real-time notifications
//  */
// function startScheduler(io) {
//   // Schedule to run at 9:00 AM every day
//   const dailyJob = new cron.CronJob('0 9 * * *', () => {
//     console.log('Running daily task deadline check...');
//     checkTaskDeadlines(io);
//   });

//   // Start the job
//   dailyJob.start();
//   console.log('Scheduler started');
  
//   // For development/testing - also run immediately upon startup
//   if (process.env.NODE_ENV === 'development') {
//     console.log('Running initial task check (development mode)');
//     checkTaskDeadlines(io);
//   }
// }

// module.exports = { startScheduler };

// // task-reminder-app/services/reminderService.js
// const { addDays, differenceInDays } = require('date-fns');
// const Task = require('../models/Task');
// const { sendReminderEmail } = require('./emailService');

// /**
//  * Check all tasks and send reminders for those with deadlines in 3-4 days
//  * @param {Object} io - Socket.io instance for real-time notifications
//  */
// async function checkTaskDeadlines(io) {
//   try {
//     const today = new Date();
//     const threeDaysFromNow = addDays(today, 3);
//     const fourDaysFromNow = addDays(today, 4);
    
//     // Find tasks with deadlines between 3 and 4 days from now and not completed
//     const eligibleTasks = await Task.find({
//       deadline: {
//         $gte: threeDaysFromNow,
//         $lte: fourDaysFromNow
//       },
//       completed: false,
//       reminderSent: false
//     });
    
//     console.log(`Found ${eligibleTasks.length} eligible tasks for reminders`);
    
//     // Process each eligible task
//     for (const task of eligibleTasks) {
//       // Calculate days until deadline
//       const daysUntilDeadline = differenceInDays(task.deadline, today);
      
//       // Send email reminder
//       await sendReminderEmail(task.email, task.userName, task, daysUntilDeadline);
      
//       // Send real-time notification to frontend
//       io.emit('task-reminder', {
//         taskId: task._id,
//         title: task.title,
//         deadline: task.deadline,
//         email: task.email,
//         daysRemaining: daysUntilDeadline
//       });
      
//       // Mark reminder as sent
//       task.reminderSent = true;
//       await task.save();
      
//       console.log(`Reminder sent for task "${task.title}" to ${task.email}`);
//     }
    
//     console.log('Task deadline check completed');
//   } catch (error) {
//     console.error('Error checking task deadlines:', error);
//   }
// }

// module.exports = { checkTaskDeadlines };

// // task-reminder-app/services/emailService.js
// const nodemailer = require('nodemailer');
// const { format } = require('date-fns');

// // Create mail transporter
// const transporter = nodemailer.createTransport({
//   service: process.env.EMAIL_SERVICE,
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS
//   }
// });

// /**
//  * Send a reminder email for an upcoming task deadline
//  * @param {string} email - Recipient email
//  * @param {string} name - Recipient name
//  * @param {Object} task - Task data
//  * @param {number} daysRemaining - Days until deadline
//  */
// async function sendReminderEmail(email, name, task, daysRemaining) {
//   try {
//     const formattedDate = format(task.deadline, 'MMMM dd, yyyy');
    
//     const mailOptions = {
//       from: process.env.EMAIL_USER,
//       to: email,
//       subject: `Task Reminder: "${task.title}" is due in ${daysRemaining} days`,
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           <h2>Task Deadline Reminder</h2>
//           <p>Hello ${name},</p>
//           <p>This is a friendly reminder that your task <strong>"${task.title}"</strong> is due in <strong>${daysRemaining} days</strong> (${formattedDate}).</p>
//           <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
//             <h3 style="margin-top: 0;">${task.title}</h3>
//             <p style="margin-bottom: 5px;"><strong>Description:</strong> ${task.description || 'No description provided'}</p>
//             <p style="margin-bottom: 0;"><strong>Due Date:</strong> ${formattedDate}</p>
//           </div>
//           <p>Please make sure to complete this task before the deadline.</p>
//           <p>Thank you!</p>
//           <p>Task Reminder System</p>
//         </div>
//       `
//     };
    
//     const info = await transporter.sendMail(mailOptions);
//     console.log('Email sent:', info.messageId);
//     return info;
//   } catch (error) {
//     console.error('Error sending reminder email:', error);
//     throw error;
//   }
// }

// module.exports = { sendReminderEmail };

// // task-reminder-app/routes/taskRoutes.js
// const express = require('express');
// const router = express.Router();
// const Task = require('../models/Task');

// // Get all tasks
// router.get('/', async (req, res) => {
//   try {
//     const tasks = await Task.find().sort({ deadline: 1 });
//     res.json(tasks);
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// });

// // Get a specific task
// router.get('/:id', async (req, res) => {
//   try {
//     const task = await Task.findById(req.params.id);
//     if (!task) {
//       return res.status(404).json({ message: 'Task not found' });
//     }
//     res.json(task);
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// });

// // Create a new task
// router.post('/', async (req, res) => {
//   try {
//     const { title, description, deadline, email, userName } = req.body;
    
//     if (!title || !deadline || !email || !userName) {
//       return res.status(400).json({ message: 'Title, deadline, email and userName are required' });
//     }
    
//     const newTask = new Task({
//       title,
//       description,
//       deadline: new Date(deadline),
//       email,
//       userName,
//     });
    
//     const savedTask = await newTask.save();
    
//     // Notify clients about new task
//     req.io.emit('new-task', savedTask);
    
//     res.status(201).json(savedTask);
//   } catch (error) {
//     res.status(400).json({ message: 'Invalid task data', error: error.message });
//   }
// });

// // Update a task
// router.put('/:id', async (req, res) => {
//   try {
//     const { title, description, deadline, email, userName, completed } = req.body;
    
//     const updatedTask = await Task.findByIdAndUpdate(
//       req.params.id,
//       { title, description, deadline: new Date(deadline), email, userName, completed },
//       { new: true, runValidators: true }
//     );
    
//     if (!updatedTask) {
//       return res.status(404).json({ message: 'Task not found' });
//     }
    
//     // Notify clients about updated task
//     req.io.emit('update-task', updatedTask);
    
//     res.json(updatedTask);
//   } catch (error) {
//     res.status(400).json({ message: 'Invalid task data', error: error.message });
//   }
// });

// // Mark a task as completed
// router.patch('/:id/complete', async (req, res) => {
//   try {
//     const task = await Task.findByIdAndUpdate(
//       req.params.id,
//       { completed: true },
//       { new: true }
//     );
    
//     if (!task) {
//       return res.status(404).json({ message: 'Task not found' });
//     }
    
//     // Notify clients about completed task
//     req.io.emit('complete-task', task);
    
//     res.json(task);
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// });

// // Delete a task
// router.delete('/:id', async (req, res) => {
//   try {
//     const task = await Task.findByIdAndDelete(req.params.id);
    
//     if (!task) {
//       return res.status(404).json({ message: 'Task not found' });
//     }
    
//     // Notify clients about deleted task
//     req.io.emit('delete-task', req.params.id);
    
//     res.json({ message: 'Task deleted successfully' });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// });

// module.exports = router;

// // task-reminder-app/public/index.html
// <!DOCTYPE html>
// <html lang="en">
// <head>
//   <meta charset="UTF-8">
//   <meta name="viewport" content="width=device-width, initial-scale=1.0">
//   <title>Task Reminder System</title>
//   <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
//   <link rel="stylesheet" href="styles.css">
// </head>
// <body>
//   <div class="container">
//     <header>
//       <h1>Task Reminder System</h1>
//     </header>
    
//     <div class="notification-container" id="notificationContainer"></div>
    
//     <main>
//       <div class="task-form-container">
//         <h2>Add New Task</h2>
//         <form id="taskForm">
//           <div class="form-group">
//             <label for="title">Title</label>
//             <input type="text" id="title" name="title" required>
//           </div>
          
//           <div class="form-group">
//             <label for="description">Description</label>
//             <textarea id="description" name="description" rows="3"></textarea>
//           </div>
          
//           <div class="form-group">
//             <label for="deadline">Deadline</label>
//             <input type="date" id="deadline" name="deadline" required>
//           </div>
          
//           <div class="form-group">
//             <label for="email">Email</label>
//             <input type="email" id="email" name="email" required>
//           </div>
          
//           <div class="form-group">
//             <label for="userName">Name</label>
//             <input type="text" id="userName" name="userName" required>
//           </div>
          
//           <button type="submit" class="btn">Add Task</button>
//         </form>
//       </div>
      
//       <div class="tasks-container">
//         <h2>Tasks</h2>
//         <div class="tasks-list" id="tasksList">
//           <!-- Tasks will be rendered here -->
//           <div class="loading">Loading tasks...</div>
//         </div>
//       </div>
//     </main>
//   </div>
  
//   <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.6.1/socket.io.min.js"></script>
//   <script src="app.js"></script>
// </body>
// </html>

// // task-reminder-app/public/styles.css
// * {
//   box-sizing: border-box;
//   margin: 0;
//   padding: 0;
// }

// body {
//   font-family: Arial, sans-serif;
//   line-height: 1.6;
//   background-color: #f4f7fa;
//   color: #333;
// }

// .container {
//   max-width: 1200px;
//   margin: 0 auto;
//   padding: 20px;
// }

// header {
//   margin-bottom: 30px;
//   text-align: center;
// }

// header h1 {
//   font-size: 2.5rem;
//   color: #2c3e50;
//   margin-bottom: 10px;
// }

// .notification-container {
//   position: fixed;
//   top: 20px;
//   right: 20px;
//   width: 300px;
//   z-index: 1000;
// }

// .notification {
//   background-color: #fff;
//   border-left: 4px solid #3498db;
//   box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
//   padding: 15px;
//   margin-bottom: 10px;
//   border-radius: 4px;
//   animation: slideIn 0.3s ease-out forwards;
// }

// .notification-header {
//   display: flex;
//   justify-content: space-between;
//   margin-bottom: 5px;
// }

// .notification-title {
//   font-weight: bold;
//   color: #2c3e50;
// }

// .notification-close {
//   cursor: pointer;
//   color: #7f8c8d;
// }

// .notification-message {
//   font-size: 0.9rem;
// }

// @keyframes slideIn {
//   from {
//     transform: translateX(100%);
//     opacity: 0;
//   }
//   to {
//     transform: translateX(0);
//     opacity: 1;
//   }
// }

// main {
//   display: flex;
//   gap: 30px;
// }

// .task-form-container {
//   flex: 1;
//   background-color: #fff;
//   border-radius: 8px;
//   padding: 20px;
//   box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
// }

// .tasks-container {
//   flex: 2;
//   background-color: #fff;
//   border-radius: 8px;
//   padding: 20px;
//   box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
// }

// h2 {
//   color: #2c3e50;
//   margin-bottom: 20px;
//   font-size: 1.5rem;
// }

// .form-group {
//   margin-bottom: 15px;
// }

// label {
//   display: block;
//   margin-bottom: 5px;
//   color: #7f8c8d;
//   font-size: 0.9rem;
// }

// input, textarea {
//   width: 100%;
//   padding: 10px;
//   border: 1px solid #ddd;
//   border-radius: 4px;
//   font-size: 1rem;
// }

// .btn {
//   display: inline-block;
//   background-color: #3498db;
//   color: #fff;
//   border: none;
//   padding: 10px 15px;
//   cursor: pointer;
//   border-radius: 4px;
//   font-size: 1rem;
//   transition: background-color 0.3s;
// }

// .btn:hover {
//   background-color: #2980b9;
// }

// .tasks-list {
//   display: flex;
//   flex-direction: column;
//   gap: 15px;
// }

// .task-item {
//   background-color: #f8f9fa;
//   border-radius: 6px;
//   padding: 15px;
//   box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
//   position: relative;
// }

// .task-header {
//   display: flex;
//   justify-content: space-between;
//   margin-bottom: 10px;
// }

// .task-title {
//   font-weight: bold;
//   color: #2c3e50;
//   font-size: 1.1rem;
// }

// .task-email {
//   color: #7f8c8d;
//   font-size: 0.9rem;
// }

// .task-description {
//   color: #555;
//   margin-bottom: 10px;
// }

// .task-meta {
//   display: flex;
//   justify-content: space-between;
//   font-size: 0.85rem;
//   color: #7f8c8d;
// }

// .task-deadline {
//   display: flex;
//   align-items: center;
//   gap: 5px;
// }

// .task-deadline i {
//   color: #e74c3c;
// }

// .task-actions {
//   display: flex;
//   gap: 10px;
// }

// .btn-complete {
//   background-color: #2ecc71;
// }

// .btn-complete:hover {
//   background-color: #27ae60;
// }

// .btn-delete {
//   background-color: #e74c3c;
// }

// .btn-delete:hover {
//   background-color: #c0392b;
// }

// .task-completed {
//   background-color: #e8f7f0;
//   border-left: 4px solid #2ecc71;
// }

// .task-completed .task-title {
//   text-decoration: line-through;
//   color: #7f8c8d;
// }

// .loading {
//   text-align: center;
//   color: #7f8c8d;
//   padding: 20px 0;
// }

// /* Responsive design */
// @media (max-width: 768px) {
//   main {
//     flex-direction: column;
//   }
// }

// // task-reminder-app/public/app.js
// document.addEventListener('DOMContentLoaded', () => {
//   // Connect to Socket.io server
//   const socket = io();
  
//   // DOM elements
//   const taskForm = document.getElementById('taskForm');
//   const tasksList = document.getElementById('tasksList');
//   const notificationContainer = document.getElementById('notificationContainer');
  
//   // Load initial tasks
//   fetchTasks();
  
//   // Event listeners
//   taskForm.addEventListener('submit', handleAddTask);
  
//   // Socket.io event listeners
//   socket.on('task-reminder', handleTaskReminder);
//   socket.on('new-task', handleNewTask);
//   socket.on('update-task', handleUpdateTask);
//   socket.on('complete-task', handleTaskUpdate);
//   socket.on('delete-task', handleTaskDelete);
  
//   /**
//    * Fetch all tasks from the API
//    */
//   async function fetchTasks() {
//     try {
//       const response = await fetch('/api/tasks');
//       const tasks = await response.json();
      
//       tasksList.innerHTML = '';
      
//       if (tasks.length === 0) {
//         tasksList.innerHTML = '<div class="empty-state">No tasks found. Add a new task to get started.</div>';
//         return;
//       }
      
//       tasks.forEach(task => {
//         tasksList.appendChild(createTaskElement(task));
//       });
//     } catch (error) {
//       console.error('Error fetching tasks:', error);
//       tasksList.innerHTML = '<div class="error">Failed to load tasks. Please try again later.</div>';
//     }
//   }
  
//   /**
//    * Handle adding a new task
//    * @param {Event} e - Form submit event
//    */
//   async function handleAddTask(e) {
//     e.preventDefault();
    
//     const formData = new FormData(taskForm);
//     const taskData = {
//       title: formData.get('title'),
//       description: formData.get('description'),
//       deadline: formData.get('deadline'),
//       email: formData.get('email'),
//       userName: formData.get('userName')
//     };
    
//     try {
//       const response = await fetch('/api/tasks', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify(taskData)
//       });
      
//       if (!response.ok) {
//         throw new Error('Failed to add task');
//       }
      
//       // Clear form
//       taskForm.reset();
      
//       // Task will be added by the socket event
//     } catch (error) {
//       console.error('Error adding task:', error);
//       showNotification('Error', 'Failed to add task. Please try again.');
//     }
//   }
  
//   /**
//    * Handle task reminder notification from socket
//    * @param {Object} data - Task reminder data
//    */
//   function handleTaskReminder(data) {
//     const { title, daysRemaining, email } = data;
    
//     const message = `Task "${title}" for ${email} is due in ${daysRemaining} days!`;
//     showNotification('Reminder', message, 'warning');
    
//     // Update UI if the task exists in the list
//     const taskElement = document.getElementById(`task-${data.taskId}`);
//     if (taskElement) {
//       fetchTasks(); // Refresh the task list
//     }
//   }
  
//   /**
//    * Handle new task added from socket
//    * @param {Object} task - New task data
//    */
//   function handleNewTask(task) {
//     const taskElement = createTaskElement(task);
    
//     // Remove empty state if present
//     const emptyState = tasksList.querySelector('.empty-state');
//     if (emptyState) {
//       tasksList.removeChild(emptyState);
//     }
    
//     // Add new task at the beginning
//     if (tasksList.firstChild) {
//       tasksList.insertBefore(taskElement, tasksList.firstChild);
//     } else {
//       tasksList.appendChild(taskElement);
//     }
    
//     showNotification('Success', `Task "${task.title}" added successfully!`);
//   }
  
//   /**
//    * Handle task update from socket
//    * @param {Object} task - Updated task data
//    */
//   function handleUpdateTask(task) {
//     const existingTask = document.getElementById(`task-${task._id}`);
//     if (existingTask) {
//       const newTaskElement = createTaskElement(task);
//       tasksList.replaceChild(newTaskElement, existingTask);
//     }
//   }
  
//   /**
//    * Handle task completion
//    * @param {string} taskId - Task ID
//    */
//   async function completeTask(taskId) {
//     try {
//       const response = await fetch(`/api/tasks/${taskId}/complete`, {
//         method: 'PATCH'
//       });
      
//       if (!response.ok) {
//         throw new Error('Failed to complete task');
//       }
      
//       // Task will be updated by the socket event
//     } catch (error) {
//       console.error('Error completing task:', error);
//       showNotification('Error', 'Failed to complete task. Please try again.');
//     }
//   }
  
//   /**
//    * Handle task deletion
//    * @param {string} taskId - Task ID
//    */
//   async function deleteTask(taskId) {
//     if (!confirm('Are you sure you want to delete this task?')) {
//       return;
//     }
    
//     try {
//       const response = await fetch(`/api/tasks/${taskId}`, {
//         method: 'DELETE'
//       });
      
//       if (!response.ok) {
//         throw new Error('Failed to delete task');
//       }
      
//       // Task will be removed by the socket event
//     } catch (error) {
//       console.error('Error deleting task:', error);
//       showNotification('Error', 'Failed to delete task. Please try again.');
//     }
//   }
  
//   /**
//    * Handle task update from socket
//    * @param {Object} task - Updated task data
//    */
//   function handleTaskUpdate(task) {
//     const existingTask = document.getElementById(`task-${task._id}`);
//     if (existingTask) {
//       const newTaskElement = createTaskElement(task);
//       tasksList.replaceChild(newTaskElement, existingTask);
//     }
//   }
  
//   /**
//    * Handle task deletion from socket
//    * @param {string} taskId - Deleted task ID
//    */
//   function handleTaskDelete(taskId) {
//     const taskElement = document.getElementById(`task-${taskId}`);
//     if (taskElement) {
//       tasksList.removeChild(taskElement);
      
//       // Show empty state if no tasks left
//       if (tasksList.children.length === 0) {
//         tasksList.innerHTML = '<div class="empty-state">No tasks found. Add a new task to get started.</div>';
//       }
//     }
//   }
  
//   /**
//    * Create task DOM element
//    * @param {Object} task - Task data
//    * @returns {HTMLElement} Task element
//    */
//   function createTaskElement(task) {
//     const taskElement = document.createElement('div');
//     taskElement.className = `task-item ${task.completed ? 'task-completed' : ''}`;
//     taskElement.id = `task-${task._id}`;
    
//     const deadlineDate = new Date(task.deadline);
//     const formattedDate = deadlineDate.toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric'
//     });
    
//     taskElement.innerHTML = `
//       <div class="task-header">
//         <div class="task-title">${task.title}</div>
//         <div class="task-email">${task.email}</div>
//       </div>
//       <div class="task-description">${task.description || 'No description'}</div>
//       <div class="task-meta">
//         <div class="task-deadline">
//           <i class="fas fa-calendar-alt"></i>
//           <span>${formattedDate}</span>
//         </div>
//         <div class="task-name">
//           <i class="fas fa-user"></i>
//           <span>${task.userName}</span>
//         </div>
//       </div>
//       ${!task.completed ? `
//         <div class="task-actions">
//           <button class="btn btn-complete btn-sm" data-task-id="${task._id}">
//             <i class="fas fa-check"></i> Complete
//           </button>
//           <button class="btn btn-delete btn-sm" data-task-id="${task._id}">
//             <i class="fas fa-trash"></i> Delete
//           </button>
//         </div>
//       ` : ''}
//     `;
    
//     // Add event listeners to buttons
//     if (!task.completed) {
//       const completeBtn = taskElement.querySelector('.btn-complete');
//       const deleteBtn = taskElement.querySelector('.btn-delete');
      
//       completeBtn.addEventListener('click', () => completeTask(task._id));
//       deleteBtn.addEventListener('click', () => deleteTask(task._id));
//     }
    
//     return taskElement;
//   }
  
//   /**
//    * Show notification
//    * @param {string} title - Notification title
//    * @param {string} message - Notification message
//    * @param {string} type - Notification type (success, warning, error)
//    */
//   function showNotification(title, message, type = 'success') {
//     const notification = document.createElement('div');
//     notification.className = `notification notification-${type}`;
    
//     notification.innerHTML = `
//       <div class="notification-header">
//         <div class="notification-title">${title}</div>
//         <div class="notification-close">&times;</div>
//       </div>
//       <div class="notification-message">${message}</div>
//     `;
    
//     // Add notification to container
//     notificationContainer.appendChild(notification);
    
//     // Add close event listener
//     const closeBtn = notification.querySelector('.notification-close');
//     closeBtn.addEventListener('click', () => {
//       notification.remove();
//     });
    
//     // Auto-remove after 5 seconds
//     setTimeout(() => {
//       if (notification.parentNode) {
//         notification.remove();
//       }
//     }, 5000);
//   }
// });