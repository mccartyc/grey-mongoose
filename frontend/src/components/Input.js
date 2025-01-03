import React from 'react';

const InputField = ({
  label,
  type,
  value,
  onChange,
  options = [],
  required = false,
  placeholder = '',
  className = '' // New className prop
}) => {
  // Render different input types based on the type prop
  const renderInput = () => {
    switch (type) {
      case 'select':
        return (
          <select className={className} value={value} onChange={onChange} required={required}>
            <option value="">Select {label}</option>
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      case 'date':
        return (
          <input
            className={className}
            type="date"
            value={value}
            onChange={onChange}
            required={required}
          />
        );
      case 'textarea':
        return (
          <textarea
            className={className}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
          />
        );
      default:
        return (
          <input
            className={className}
            type={type}
            value={value}
            onChange={onChange}
            required={required}
            placeholder={placeholder}
          />
        );
    }
  };

  return (
    <div className="input-field">
      <label>
        <span>{label}:</span>
        {renderInput()}
      </label>
    </div>
  );
};

export default InputField;