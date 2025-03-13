import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthContextProvider } from './context/AuthContext';
import { ApiCallProvider } from './context/ApiCallContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Admin from './pages/Admin';
import Register from './pages/Register';
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import Intake from "./pages/Intake";
import NewClientSession from "./pages/NewClientSession";
import HealthAssessment from "./pages/HealthAssessment";
import HealthPlan from "./pages/HealthPlan";
import Calendar from "./pages/Calendar";
import Invoicing from "./pages/Invoicing";
import Sessions from "./pages/Sessions";
import NewSession from './pages/NewSession';
import SessionDetailPage from './pages/SessionDetailPage';
import Settings from './pages/Settings';
import Unauthorized from './pages/Unauthorized';
import TestLogin from './pages/TestLogin';
import ApiTest from './pages/ApiTest';
import AuthCallback from './pages/AuthCallback';
import GoogleAuthSetup from './pages/GoogleAuthSetup';
import TestSubscription from './pages/TestSubscription';

const App = () => (

  <Router>
    <AuthContextProvider>
      <ApiCallProvider>
        <NotificationProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/test-login" element={<TestLogin />} />
          <Route path="/api-test" element={<ApiTest />} />
          <Route path="/auth-callback" element={<AuthCallback />} />
          <Route path="/google-auth-setup" element={<GoogleAuthSetup />} />
          <Route path="/test-subscription" element={<TestSubscription />} />

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
              <ProtectedRoute requiredRoles={['Internal', 'Admin']}>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
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
            path="/clients/:id/overview"
            element={
              <ProtectedRoute>
                <ClientDetail />
               </ProtectedRoute>
              } 
            />
          <Route 
            path="/clients/:id/intake"
            element={
              <ProtectedRoute>
                <Intake />
               </ProtectedRoute>
              } 
            />
            <Route 
            path="/clients/:id/health-assessment"
            element={
              <ProtectedRoute>
                 <HealthAssessment/>
               </ProtectedRoute>
              } 
            />
            <Route 
            path="/clients/:id/health-plan"
            element={
              <ProtectedRoute>
                <HealthPlan/>
               </ProtectedRoute>
              } 
            />
            <Route 
            path="/clients/:id/new-session"
            element={
              <ProtectedRoute>
                <NewClientSession/>
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
            path="/sessions/:id"
            element={
              <ProtectedRoute>
                <SessionDetailPage />
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
        </NotificationProvider>
      </ApiCallProvider>
    </AuthContextProvider>
  </Router>
);




export default App;
