import React from 'react';
import { DetailItemProps } from './types';

const DetailItem: React.FC<DetailItemProps> = ({ item, children, className = '' }) => {
  return (
    <div className={`card bg-base-100 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <div className="card-body p-4">
        <h3 className="card-title text-lg font-semibold mb-2">
          {item.label}
        </h3>
        <div className="mt-1">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DetailItem;
