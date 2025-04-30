const { addDays, startOfDay,endOfDay,differenceInDays } = require('date-fns');
  const Task = require('../models/Tasks');
  const { sendReminderEmail } = require('./emailService');
  
  /**
   * Check all tasks and send reminders for those with deadlines in 3-4 days
   * @param {Object} io - Socket.io instance for real-time notifications
   */
  async function checkTaskDeadlines(io) {
    try {
      const today = new Date();
      const threeDaysFromNow = startOfDay(addDays(today, 3));
      const fourDaysFromNow = endOfDay(addDays(today, 4));
      
      // Find tasks with deadlines between 3 and 4 days from now and not completed
      const eligibleTasks = await Task.find({
        deadline: {
          $gte: threeDaysFromNow,
          $lte: fourDaysFromNow
        },
        completed: false,
        reminderSent: false
      });
      
      console.log(`Found ${eligibleTasks.length} eligible tasks for reminders`);
      
      // Process each eligible task
      for (const task of eligibleTasks) {
        // Calculate days until deadline
        const daysUntilDeadline = differenceInDays(task.deadline, today);
        
        // Send email reminder
        await sendReminderEmail(task.email, task.userName, task, daysUntilDeadline);
        
        // Send real-time notification to frontend
        io.emit('task-reminder', {
          taskId: task._id,
          title: task.title,
          deadline: task.deadline,
          email: task.email,
          daysRemaining: daysUntilDeadline
        });
        
        // Mark reminder as sent
        task.reminderSent = true;
        await task.save();
        
        console.log(`Reminder sent for task "${task.title}" to ${task.email}`);
      }
      
      console.log('Task deadline check completed');
    } catch (error) {
      console.error('Error checking task deadlines:', error);
    }
  }
  
  module.exports = { checkTaskDeadlines };