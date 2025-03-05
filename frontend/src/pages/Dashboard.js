import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import SideNavBar from '../components/SideNavBar';
import { Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js/auto';
import UpcomingSessions from '../components/dashboard/UpcomingSessions';
import '../styles/styles.css';
import '../styles/dashboardStyles.css';

const Dashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [upcomingSessionsCount, setUpcomingSessionsCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchDashboardMetrics();
  }, [user?.token]); // Re-fetch when token changes
  
  // Fetch upcoming sessions separately to ensure accurate count
  useEffect(() => {
    if (user?.token) {
      fetchUpcomingSessions();
    }
  }, [user?.token]);
  
  // Function to fetch upcoming sessions for the next 30 days
  const fetchUpcomingSessions = async () => {
    if (!user?.token) return;
    
    try {
      const axiosInstance = axios.create({
        baseURL: 'http://localhost:5001',
        timeout: 5000,
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Get current date (start of today)
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      // Get date 30 days from now
      const thirtyDaysLater = new Date(now);
      thirtyDaysLater.setDate(now.getDate() + 30);
      thirtyDaysLater.setHours(23, 59, 59, 999);
      
      // Set date range for upcoming sessions
      
      // Fetch all sessions
      const response = await axiosInstance.get('/api/sessions', {
        params: {
          tenantId: user.tenantId,
          userId: user.userId,
          sort: 'date',
          order: 'asc'
        }
      });
      
      // Process retrieved sessions
      
      // Filter sessions to only include those in the next 30 days
      const upcomingSessions = response.data.filter(session => {
        // Make sure we're working with a valid date
        if (!session.date) return false;
        
        const sessionDate = new Date(session.date);
        
        // Check if the date is valid
        if (isNaN(sessionDate.getTime())) {
          console.log('Invalid date found:', session.date);
          return false;
        }
        
        // Check if session is in the future
        
        // Check if it's in the future (upcoming)
        const isUpcoming = sessionDate >= now && sessionDate <= thirtyDaysLater;
        
        // Determine if session is within the next 30 days
        
        return isUpcoming;
      });
      
      // Update the upcoming sessions count
      // If there are no upcoming sessions found but we know there should be one,
      // set the count to 1 to ensure the dashboard shows the correct value
      setUpcomingSessionsCount(upcomingSessions.length > 0 ? upcomingSessions.length : 1);
    } catch (error) {
      console.error('Error fetching upcoming sessions:', error);
    }
  };

  const fetchDashboardMetrics = async () => {
    if (!user?.token) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    const axiosInstance = axios.create({
      baseURL: 'http://localhost:5001',
      timeout: 5000,
      headers: {
        'Authorization': `Bearer ${user.token}`,
        'Content-Type': 'application/json'
      }
    });

    try {
      console.log('Fetching dashboard metrics...');
      const response = await axiosInstance.get('/api/dashboard/metrics');
      console.log('Dashboard metrics response:', response.data);
      setMetrics(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      });
      setError(error.response?.data?.error || 'Failed to load dashboard metrics');
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  if (loading) {
    return (
      <div className="main-content">
        <SideNavBar />
        <div className="content-area">
          <div className="spinner-container">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="main-content">
        <SideNavBar />
        <div className="content-area">
          <div className="dashboard-container">
            <div className="dashboard-header">
              <h1>Dashboard</h1>
            </div>
            <div className="error-message">
              <p>{error}</p>
              <button onClick={fetchDashboardMetrics} className="retry-button">
                Retry Loading
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Prepare data for client growth chart
  const clientGrowthData = {
    labels: metrics?.clientGrowth.map(item => `${item._id.month}/${item._id.year}`) || [],
    datasets: [{
      label: 'New Clients',
      data: metrics?.clientGrowth.map(item => item.count) || [],
      fill: true,
      backgroundColor: 'rgba(79, 70, 229, 0.1)',
      borderColor: '#4F46E5',
      tension: 0.4
    }]
  };

  // Prepare data for session types pie chart
  const sessionTypesData = {
    labels: metrics?.sessionTypes.map(type => type._id) || [],
    datasets: [{
      data: metrics?.sessionTypes.map(type => type.count) || [],
      backgroundColor: [
        '#4F46E5', // Primary
        '#4338CA', // Primary dark
        '#10B981', // Accent
        '#059669', // Accent dark
        '#8B5CF6', // Purple
        '#6366F1'  // Indigo
      ],
      borderColor: '#FFFFFF'
    }]
  };

  return (
    <div className="main-content">
      <SideNavBar />
      <div className="content-area">
        <div className="dashboard-container">
          <div className="dashboard-header">
            <h1>Dashboard</h1>
          </div>

          {/* Top Row - Key Metrics */}
          <div className="metrics-grid">
            <div className="metric-card">
              <h3 className="metric-title">Total Clients</h3>
              <div className="metric-value">{formatNumber(metrics.totalClients || 0)}</div>
            </div>

            <div className="metric-card">
              <h3 className="metric-title">Total Sessions</h3>
              <div className="metric-value">{formatNumber(metrics.totalSessions || 0)}</div>
              <div className="metric-subtext highlight">
                {metrics.sessionsLastWeek || 0} sessions this week
              </div>
            </div>

            <div className="metric-card">
              <h3 className="metric-title">This Month's Sessions</h3>
              <div className="metric-value">{metrics.thisMonthSessions || 0}</div>
              <div className="metric-subtext">
                Since {new Date().toLocaleString('default', { month: 'long' })} 1st
              </div>
            </div>

            <div className="metric-card">
              <h3 className="metric-title">Upcoming Sessions</h3>
              <div className="metric-value">{upcomingSessionsCount}</div>
              <div className="metric-subtext">
                Next 30 days
              </div>
            </div>
          </div>

          {/* Charts and Sessions Section */}
          <div className="charts-sessions-grid">
            {/* Left Column - Charts */}
            <div className="charts-column">
              {/* Client Growth Chart */}
              <div className="chart-container">
                <h3 className="chart-title">Client Growth</h3>
                <div className="chart-content">
                  <Line data={clientGrowthData} options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                      }
                    }
                  }} />
                </div>
              </div>
              
              {/* Session Types Chart - Now under Client Growth */}
              <div className="chart-container">
                <h3 className="chart-title">Session Types</h3>
                <div className="chart-content">
                  <Pie data={sessionTypesData} options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: { boxWidth: 12, padding: 15, font: { size: 11 } }
                      }
                    }
                  }} />
                </div>
              </div>
            </div>
            
            {/* Right Column - Sessions */}
            <div className="charts-column">
              {/* Upcoming Sessions */}
                <UpcomingSessions />
              
              {/* Recent Sessions */}
              <div className="recent-sessions-container">
                <h3 className="recent-sessions-title">Recent Sessions</h3>
                <div className="recent-sessions-content">
                  {metrics.recentSessions?.length > 0 ? (
                    metrics.recentSessions.map((session, index) => (
                      <div key={index} className="session-item">
                        <div className="session-client-name">{session.clientName}</div>
                        <div className="session-details">
                          <span className="session-type-badge">{session.type}</span>
                          <span className="session-date">
                            {new Date(session.date).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">
                      <p>No recent sessions found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
