import React from 'react';
import { Award } from 'lucide-react';

const FeeCalculator: React.FC = () => {
  const fee = 90000;

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-xl shadow-sm border border-neutral-100 mb-8">
      <div className="flex items-center justify-center mb-3">
        <Award className="w-6 h-6 text-diplomatic-600 mr-2" />
        <h3 className="text-xl font-semibold text-diplomatic-900">Application Fee</h3>
      </div>
      <div className="text-center text-2xl font-bold text-diplomatic-900">
        {fee.toLocaleString()} UZS
      </div>
      <p className="text-sm text-neutral-500 text-center mt-2">
        Payable upon acceptance
      </p>
    </div>
  );
};

export default FeeCalculator;
