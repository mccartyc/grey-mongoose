// File: Dashboard.jsx

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Container, Grid, Card, CardContent, Typography, Box } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import { FaCalendarCheck, FaUsers, FaClock, FaUserPlus, FaClipboardList, FaTimesCircle } from 'react-icons/fa';

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
  const [appointmentsNextWeek, setAppointmentsNextWeek] = useState(6);
  const [appointmentsThisMonth, setAppointmentsThisMonth] = useState(16);
  const [averageSessionLength, setAverageSessionLength] = useState(30);
  const [newClientsThisMonth, setNewClientsThisMonth] = useState(10);
  const [followUpsScheduled, setFollowUpsScheduled] = useState(5);
  const [noShowRate, setNoShowRate] = useState(10);

  const [genderDistribution, setGenderDistribution] = useState({ male: 50, female: 50, other: 0 });
  const [locationDistribution, setLocationDistribution] = useState({});
  const [meetingTypes, setMeetingTypes] = useState({ virtual: 70, inPerson: 30 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const nextWeekResponse = await axios.get('http://localhost:5000/api/appointments/next-week');
        setAppointmentsNextWeek(nextWeekResponse.data.count);

        const thisMonthResponse = await axios.get('http://localhost:5000/api/appointments/this-month');
        setAppointmentsThisMonth(thisMonthResponse.data.count);

        const averageDurationResponse = await axios.get('http://localhost:5000/api/appointments/average-duration');
        setAverageSessionLength(averageDurationResponse.data.averageDuration);

        const newClientsResponse = await axios.get('http://localhost:5000/api/clients/new');
        setNewClientsThisMonth(newClientsResponse.data.count);

        const followUpsResponse = await axios.get('http://localhost:5000/api/appointments/follow-ups');
        setFollowUpsScheduled(followUpsResponse.data.count);

        const noShowRateResponse = await axios.get('http://localhost:5000/api/appointments/no-show-rate');
        setNoShowRate(noShowRateResponse.data.rate);

        const genderResponse = await axios.get('http://localhost:5000/api/clients/gender-distribution');
        setGenderDistribution(genderResponse.data);

        const locationResponse = await axios.get('http://localhost:5000/api/clients/locations');
        setLocationDistribution(locationResponse.data);

        const meetingTypesResponse = await axios.get('http://localhost:5000/api/appointments/meeting-types');
        setMeetingTypes(meetingTypesResponse.data);
      } catch (error) {
        console.error("Error fetching data", error);
      }
    };
    fetchData();
  }, []);

  // Prepare data for charts
  const genderChartData = {
    labels: ['Male', 'Female', 'Other'],
    datasets: [
      {
        label: 'Gender Distribution (%)',
        data: [genderDistribution.male, genderDistribution.female, genderDistribution.other],
        backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56'],
      },
    ],
  };

  const locationChartData = {
    labels: Object.keys(locationDistribution),
    datasets: [
      {
        label: 'Location Distribution',
        data: Object.values(locationDistribution),
        backgroundColor: '#4BC0C0',
      },
    ],
  };

  const meetingTypeChartData = {
    labels: ['Virtual', 'In-Person'],
    datasets: [
      {
        label: 'Meeting Types (%)',
        data: [meetingTypes.virtual, meetingTypes.inPerson],
        backgroundColor: ['#FF9F40', '#9966FF'],
      },
    ],
  };

  return (
    <Container maxWidth="lg" style={{ marginTop: '20px' }}>
      <Typography variant="h4" gutterBottom style={{ textAlign: 'center' }}>
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <FaCalendarCheck size={30} style={{ marginRight: '10px', color: 'teal' }} />
                <Typography variant="h6">Appointments Next Week</Typography>
              </Box>
              <Typography variant="h3">{appointmentsNextWeek}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <FaUsers size={30} style={{ marginRight: '10px', color: 'blue' }} />
                <Typography variant="h6">Appointments This Month</Typography>
              </Box>
              <Typography variant="h3">{appointmentsThisMonth}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <FaClock size={30} style={{ marginRight: '10px', color: 'purple' }} />
                <Typography variant="h6">Average Session Length (minutes)</Typography>
              </Box>
              <Typography variant="h3">{averageSessionLength.toFixed(2)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Gender Distribution
              </Typography>
              <Bar data={genderChartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Location Distribution
              </Typography>
              <Bar data={locationChartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Meeting Types
              </Typography>
              <Bar data={meetingTypeChartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
