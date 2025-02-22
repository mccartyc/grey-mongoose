import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import SideNavBar from '../components/SideNavBar';
import { Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js/auto';
import '../styles/styles.css';
import '../styles/dashboardStyles.css';

const Dashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchDashboardMetrics();
  }, [user?.token]); // Re-fetch when token changes

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
              <p>There was an issue loading your metrics</p>
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
      fill: false,
      borderColor: '#3498db',
      tension: 0.4
    }]
  };

  // Prepare data for session types pie chart
  const sessionTypesData = {
    labels: metrics?.sessionTypes.map(type => type._id) || [],
    datasets: [{
      data: metrics?.sessionTypes.map(type => type.count) || [],
      backgroundColor: [
        '#3498db',
        '#2ecc71',
        '#e74c3c',
        '#f1c40f',
        '#9b59b6',
        '#1abc9c'
      ]
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

          <div className="metrics-grid">
            <div className="metric-card">
              <h3>Total Clients</h3>
              <div className="metric-value">{formatNumber(metrics.totalClients || 0)}</div>
            </div>

            <div className="metric-card">
              <h3>Total Sessions</h3>
              <div className="metric-value">{formatNumber(metrics.totalSessions || 0)}</div>
              <div className="metric-trend trend-positive">
                {metrics.sessionsLastWeek || 0} sessions this week
              </div>
            </div>

            <div className="metric-card">
              <h3>This Month's Sessions</h3>
              <div className="metric-value">{metrics.thisMonthSessions || 0}</div>
              <div className="metric-trend">
                Since {new Date().toLocaleString('default', { month: 'long' })} 1st
              </div>
            </div>

            <div className="metric-card">
              <h3>Upcoming Sessions</h3>
              <div className="metric-value">{metrics.upcomingSessions || 0}</div>
              <div className="metric-trend">
                Next 30 days
              </div>
            </div>
          </div>

          <div className="charts-grid">
            <div className="chart-card">
              <h3>Client Growth</h3>
              <Line data={clientGrowthData} options={{
                responsive: true,
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1
                    }
                  }
                }
              }} />
            </div>

            <div className="chart-card">
              <h3>Session Types Distribution</h3>
              <Pie data={sessionTypesData} options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom'
                  }
                }
              }} />
            </div>

            <div className="chart-card">
              <h3>Recent Sessions</h3>
              <div className="recent-sessions">
                {metrics.recentSessions?.length > 0 ? (
                  metrics.recentSessions.map((session, index) => (
                    <div key={index} className="recent-session-item">
                      <div className="session-client">{session.clientName}</div>
                      <div className="session-details">
                        <span className="session-type">{session.type}</span>
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
                  <div className="no-sessions-message">
                    No recent sessions found
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
