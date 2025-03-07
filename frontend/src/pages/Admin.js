import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import SideNavBar from '../components/SideNavBar';
import TenantStep from '../components/admin/TenantStep';
import UserStep from '../components/admin/UserStep';
import ClientStep from '../components/admin/ClientStep';
import { useAuth } from '../context/AuthContext';
import '../styles/styles.css';


const Admin = () => {
  const [step, setStep] = useState(1);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const { userInfo } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []); 

  // Check if user has access to the Admin panel
  const canAccessAdmin = userInfo?.role === 'Internal' || userInfo?.role === 'Admin';

  if (!canAccessAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleNextStep = () => {
    setStep((prevStep) => prevStep + 1);
  };

  const handlePreviousStep = () => {
    setStep((prevStep) => prevStep - 1);
  };

  const handleSelectTenant = (tenant) => {
    setSelectedTenant(tenant);
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
  };

  const renderStepComponent = () => {
    switch (step) {
      case 1:
        return <TenantStep onNext={handleNextStep} onSelectTenant={handleSelectTenant} />;
      case 2:
        if (!selectedTenant) return null;
        return (
          <UserStep
            key={selectedTenant._id}
            selectedTenant={selectedTenant}
            onNext={handleNextStep}
            onPrevious={handlePreviousStep}
            onSelectUser={handleSelectUser}
          />
        );
      case 3:
        if (!selectedTenant || !selectedUser) return null;
        return (
          <ClientStep
            onPrevious={handlePreviousStep}
            selectedTenant={selectedTenant}
            selectedUser={selectedUser}
          />
        );
      default:
        return <TenantStep onNext={handleNextStep} onSelectTenant={handleSelectTenant} />;
    }
  };

  return (
      <div className="main-content">
        <SideNavBar />
        <div className="content-area">
          <h1 className="page-heading">Admin Panel</h1>
          <div className="progress-bar">
            <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>1. Tenant</div>
            <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>2. User</div>
            <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>3. Client</div>
          </div>
        <div className="step-content">{renderStepComponent()}</div>
        </div>
      </div>
  );
};

export default Admin;
