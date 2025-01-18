import React, { useState, useEffect } from 'react';
import SideNavBar from '../components/SideNavBar';
import TenantStep from '../components/admin/TenantStep';
import UserStep from '../components/admin/UserStep';
import ClientStep from '../components/admin/ClientStep';
import '../styles/styles.css';


const Admin = () => {
  const [step, setStep] = useState(1);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    // Scroll to the top of the page when the component is mounted
    window.scrollTo(0, 0);
  }, []); // Empty dependency array ensures this runs only once on mount


  const handleNextStep = () => {
    setStep((prevStep) => prevStep + 1);
  };

  const handlePreviousStep = () => {
    setStep((prevStep) => prevStep - 1);
  };

  const renderStepComponent = () => {
    switch (step) {
      case 1:
        return <TenantStep onNext={handleNextStep} onSelectTenant={setSelectedTenant} />;
      case 2:
        return (
          <UserStep
            selectedTenant={selectedTenant}
            onNext={handleNextStep}
            onPrevious={handlePreviousStep}
            onSelectUser={setSelectedUser}
          />
        );
      case 3:
        return (
          <ClientStep
            onPrevious={handlePreviousStep}
            selectedTenant={selectedTenant}
            selectedUser={selectedUser}
          />
        );
      default:
        return <TenantStep onNext={handleNextStep} onSelectTenant={setSelectedTenant} />;
    }
  };

  return (
      <div className="main-content">
        <SideNavBar />
        <div className="content-area">
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
