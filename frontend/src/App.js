import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Admin from './pages/Admin';
import Register from './pages/Register';
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Calendar from "./pages/Calendar";
import Invoicing from "./pages/Invoicing";
import Sessions from "./pages/Sessions";

const App = () => (
  <Router>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/clients" element={<Clients />} />
      <Route path="/sessions" element={<Sessions />} />
      <Route path="/calendar" element={<Calendar />} />
      <Route path="/invoicing" element={<Invoicing />} />

    </Routes>
  </Router>
);

export default App;
