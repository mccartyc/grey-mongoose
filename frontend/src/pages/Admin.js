import React, { useState } from 'react';
import AdminNavbar from '../components/AdminNavbar';
import TenantStep from '../components/TenantStep';
import UserStep from '../components/UserStep';
import ClientStep from '../components/ClientStep';
import '../styles/styles.css';

const Admin = () => {
  const [step, setStep] = useState(1);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const handleNextStep = () => {
    setStep((prevStep) => prevStep + 1);
  };

  const handlePreviousStep = () => {
    setStep((prevStep) => prevStep - 1);
  };

  return (
    <div className="admin-page">
      <AdminNavbar />
      <div className="admin-container">
        {step === 1 && (
          <TenantStep
            onNext={handleNextStep}
            onSelectTenant={(tenant) => setSelectedTenant(tenant)}
          />
        )}
        {step === 2 && (
          <UserStep
            onNext={handleNextStep}
            onPrevious={handlePreviousStep}
            onSelectUser={(user) => setSelectedUser(user)}
          />
        )}
        {step === 3 && (
          <ClientStep
            onPrevious={handlePreviousStep}
            selectedTenant={selectedTenant}
            selectedUser={selectedUser}
          />
        )}
      </div>
    </div>
  );
};

export default Admin;
