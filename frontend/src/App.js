import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Admin from './pages/Admin';
import Register from './pages/Register';
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Calendar from "./pages/Calendar";
import Invoicing from "./pages/Invoicing";
import Sessions from "./pages/Sessions";
import NewSession from './pages/NewSession';

const App = () => (
  <Router>
    <Routes>
      {/* Pages without AuthContext */}
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Pages with AuthContext */}
      <Route
        path="*"
        element={
          <AuthProvider>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/sessions" element={<Sessions />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/invoicing" element={<Invoicing />} />
              <Route path="/sessions/newsession" element={<NewSession />} />
            </Routes>
          </AuthProvider>
        }
      />
    </Routes>
  </Router>
);

export default App;
