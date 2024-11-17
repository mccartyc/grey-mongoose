import React from "react";

const Button = ({ children, type, onClick, className }) => {
  const buttonClass = `btn ${type === "primary" ? "primary-btn" : "secondary-btn"} ${className || ""}`;
  return (
    <button className={buttonClass} onClick={onClick}>
      {children}
    </button>
  );
};

export default Button;
