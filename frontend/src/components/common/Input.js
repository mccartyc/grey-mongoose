import React from 'react';
import PropTypes from 'prop-types';
import './Input.css';

const Input = ({
  label,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  placeholder,
  name,
  disabled = false,
  className = '',
  labelClassName = '',
  inputClassName = '',
  ...props
}) => {
  const inputId = name || Math.random().toString(36).substr(2, 9);

  return (
    <div className={`input-wrapper ${className}`}>
      {label && (
        <label 
          htmlFor={inputId}
          className={`input-label ${required ? 'required' : ''} ${labelClassName}`}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        name={name}
        className={`input-field ${error ? 'error' : ''} ${inputClassName}`}
        {...props}
      />
      {error && <div className="input-error">{error}</div>}
    </div>
  );
};

Input.propTypes = {
  label: PropTypes.string,
  type: PropTypes.oneOf([
    'text',
    'password',
    'email',
    'number',
    'tel',
    'url',
    'date',
    'time',
    'datetime-local',
  ]),
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  required: PropTypes.bool,
  placeholder: PropTypes.string,
  name: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  labelClassName: PropTypes.string,
  inputClassName: PropTypes.string,
};

export default Input;
