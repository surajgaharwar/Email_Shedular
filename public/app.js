document.addEventListener('DOMContentLoaded', () => {
    // Connect to Socket.io server
    const socket = io();
    
    // DOM elements
    const taskForm = document.getElementById('taskForm');
    const tasksList = document.getElementById('tasksList');
    const notificationContainer = document.getElementById('notificationContainer');
    
    // Load initial tasks
    fetchTasks();
    
    // Event listeners
    taskForm.addEventListener('submit', handleAddTask);
    
    // Socket.io event listeners
    socket.on('task-reminder', handleTaskReminder);
    socket.on('new-task', handleNewTask);
    socket.on('update-task', handleUpdateTask);
    socket.on('complete-task', handleTaskUpdate);
    socket.on('delete-task', handleTaskDelete);
    
    /**
     * Fetch all tasks from the API
     */
    async function fetchTasks() {
      try {
        const response = await fetch('/api/tasks');
        const tasks = await response.json();
        
        tasksList.innerHTML = '';
        
        if (tasks.length === 0) {
          tasksList.innerHTML = '<div class="empty-state">No tasks found. Add a new task to get started.</div>';
          return;
        }
        
        tasks.forEach(task => {
          tasksList.appendChild(createTaskElement(task));
        });
      } catch (error) {
        console.error('Error fetching tasks:', error);
        tasksList.innerHTML = '<div class="error">Failed to load tasks. Please try again later.</div>';
      }
    }
    
    /**
     * Handle adding a new task
     * @param {Event} e - Form submit event
     */
    async function handleAddTask(e) {
      e.preventDefault();
      
      const formData = new FormData(taskForm);
      const taskData = {
        title: formData.get('title'),
        description: formData.get('description'),
        deadline: formData.get('deadline'),
        email: formData.get('email'),
        userName: formData.get('userName')
      };
      
      try {
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(taskData)
        });
        
        if (!response.ok) {
          throw new Error('Failed to add task');
        }
        
        // Clear form
        taskForm.reset();
        
        // Task will be added by the socket event
      } catch (error) {
        console.error('Error adding task:', error);
        showNotification('Error', 'Failed to add task. Please try again.');
      }
    }
    
    /**
     * Handle task reminder notification from socket
     * @param {Object} data - Task reminder data
     */
    function handleTaskReminder(data) {
      const { title, daysRemaining, email } = data;
      
      const message = `Task "${title}" for ${email} is due in ${daysRemaining} days!`;
      showNotification('Reminder', message, 'warning');
      
      // Update UI if the task exists in the list
      const taskElement = document.getElementById(`task-${data.taskId}`);
      if (taskElement) {
        fetchTasks(); // Refresh the task list
      }
    }
    
    /**
     * Handle new task added from socket
     * @param {Object} task - New task data
     */
    function handleNewTask(task) {
      const taskElement = createTaskElement(task);
      
      // Remove empty state if present
      const emptyState = tasksList.querySelector('.empty-state');
      if (emptyState) {
        tasksList.removeChild(emptyState);
      }
      
      // Add new task at the beginning
      if (tasksList.firstChild) {
        tasksList.insertBefore(taskElement, tasksList.firstChild);
      } else {
        tasksList.appendChild(taskElement);
      }
      
      showNotification('Success', `Task "${task.title}" added successfully!`);
    }
    
    /**
     * Handle task update from socket
     * @param {Object} task - Updated task data
     */
    function handleUpdateTask(task) {
      const existingTask = document.getElementById(`task-${task._id}`);
      if (existingTask) {
        const newTaskElement = createTaskElement(task);
        tasksList.replaceChild(newTaskElement, existingTask);
      }
    }
    
    /**
     * Handle task completion
     * @param {string} taskId - Task ID
     */
    async function completeTask(taskId) {
      try {
        const response = await fetch(`/api/tasks/${taskId}/complete`, {
          method: 'PATCH'
        });
        
        if (!response.ok) {
          throw new Error('Failed to complete task');
        }
        
        // Task will be updated by the socket event
      } catch (error) {
        console.error('Error completing task:', error);
        showNotification('Error', 'Failed to complete task. Please try again.');
      }
    }
    
    /**
     * Handle task deletion
     * @param {string} taskId - Task ID
     */
    async function deleteTask(taskId) {
      if (!confirm('Are you sure you want to delete this task?')) {
        return;
      }
      
      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete task');
        }
        
        // Task will be removed by the socket event
      } catch (error) {
        console.error('Error deleting task:', error);
        showNotification('Error', 'Failed to delete task. Please try again.');
      }
    }
    
    /**
     * Handle task update from socket
     * @param {Object} task - Updated task data
     */
    function handleTaskUpdate(task) {
      const existingTask = document.getElementById(`task-${task._id}`);
      if (existingTask) {
        const newTaskElement = createTaskElement(task);
        tasksList.replaceChild(newTaskElement, existingTask);
      }
    }
    
    /**
     * Handle task deletion from socket
     * @param {string} taskId - Deleted task ID
     */
    function handleTaskDelete(taskId) {
      const taskElement = document.getElementById(`task-${taskId}`);
      if (taskElement) {
        tasksList.removeChild(taskElement);
        
        // Show empty state if no tasks left
        if (tasksList.children.length === 0) {
          tasksList.innerHTML = '<div class="empty-state">No tasks found. Add a new task to get started.</div>';
        }
      }
    }
    
    /**
     * Create task DOM element
     * @param {Object} task - Task data
     * @returns {HTMLElement} Task element
     */
    function createTaskElement(task) {
      const taskElement = document.createElement('div');
      taskElement.className = `task-item ${task.completed ? 'task-completed' : ''}`;
      taskElement.id = `task-${task._id}`;
      
      const deadlineDate = new Date(task.deadline);
      const formattedDate = deadlineDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
      taskElement.innerHTML = `
        <div class="task-header">
          <div class="task-title">${task.title}</div>
          <div class="task-email">${task.email}</div>
        </div>
        <div class="task-description">${task.description || 'No description'}</div>
        <div class="task-meta">
          <div class="task-deadline">
            <i class="fas fa-calendar-alt"></i>
            <span>${formattedDate}</span>
          </div>
          <div class="task-name">
            <i class="fas fa-user"></i>
            <span>${task.userName}</span>
          </div>
        </div>
        ${!task.completed ? `
          <div class="task-actions">
            <button class="btn btn-complete btn-sm" data-task-id="${task._id}">
              <i class="fas fa-check"></i> Complete
            </button>
            <button class="btn btn-delete btn-sm" data-task-id="${task._id}">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        ` : ''}
      `;
      
      // Add event listeners to buttons
      if (!task.completed) {
        const completeBtn = taskElement.querySelector('.btn-complete');
        const deleteBtn = taskElement.querySelector('.btn-delete');
        
        completeBtn.addEventListener('click', () => completeTask(task._id));
        deleteBtn.addEventListener('click', () => deleteTask(task._id));
      }
      
      return taskElement;
    }
    
    /**
     * Show notification
     * @param {string} title - Notification title
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success, warning, error)
     */
    function showNotification(title, message, type = 'success') {
      const notification = document.createElement('div');
      notification.className = `notification notification-${type}`;
      
      notification.innerHTML = `
        <div class="notification-header">
          <div class="notification-title">${title}</div>
          <div class="notification-close">&times;</div>
        </div>
        <div class="notification-message">${message}</div>
      `;
      
      // Add notification to container
      notificationContainer.appendChild(notification);
      
      // Add close event listener
      const closeBtn = notification.querySelector('.notification-close');
      closeBtn.addEventListener('click', () => {
        notification.remove();
      });
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 5000);
    }
  });