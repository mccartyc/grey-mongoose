import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthContextProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Admin from './pages/Admin';
import Register from './pages/Register';
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import Intake from "./pages/Intake";
import Calendar from "./pages/Calendar";
import Invoicing from "./pages/Invoicing";
import Sessions from "./pages/Sessions";
import NewSession from './pages/NewSession';

const App = () => (

  <Router>
    <AuthContextProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients"
          element={
            <ProtectedRoute>
              <Clients />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/clients/:id"
          element={
            <ProtectedRoute>
              <ClientDetail />
             </ProtectedRoute>
            } 
          />
        <Route 
          path="/clients/:Id/intake"
          element={
            <ProtectedRoute>
              <Intake />
             </ProtectedRoute>
            } 
          />
          <Route 
          path="/clients/:Id/health-assessment"
          element={
            <ProtectedRoute>
              <div>...Coming Soon</div>
             </ProtectedRoute>
            } 
          />
          <Route 
          path="/clients/:Id/health-plan"
          element={
            <ProtectedRoute>
              <div>...Coming Soon</div>
             </ProtectedRoute>
            } 
          />
        <Route
          path="/sessions"
          element={
            <ProtectedRoute>
              <Sessions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <Calendar />
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoicing"
          element={
            <ProtectedRoute>
              <Invoicing />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sessions/newsession"
          element={
            <ProtectedRoute>
              <NewSession />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthContextProvider>
  </Router>
);




export default App;
