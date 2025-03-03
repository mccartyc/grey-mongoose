import React, { useState } from 'react';
import { useApiCall } from '../context/ApiCallContext';
import { FaNetworkWired, FaChevronDown, FaChevronUp } from 'react-icons/fa';

const ApiCallCounter = ({ collapsed }) => {
  const { apiCalls } = useApiCall();
  const [expanded, setExpanded] = useState(false);

  // Format the timestamp to a readable format
  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Calculate percentage of rate limited calls
  const rateLimitPercentage = apiCalls.total > 0 
    ? Math.round((apiCalls.rateLimited / apiCalls.total) * 100) 
    : 0;

  // Determine status color based on rate limit percentage
  const getStatusColor = () => {
    if (rateLimitPercentage >= 20) return '#ff4d4f'; // Red for high rate limiting
    if (rateLimitPercentage >= 5) return '#faad14'; // Yellow for moderate rate limiting
    return '#52c41a'; // Green for low/no rate limiting
  };

  // Toggle expanded view
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  // If sidebar is collapsed, show a simplified view
  if (collapsed) {
    return (
      <div className="api-counter collapsed" title={`API Calls: ${apiCalls.total} (${apiCalls.rateLimited} rate limited)`}>
        <FaNetworkWired style={{ color: getStatusColor() }} />
        <span className="api-count">{apiCalls.total}</span>
      </div>
    );
  }

  return (
    <div className="api-counter">
      <div className="api-counter-header" onClick={toggleExpanded}>
        <FaNetworkWired style={{ color: getStatusColor() }} />
        <span className="api-counter-title">API Calls</span>
        <span className="api-counter-total">{apiCalls.total}</span>
        {expanded ? <FaChevronUp /> : <FaChevronDown />}
      </div>
      
      {expanded && (
        <div className="api-counter-details">
          <div className="api-counter-item">
            <span className="api-counter-label">Successful:</span>
            <span className="api-counter-value success">{apiCalls.successful}</span>
          </div>
          <div className="api-counter-item">
            <span className="api-counter-label">Failed:</span>
            <span className="api-counter-value failed">{apiCalls.failed}</span>
          </div>
          <div className="api-counter-item">
            <span className="api-counter-label">Rate Limited:</span>
            <span className="api-counter-value rate-limited">{apiCalls.rateLimited}</span>
          </div>
          <div className="api-counter-item">
            <span className="api-counter-label">Pending:</span>
            <span className="api-counter-value pending">{apiCalls.pending}</span>
          </div>
          <div className="api-counter-item">
            <span className="api-counter-label">Last Call:</span>
            <span className="api-counter-value">{formatTime(apiCalls.lastCall)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiCallCounter;
