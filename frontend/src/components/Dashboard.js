import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Container, Grid2, Card, CardContent, Typography, Box } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import { FaCalendarCheck, FaUsers, FaClock } from 'react-icons/fa';

// Import Chart.js components
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
  } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const [appointmentsNextWeek, setAppointmentsNextWeek] = useState(0);
  const [appointmentsThisMonth, setAppointmentsThisMonth] = useState(0);
  const [averageSessionLength, setAverageSessionLength] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const nextWeekResponse = await axios.get('http://localhost:5000/api/appointments/next-week');
        setAppointmentsNextWeek(nextWeekResponse.data.count);

        const thisMonthResponse = await axios.get('http://localhost:5000/api/appointments/this-month');
        setAppointmentsThisMonth(thisMonthResponse.data.count);

        const averageDurationResponse = await axios.get('http://localhost:5000/api/appointments/average-duration');
        setAverageSessionLength(averageDurationResponse.data.averageDuration);
      } catch (error) {
        console.error("Error fetching data", error);
      }
    };
    fetchData();
  }, []);

  // Define the data for the chart
  const chartData = {
    labels: ['Next Week', 'This Month', 'Average Duration'],
    datasets: [
      {
        label: 'Appointment Metrics',
        data: [appointmentsNextWeek, appointmentsThisMonth, averageSessionLength],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
    ],
  };

  return (
    <Container maxWidth="lg" style={{ marginTop: '20px' }}>
      <Typography variant="h4" gutterBottom style={{ textAlign: 'center' }}>
        Dashboard
      </Typography>
      <Grid2 container spacing={3}>
        <Grid2 item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <FaCalendarCheck size={30} style={{ marginRight: '10px', color: 'teal' }} />
                <Typography variant="h6">Appointments Next Week</Typography>
              </Box>
              <Typography variant="h3">{appointmentsNextWeek}</Typography>
            </CardContent>
          </Card>
        </Grid2>
        <Grid2 item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <FaUsers size={30} style={{ marginRight: '10px', color: 'blue' }} />
                <Typography variant="h6">Appointments This Month</Typography>
              </Box>
              <Typography variant="h3">{appointmentsThisMonth}</Typography>
            </CardContent>
          </Card>
        </Grid2>
        <Grid2 item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <FaClock size={30} style={{ marginRight: '10px', color: 'purple' }} />
                <Typography variant="h6">Average Session Length (minutes)</Typography>
              </Box>
              <Typography variant="h3">{averageSessionLength.toFixed(2)}</Typography>
            </CardContent>
          </Card>
        </Grid2>
      </Grid2>
      <Box marginTop={4}>
        <Typography variant="h5" gutterBottom>
          Appointment Metrics Overview
        </Typography>
        <Bar data={chartData} options={{ responsive: true, scales: { y: { beginAtZero: true } } }} />
      </Box>
    </Container>
  );
};

export default Dashboard;