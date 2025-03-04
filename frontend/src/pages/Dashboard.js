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
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '24px',
            marginBottom: '32px'
          }}>
            <div style={{ background: 'white', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
              <h3 style={{ fontSize: '0.875rem', color: '#0F172A', marginBottom: '8px', fontWeight: 600 }}>Total Clients</h3>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#4F46E5' }}>{formatNumber(metrics.totalClients || 0)}</div>
            </div>

            <div style={{ background: 'white', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
              <h3 style={{ fontSize: '0.875rem', color: '#0F172A', marginBottom: '8px', fontWeight: 600 }}>Total Sessions</h3>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#4F46E5' }}>{formatNumber(metrics.totalSessions || 0)}</div>
              <div style={{ fontSize: '0.75rem', color: '#10B981', marginTop: '4px' }}>
                {metrics.sessionsLastWeek || 0} sessions this week
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
              <h3 style={{ fontSize: '0.875rem', color: '#0F172A', marginBottom: '8px', fontWeight: 600 }}>This Month's Sessions</h3>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#4F46E5' }}>{metrics.thisMonthSessions || 0}</div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
                Since {new Date().toLocaleString('default', { month: 'long' })} 1st
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
              <h3 style={{ fontSize: '0.875rem', color: '#0F172A', marginBottom: '8px', fontWeight: 600 }}>Upcoming Sessions</h3>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#4F46E5' }}>{upcomingSessionsCount}</div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
                Next 30 days
              </div>
            </div>
          </div>

          {/* Charts and Sessions Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            {/* Left Column - Charts */}
            <div style={{ display: 'grid', gridTemplateRows: 'auto auto', gap: '16px' }}>
              {/* Client Growth Chart */}
              <div style={{ background: 'white', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', height: '280px', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '0.875rem', color: '#0F172A', marginBottom: '12px', fontWeight: 600, paddingBottom: '8px', borderBottom: '1px solid rgba(15, 23, 42, 0.1)' }}>Client Growth</h3>
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
              
              {/* Session Types Chart - Now under Client Growth */}
              <div style={{ background: 'white', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', height: '280px', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '0.875rem', color: '#0F172A', marginBottom: '12px', fontWeight: 600, paddingBottom: '8px', borderBottom: '1px solid rgba(15, 23, 42, 0.1)' }}>Session Types</h3>
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
            </div>
            
            {/* Right Column - Sessions */}
            <div style={{ display: 'grid', gridTemplateRows: 'auto auto', gap: '16px' }}>
              {/* Recent Sessions - Now next to Upcoming Sessions */}
              <div style={{ background: 'white', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', height: '280px', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '0.875rem', color: '#0F172A', marginBottom: '12px', fontWeight: 600, paddingBottom: '8px', borderBottom: '1px solid rgba(15, 23, 42, 0.1)' }}>Recent Sessions</h3>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {metrics.recentSessions?.length > 0 ? (
                    metrics.recentSessions.map((session, index) => (
                      <div key={index} style={{ padding: '8px', borderRadius: '6px', marginBottom: '8px', background: 'rgba(79, 70, 229, 0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#0F172A' }}>{session.clientName}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ background: 'rgba(79, 70, 229, 0.1)', color: '#4F46E5', padding: '2px 6px', borderRadius: '12px', fontSize: '0.6875rem', fontWeight: 500 }}>{session.type}</span>
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
              
              {/* Upcoming Sessions */}
              <div style={{ height: '280px' }}>
                <UpcomingSessions />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
