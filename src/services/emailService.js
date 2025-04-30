 const nodemailer = require('nodemailer');
  const { format } = require('date-fns');
  
  // Create mail transporter
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  
  /**
   * Send a reminder email for an upcoming task deadline
   * @param {string} email - Recipient email
   * @param {string} name - Recipient name
   * @param {Object} task - Task data
   * @param {number} daysRemaining - Days until deadline
   */
  async function sendReminderEmail(email, name, task, daysRemaining) {
    try {
      const formattedDate = format(task.deadline, 'MMMM dd, yyyy');
      
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: `Task Reminder: "${task.title}" is due in ${daysRemaining} days`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Task Deadline Reminder</h2>
            <p>Hello ${name},</p>
            <p>This is a friendly reminder that your task <strong>"${task.title}"</strong> is due in <strong>${daysRemaining} days</strong> (${formattedDate}).</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">${task.title}</h3>
              <p style="margin-bottom: 5px;"><strong>Description:</strong> ${task.description || 'No description provided'}</p>
              <p style="margin-bottom: 0;"><strong>Due Date:</strong> ${formattedDate}</p>
            </div>
            <p>Please make sure to complete this task before the deadline.</p>
            <p>Thank you!</p>
            <p>Task Reminder System</p>
          </div>
        `
      };
      
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('Error sending reminder email:', error);
      throw error;
    }
  }
  
  module.exports = { sendReminderEmail };
  