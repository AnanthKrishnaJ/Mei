
import React from 'react';
import { THEME } from '../constants.tsx';

interface GaugeProps {
  score: number;
  color: string;
}

const Gauge: React.FC<GaugeProps> = ({ score, color }) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-32 h-32 mx-auto mb-2">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle
          className="stroke-gray-800 fill-none"
          strokeWidth="10"
          cx="50"
          cy="50"
          r={radius}
        />
        <circle
          className="fill-none transition-all duration-1000 ease-out"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          cx="50"
          cy="50"
          r={radius}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center font-orbitron">
        <span className="text-2xl font-bold" style={{ color }}>{score}%</span>
      </div>
    </div>
  );
};

export default Gauge;
