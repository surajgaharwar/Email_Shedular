# Task Reminder System

A monolithic Node.js application that monitors user tasks and sends reminders when deadlines are approaching. This system runs once daily and for each eligible task (with deadlines 3-4 days away):

- Sends an email to the associated user
- Triggers a frontend popup alert for that user

## System Components

1. **Scheduler**: Runs daily via cron job
2. **Task Database**: Stores tasks with deadlines and user information
3. **Reminder Service**: Queries tasks and filters based on deadline proximity
4. **Email Service**: Sends email notifications
5. **Frontend**: Manages task display and handles real-time notifications

## Setup Instructions

### Prerequisites

- Node.js (v14 or newer)
- MongoDB (local or cloud instance)
- Email account for sending notifications

### Installation

1. Clone the repository or extract the project files

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/task-reminder
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   NODE_ENV=development
   ```

   **Note:** For Gmail, you'll need to create an "App Password" in your Google Account security settings.

4. Seed the database with sample tasks (optional):
   ```
   node seedDatabase.js
   ```

### Running the Application

1. Start the server:
   ```
   npm start
   ```
   
   Or for development with auto-reload:
   ```
   npm run dev
   ```

2. Access the application in your browser:
   ```
   http://localhost:3000
   ```

### Manual Testing

To manually trigger the task check process (without waiting for the scheduled run):

```
node checkTasks.js
```

This will check for tasks with deadlines 3-4 days away and send email notifications.

## How It Works

### Task Creation

1. Users create tasks via the frontend, specifying:
   - Title
   - Description (optional)
   - Deadline
   - Email address
   - Name

2. Tasks are stored in MongoDB with all relevant details.

### Reminder Process

1. The scheduler runs daily at 9:00 AM via a cron job.
2. It queries the database for tasks with deadlines 3-4 days away.
3. For each eligible task:
   - An email is sent to the specified email address
   - A real-time notification is pushed to the frontend
   - The task is marked as "reminder sent" to prevent duplicate notifications

### Real-time Updates

The application uses Socket.io to provide real-time updates:
- Task creation, completion, and deletion
- Reminder notifications

## API Endpoints

- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get a specific task
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update a task
- `PATCH /api/tasks/:id/complete` - Mark a task as completed
- `DELETE /api/tasks/:id` - Delete a task

## Extending the Application

This prototype can be extended in several ways:

1. Add user authentication for personalized task management
2. Implement additional notification methods (SMS, push notifications)
3. Add task categories and priority levels
4. Create recurring tasks functionality
5. Add task filtering and sorting options
6. Implement task sharing between users
7. Create a mobile app interface

## Troubleshooting

If you encounter any issues:

1. **Email notifications not sending**:
   - Check your email service credentials in the .env file
   - Verify you're using an app password for Gmail

2. **Tasks not appearing**:
   - Check MongoDB connection string
   - Verify the task creation process

3. **Scheduler not running**:
   - Check server logs for cron job execution
   - Try running the manual check script