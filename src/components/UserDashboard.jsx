import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyTasks, acceptTask, updateTaskStatus, markAttendance, getMyAttendance } from '../utils/api';

const UserDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [tasks, setTasks] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [userData, setUserData] = useState(null);

  // Memoized loadData function
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load tasks and attendance in parallel
      const [tasksData, attendanceData] = await Promise.all([
        getMyTasks(),
        getMyAttendance()
      ]);

      setTasks(tasksData);
      setAttendance(attendanceData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Get user data from localStorage
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData));
    }

    // Load initial data
    loadData();

    // Set up auto-refresh interval (every 5 minutes instead of 30 seconds)
    const refreshInterval = setInterval(loadData, 5 * 60 * 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(refreshInterval);
  }, [loadData]);

  // Calculate task counts
  const taskCounts = {
    pending: tasks.filter(task => task.status === 'pending').length,
    inProgress: tasks.filter(task => task.status === 'in_progress').length,
    completed: tasks.filter(task => task.status === 'completed').length
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
    navigate('/');
  };

  const handleAcceptTask = async (taskId) => {
    try {
      setLoading(true);
      setError('');
      await acceptTask(taskId);
      setSuccess('Task accepted successfully');
      await loadData(); // Refresh all data
    } catch (err) {
      setError(err.message || 'Failed to accept task');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      setLoading(true);
      setError('');
      if (!completionNotes.trim()) {
        setError('Please provide completion notes');
        return;
      }
      await updateTaskStatus(taskId, 'completed', completionNotes);
      setSuccess('Task completed successfully');
      setCompletionNotes('');
      setSelectedTask(null);
      await loadData(); // Refresh all data
    } catch (err) {
      setError(err.message || 'Failed to complete task');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async () => {
    try {
      await markAttendance(selectedDate);
      setSuccess('Attendance marked successfully');
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-100 font-['Roboto']">
      {/* Header */}
      <nav className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between h-auto sm:h-16 py-4 sm:py-0">
            <div className="flex items-center mb-4 sm:mb-0">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-white font-['Poppins']">User Dashboard</h1>
              </div>
              <div className="ml-4">
                <span className="text-blue-100">Welcome, {userData?.name || 'User'}</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                className="w-full sm:w-auto px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-500 hover:bg-blue-400"
              >
                Refresh Data
              </button>
              <button
                onClick={handleLogout}
                className="w-full sm:w-auto px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-500 hover:bg-red-400"
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
          <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">Loading...</span>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-blue-200 overflow-x-auto">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max">
            <button
              onClick={() => setActiveTab('overview')}
              className={`${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-blue-500 hover:text-blue-700 hover:border-blue-300'
              } whitespace-nowrap py-4 px-2 sm:px-1 border-b-2 font-medium text-sm`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`${
                activeTab === 'tasks'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-blue-500 hover:text-blue-700 hover:border-blue-300'
              } whitespace-nowrap py-4 px-2 sm:px-1 border-b-2 font-medium text-sm`}
            >
              My Tasks
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`${
                activeTab === 'attendance'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-blue-500 hover:text-blue-700 hover:border-blue-300'
              } whitespace-nowrap py-4 px-2 sm:px-1 border-b-2 font-medium text-sm`}
            >
              Attendance
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'overview' && (
            <div className="bg-white shadow rounded-lg p-4 sm:p-6 border border-blue-100">
              <h2 className="text-lg font-medium text-blue-900 mb-4 font-['Poppins']">Welcome to your Dashboard</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <h3 className="text-sm font-medium text-blue-800">Pending Tasks</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {taskCounts.pending}
                  </p>
                </div>
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                  <h3 className="text-sm font-medium text-amber-800">In Progress</h3>
                  <p className="text-2xl font-bold text-amber-600">
                    {taskCounts.inProgress}
                  </p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                  <h3 className="text-sm font-medium text-emerald-800">Completed Tasks</h3>
                  <p className="text-2xl font-bold text-emerald-600">
                    {taskCounts.completed}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="bg-white shadow rounded-lg p-4 sm:p-6 border border-blue-100">
              <h2 className="text-lg font-medium text-blue-900 mb-4">My Tasks</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-blue-200">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                        Assigned By
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-blue-200">
                    {tasks.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-4 sm:px-6 py-4 text-center text-blue-500">
                          No tasks assigned yet
                        </td>
                      </tr>
                    ) : (
                      tasks.map((task) => (
                        <tr key={task._id}>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-blue-900">{task.title}</td>
                          <td className="px-4 sm:px-6 py-4 text-blue-900">{task.description}</td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              task.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : task.status === 'in_progress'
                                ? 'bg-blue-100 text-blue-800'
                                : task.status === 'accepted'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {task.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-blue-900">
                            {task.assignedBy?.name || 'Unknown'}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                              {task.status === 'pending' && (
                                <button
                                  onClick={() => handleAcceptTask(task._id)}
                                  className="text-blue-600 hover:text-blue-900"
                                  disabled={loading}
                                >
                                  Accept
                                </button>
                              )}
                              {task.status === 'accepted' && (
                                <button
                                  onClick={() => {
                                    setSelectedTask(task);
                                    setCompletionNotes('');
                                  }}
                                  className="text-green-600 hover:text-green-900"
                                  disabled={loading}
                                >
                                  Complete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Task Completion Modal */}
              {selectedTask && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
                  <div className="bg-white rounded-lg p-6 max-w-md w-full">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Complete Task</h3>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="completionNotes" className="block text-sm font-medium text-gray-700">
                          Completion Notes
                        </label>
                        <textarea
                          id="completionNotes"
                          value={completionNotes}
                          onChange={(e) => setCompletionNotes(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          rows={4}
                          required
                        />
                      </div>
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => setSelectedTask(null)}
                          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleCompleteTask(selectedTask._id)}
                          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                          disabled={loading}
                        >
                          {loading ? 'Completing...' : 'Complete Task'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="bg-white shadow rounded-lg p-4 sm:p-6 border border-blue-100">
              <h2 className="text-lg font-medium text-blue-900 mb-4">Attendance</h2>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full sm:w-auto border border-blue-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button 
                    onClick={handleMarkAttendance}
                    className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-500"
                  >
                    Mark Attendance
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-blue-200">
                    <thead className="bg-blue-50">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-blue-200">
                      {attendance.map((record) => (
                        <tr key={record._id}>
                          <td className="px-4 sm:px-6 py-4 text-blue-900">
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
    </div>
  );
};

export default UserDashboard; 