import React from 'react';
interface SLAProgressBarProps {
  progress: number; // 0-100
}
const SLAProgressBar: React.FC<SLAProgressBarProps> = ({ progress }) => (
  <div className="w-full bg-gray-200 rounded-full h-4">
    <div
      className="bg-blue-600 h-4 rounded-full"
      style={{ width: `${progress}%` }}
    ></div>
  </div>
);
export default SLAProgressBar;
