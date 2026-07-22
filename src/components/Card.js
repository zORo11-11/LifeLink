import React from 'react';

const Card = ({ title, description, icon, onClick, className = '' }) => {
  return (
    <div 
      className={`bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow cursor-pointer ${className}`}
      onClick={onClick}
    >
      {icon && <div className="text-3xl mb-4">{icon}</div>}
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </div>
  );
};

export default Card;