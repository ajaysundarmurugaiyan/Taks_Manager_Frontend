// Define API URL - use environment variable in production, fallback in development
const API_URL = 'https://task-manager-backend-1-ooep.onrender.com/api';

// Helper function to handle API responses
const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `HTTP error! status: ${response.status}`);
  }
  return data;
};

// Helper function to get auth token
const getAuthToken = () => localStorage.getItem('token');

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found. Please log in.');
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// Auth-related API functions
export const login = async (email, password) => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });

    return handleResponse(response);
  } catch (error) {
    if (!error.response) {
      throw new Error('Network error! Please check your connection and try again.');
    }
    throw error;
  }
};

export const registerUser = async (userData) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Accept': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(userData)
  });

  return handleResponse(response);
};

export const getCurrentUser = async () => {
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: getAuthHeaders()
  });

  return handleResponse(response);
};

// User-related API functions
export const getAllUsers = async () => {
  const response = await fetch(`${API_URL}/auth/users`, {
    headers: getAuthHeaders()
  });

  return handleResponse(response);
};

export const deleteUser = async (userId) => {
  const response = await fetch(`${API_URL}/auth/users/${userId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });

  return handleResponse(response);
};

// Task-related API functions
export const getAllTasks = async () => {
  try {
    const response = await fetch(`${API_URL}/auth/users`, {
      headers: getAuthHeaders()
    });
    const data = await handleResponse(response);
    // Extract all tasks from all users
    const allTasks = data.reduce((acc, user) => {
      const userTasks = (user.tasks || []).map(task => ({
        ...task,
        assignedTo: user._id,
        assignedToName: user.name,
        createdAt: new Date(task.createdAt).toISOString()
      }));
      return [...acc, ...userTasks];
    }, []);
    return allTasks;
  } catch (error) {
    console.error('Error fetching all tasks:', error);
    throw error;
  }
};

export const getMyTasks = async () => {
  try {
    const response = await fetch(`${API_URL}/auth/me/tasks`, {
      headers: getAuthHeaders()
    });
    const data = await handleResponse(response);
    return data.map(task => ({
      ...task,
      createdAt: new Date(task.createdAt).toISOString()
    }));
  } catch (error) {
    console.error('Error fetching my tasks:', error);
    throw error;
  }
};

export const getUserTasks = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/auth/users/${userId}/tasks`, {
      headers: getAuthHeaders()
    });
    const data = await handleResponse(response);
    return data.map(task => ({
      ...task,
      createdAt: new Date(task.createdAt).toISOString()
    }));
  } catch (error) {
    console.error('Error fetching user tasks:', error);
    throw error;
  }
};

export const createTask = async (taskData) => {
  const response = await fetch(`${API_URL}/auth/users/${taskData.assignedTo}/tasks`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(taskData)
  });
  return handleResponse(response);
};

export const updateTaskStatus = async (taskId, status, completionNotes = '') => {
  try {
    const response = await fetch(`${API_URL}/auth/me/tasks/${taskId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, completionNotes })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update task status');
    }
    
    const data = await response.json();
    return {
      ...data,
      createdAt: new Date(data.createdAt).toISOString()
    };
  } catch (error) {
    console.error('Error updating task status:', error);
    throw error;
  }
};

export const acceptTask = async (taskId) => {
  try {
    const response = await fetch(`${API_URL}/auth/me/tasks/${taskId}/accept`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    const data = await handleResponse(response);
    return {
      ...data,
      createdAt: new Date(data.createdAt).toISOString()
    };
  } catch (error) {
    console.error('Error accepting task:', error);
    throw error;
  }
};

export const deleteTask = async (userId, taskId) => {
  const response = await fetch(`${API_URL}/auth/users/${userId}/tasks/${taskId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  return handleResponse(response);
};

// Attendance-related API functions
export const markAttendance = async (date) => {
  try {
    const response = await fetch(`${API_URL}/auth/me/attendance`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ date })
    });
    const data = await handleResponse(response);
    return {
      ...data,
      date: new Date(data.date).toISOString().split('T')[0]
    };
  } catch (error) {
    console.error('Error marking attendance:', error);
    throw error;
  }
};

export const getAttendance = async (date) => {
  try {
    const response = await fetch(`${API_URL}/auth/attendance?date=${date}`, {
      headers: getAuthHeaders()
    });
    const data = await handleResponse(response);
    return data.map(record => ({
      ...record,
      date: new Date(record.date).toISOString().split('T')[0]
    }));
  } catch (error) {
    console.error('Error fetching attendance:', error);
    throw error;
  }
};

export const getMyAttendance = async () => {
  try {
    const response = await fetch(`${API_URL}/auth/me/attendance`, {
      headers: getAuthHeaders()
    });
    const data = await handleResponse(response);
    return data.map(record => ({
      ...record,
      date: new Date(record.date).toISOString().split('T')[0]
    }));
  } catch (error) {
    console.error('Error fetching my attendance:', error);
    throw error;
  }
};

export const clearAllAttendance = async () => {
  try {
    const response = await fetch(`${API_URL}/auth/attendance/clear`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to clear attendance records');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error clearing attendance records:', error);
    throw error;
  }
};

// Add more API functions as needed 
