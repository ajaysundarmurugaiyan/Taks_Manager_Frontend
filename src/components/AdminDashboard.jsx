import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser, getCurrentUser, getAllTasks, createTask, getUserTasks, getAllUsers, markAttendance, getAttendance, deleteUser, deleteTask } from '../utils/api';


const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user'
  });
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignedTo: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedUserTasks, setSelectedUserTasks] = useState([]);
  const [showTasksModal, setShowTasksModal] = useState(false);

  useEffect(() => {
    // Check if user is logged in and is admin
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    
    if (!token || userRole !== 'admin') {
      navigate('/');
      return;
    }

    // Load initial data
    loadData();

    // Set up auto-refresh interval (every 30 seconds)
    const refreshInterval = setInterval(loadData, 30000);

    // Cleanup interval on component unmount
    return () => clearInterval(refreshInterval);
  }, [navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load users first
      const usersData = await getAllUsers();
      setUsers(usersData);

      // Then load tasks
      const tasksData = await getAllTasks();
      setTasks(tasksData);

      // Finally load attendance
      const attendanceData = await getAttendance(selectedDate);
      setAttendance(attendanceData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
    navigate('/');
  };

  const handleRegisterUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await registerUser(newUser);
      setSuccess('User registered successfully');
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'user'
      });
      // Refresh data after successful registration
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to register user');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      
      // Create task with proper assignment
      const taskData = {
        title: newTask.title,
        description: newTask.description,
        assignedTo: newTask.assignedTo,
        status: 'pending'
      };

      await createTask(taskData);
      setSuccess('Task created and assigned successfully');
      setNewTask({ title: '', description: '', assignedTo: '' });
      await loadData(); // Refresh all data
    } catch (err) {
      setError(err.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const handleViewUserTasks = async (userId) => {
    try {
      setLoading(true);
      setError('');
      const userTasks = await getUserTasks(userId);
      setSelectedUserTasks(userTasks);
      setShowTasksModal(true);
    } catch (err) {
      console.error('Error loading user tasks:', err);
      setError(err.message || 'Failed to load user tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAttendance = async () => {
    try {
      setLoading(true);
      setError('');
      const attendanceData = await getAttendance(selectedDate);
      setAttendance(attendanceData);
    } catch (err) {
      console.error('Error loading attendance:', err);
      setError(err.message || 'Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async () => {
    try {
      setLoading(true);
      setError('');
      await markAttendance(selectedDate);
      setSuccess('Attendance marked successfully');
      // Refresh attendance data
      await handleGenerateAttendance();
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error marking attendance:', error);
      setError(error.message || 'Failed to mark attendance');
      // Clear error message after 3 seconds
      setTimeout(() => {
        setError('');
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      setDeleteLoading(true);
      setError('');
      console.log('Deleting user:', userId);
      await deleteUser(userId);
      setSuccess('User and associated tasks deleted successfully');
      await loadData();
      setUserToDelete(null);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err.message || 'Failed to delete user. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      setLoading(true);
      setError('');
      console.log('Deleting task:', taskId);
      await deleteTask(taskId);
      setSuccess('Task deleted successfully');
      // Refresh the data
      await loadData();
      // If we're in the tasks modal, refresh the selected user's tasks
      if (showTasksModal) {
        const userTasks = await getUserTasks(selectedUserTasks[0]?.assignedTo?._id);
        setSelectedUserTasks(userTasks);
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      setError(err.message || 'Failed to delete task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-100 font-['Roboto']">
      {/* Header */}
      <nav className="bg-slate-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between h-auto sm:h-16 py-4 sm:py-0">
            <div className="flex items-center mb-4 sm:mb-0">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-white font-['Poppins']">Admin Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                className="w-full sm:w-auto px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-slate-700 hover:bg-slate-600"
              >
                Refresh Data
              </button>
              <button
                onClick={handleLogout}
                className="w-full sm:w-auto px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-700 hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{success}</span>
          </div>
        )}
        {loading && (
          <div className="mb-4 bg-slate-50 border border-slate-200 text-slate-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">Loading...</span>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-slate-200 overflow-x-auto">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max">
            <button
              onClick={() => setActiveTab('users')}
              className={`${
                activeTab === 'users'
                  ? 'border-slate-800 text-slate-800'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              } whitespace-nowrap py-4 px-2 sm:px-1 border-b-2 font-medium text-sm`}
            >
              User Management
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`${
                activeTab === 'tasks'
                  ? 'border-slate-800 text-slate-800'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              } whitespace-nowrap py-4 px-2 sm:px-1 border-b-2 font-medium text-sm`}
            >
              Task Management
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`${
                activeTab === 'attendance'
                  ? 'border-slate-800 text-slate-800'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              } whitespace-nowrap py-4 px-2 sm:px-1 border-b-2 font-medium text-sm`}
            >
              Attendance Reports
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'users' && (
            <div className="bg-white shadow rounded-lg p-4 sm:p-6 border border-slate-200">
              <h2 className="text-lg font-medium text-slate-900 mb-4 font-['Poppins']">Register New User</h2>
              <form onSubmit={handleRegisterUser} className="space-y-4 mb-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                      Role
                    </label>
                    <select
                      id="role"
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    loading ? 'bg-slate-400' : 'bg-slate-800 hover:bg-slate-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500`}
                >
                  {loading ? 'Registering...' : 'Register User'}
                </button>
              </form>

              <h2 className="text-lg font-medium text-slate-900 mb-4">User List</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {users.filter(user => user.role === 'user').map((user) => (
                      <tr key={user._id}>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-slate-900">{user.name}</td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-slate-900">{user.email}</td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                            <button
                              onClick={() => handleViewUserTasks(user._id)}
                              className="text-slate-700 hover:text-slate-900"
                            >
                              View Tasks
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user._id)}
                              className="text-red-700 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="bg-white shadow rounded-lg p-4 sm:p-6 border border-slate-200">
              <h2 className="text-lg font-medium text-slate-900 mb-4">Assign New Task</h2>
              <form onSubmit={handleCreateTask} className="space-y-4 mb-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Task Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      id="description"
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      rows="3"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">
                      Assign To
                    </label>
                    <select
                      id="assignedTo"
                      value={newTask.assignedTo}
                      onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    >
                      <option value="">Select a user</option>
                      {users.filter(user => user.role === 'user').map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    loading ? 'bg-slate-400' : 'bg-slate-800 hover:bg-slate-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500`}
                >
                  {loading ? 'Assigning...' : 'Assign Task'}
                </button>
              </form>

              <h2 className="text-lg font-medium text-slate-900 mb-4">All Tasks</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Assigned To
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Created At
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {tasks.map((task) => (
                      <tr key={task._id}>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-slate-900">{task.title}</td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-slate-900">
                          {task.assignedTo?.name || 'Unknown User'}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            task.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : task.status === 'in_progress'
                              ? 'bg-blue-100 text-blue-800'
                              : task.status === 'accepted'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}>
                            {task.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-slate-900">
                          {new Date(task.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="bg-white shadow rounded-lg p-4 sm:p-6 border border-slate-200">
              <h2 className="text-lg font-medium text-slate-900 mb-4">Attendance Reports</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Attendance Management</h2>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="px-3 py-1 border rounded"
                    />
                    <button
                      onClick={handleMarkAttendance}
                      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                      disabled={loading}
                    >
                      Mark My Attendance
                    </button>
                  </div>
                </div>
                <button 
                  onClick={handleGenerateAttendance}
                  className="w-full sm:w-auto bg-slate-800 text-white px-4 py-2 rounded-md hover:bg-slate-700"
                >
                  Generate Report
                </button>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Employee
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {attendance.map((record) => (
                        <tr key={`${record.userId}-${record.date}`}>
                          <td className="px-4 sm:px-6 py-4 text-slate-900">
                            {record.name || 'Deleted User'}
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-slate-900">
                            {new Date(record.date).toLocaleDateString()}
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              record.status === 'present' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Tasks Modal */}
      {showTasksModal && (
        <div className="fixed inset-0 bg-slate-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-slate-900">User Tasks</h3>
              <button
                onClick={() => setShowTasksModal(false)}
                className="text-slate-400 hover:text-slate-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {selectedUserTasks.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-4 sm:px-6 py-4 text-center text-slate-500">
                        No tasks assigned to this user
                      </td>
                    </tr>
                  ) : (
                    selectedUserTasks.map((task) => (
                      <tr key={task._id}>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-slate-900">{task.title}</td>
                        <td className="px-4 sm:px-6 py-4 text-slate-900">{task.description}</td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            task.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : task.status === 'in_progress'
                              ? 'bg-blue-100 text-blue-800'
                              : task.status === 'accepted'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}>
                            {task.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-slate-900">
                          {new Date(task.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleDeleteTask(task._id)}
                            className="text-red-700 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard; 