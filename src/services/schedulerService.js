const cron = require('cron');
  const { checkTaskDeadlines } = require('./reminderService');
  
  /**
   * Start the scheduler that runs the task deadline check daily
   * @param {Object} io - Socket.io instance for real-time notifications
   */
  function startScheduler(io) {
    // Schedule to run at 9:00 AM every day
    const dailyJob = new cron.CronJob('0 9 * * *', () => {
      console.log('Running daily task deadline check...');
      checkTaskDeadlines(io);
    });
  
    // Start the job
    dailyJob.start();
    console.log('Scheduler started');
    
    // For development/testing - also run immediately upon startup
    if (process.env.NODE_ENV === 'development') {
      console.log('Running initial task check (development mode)');
      checkTaskDeadlines(io);
    }
  }
  
  function triggerTaskCheck() {
    if (!ioInstance) {
      console.warn('Socket.io instance not set. Cannot trigger task check.');
      return;
    }
  
    console.log('Triggering task deadline check manually...');
    checkTaskDeadlines(ioInstance);
  }
  
  module.exports = { startScheduler, triggerTaskCheck };