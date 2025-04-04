import React from 'react';
import { ProgressBar } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const ProgressDonut = ({ percentage = 0, size = 200, strokeWidth = 15, textColor = '#000', primaryColor = '#007bff' }) => {
  // Ensure percentage is between 0 and 100
  const validPercentage = Math.min(100, Math.max(0, percentage));
  
  // Calculate circle values
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (validPercentage / 100) * circumference;
  
  // Center position
  const center = size / 2;
  
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      {/* Background circle */}
      <svg width={size} height={size}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="#e9ecef"
          strokeWidth={strokeWidth}
        />
        
        {/* Progress circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke={primaryColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: 'center',
            transition: 'stroke-dashoffset 0.5s ease-in-out'
          }}
        />
        
        {/* Text in the center */}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={textColor}
          fontSize={`${size/5}px`}
          fontWeight="bold"
        >
          {validPercentage}%
        </text>
      </svg>
    </div>
  );
};

// Example usage component with controls
const ProgressDonutExample = () => {
  const [progress, setProgress] = React.useState(65);
  
  const handleChange = (e) => {
    setProgress(Number(e.target.value));
  };
  
  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-6 d-flex justify-content-center">
          <ProgressDonut percentage={progress} />
        </div>
        <div className="col-md-6 d-flex align-items-center">
          <div className="w-100">
            <h4>Progress Donut Control</h4>
            <ProgressBar now={progress} label={`${progress}%`} className="mb-3" />
            <div className="form-group">
              <label htmlFor="progressRange">Adjust Progress: {progress}%</label>
              <input
                type="range"
                className="form-control-range"
                id="progressRange"
                min="0"
                max="100"
                value={progress}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { ProgressDonut, ProgressDonutExample };
export default ProgressDonutExample;