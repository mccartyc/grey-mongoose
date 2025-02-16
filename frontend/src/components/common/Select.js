import React from 'react';
import PropTypes from 'prop-types';
import './Select.css';

const Select = ({
  label,
  options,
  value,
  onChange,
  error,
  required = false,
  placeholder = 'Select an option',
  name,
  disabled = false,
  className = '',
  labelClassName = '',
  selectClassName = '',
  ...props
}) => {
  const selectId = name || Math.random().toString(36).substr(2, 9);

  return (
    <div className={`select-wrapper ${className}`}>
      {label && (
        <label 
          htmlFor={selectId}
          className={`select-label ${required ? 'required' : ''} ${labelClassName}`}
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        name={name}
        className={`select-field ${error ? 'error' : ''} ${selectClassName}`}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option 
            key={option.value} 
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      {error && <div className="select-error">{error}</div>}
    </div>
  );
};

Select.propTypes = {
  label: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
      disabled: PropTypes.bool,
    })
  ).isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  required: PropTypes.bool,
  placeholder: PropTypes.string,
  name: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  labelClassName: PropTypes.string,
  selectClassName: PropTypes.string,
};

export default Select;
