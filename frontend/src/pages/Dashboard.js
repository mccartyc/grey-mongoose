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
        '#012d56',
        '#174E81',
        '#3B75AC',
        '#6DA3D6',
        '#ADD7FF',
        '#D7ECFF'
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

          {/* Top Row - Key Metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '24px',
            marginBottom: '32px'
          }}>
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

          {/* Bottom Row - Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div style={{ background: 'white', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(73, 39, 74, 0.1)', height: '280px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '0.875rem', color: '#49274A', marginBottom: '12px', fontWeight: 600, paddingBottom: '8px', borderBottom: '1px solid rgba(73, 39, 74, 0.1)' }}>Client Growth</h3>
              <div style={{ flex: 1, position: 'relative' }}>
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

            <div style={{ background: 'white', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(73, 39, 74, 0.1)', height: '280px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '0.875rem', color: '#49274A', marginBottom: '12px', fontWeight: 600, paddingBottom: '8px', borderBottom: '1px solid rgba(73, 39, 74, 0.1)' }}>Session Types</h3>
              <div style={{ flex: 1, position: 'relative' }}>
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

            <div style={{ background: 'white', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(73, 39, 74, 0.1)', height: '280px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '0.875rem', color: '#49274A', marginBottom: '12px', fontWeight: 600, paddingBottom: '8px', borderBottom: '1px solid rgba(73, 39, 74, 0.1)' }}>Recent Sessions</h3>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {metrics.recentSessions?.length > 0 ? (
                  metrics.recentSessions.map((session, index) => (
                    <div key={index} style={{ padding: '8px', borderRadius: '6px', marginBottom: '8px', background: 'rgba(73, 39, 74, 0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#49274A' }}>{session.clientName}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ background: 'rgba(73, 39, 74, 0.1)', color: '#49274A', padding: '2px 6px', borderRadius: '12px', fontSize: '0.6875rem', fontWeight: 500 }}>{session.type}</span>
                        <span style={{ color: '#666', fontSize: '0.6875rem' }}>
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
                  <div style={{ textAlign: 'center', padding: '16px', color: '#666', fontSize: '0.8125rem' }}>
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
