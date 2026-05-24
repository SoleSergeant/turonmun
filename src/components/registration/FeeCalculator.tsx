import React from 'react';
import { Award, BadgeCheck } from 'lucide-react';

interface FeeCalculatorProps {
  discountEligibility: string[];
}

const FeeCalculator: React.FC<FeeCalculatorProps> = ({ discountEligibility }) => {
  const calculateFee = () => {
    let baseFee = 79000; // Season 5 delegate fee
    let discount = 0;
    
    if (discountEligibility.includes('IELTS')) discount += 10000;
    if (discountEligibility.includes('SAT')) discount += 10000;
    
    return {
      originalFee: baseFee,
      discount: discount,
      finalFee: baseFee - discount
    };
  };

  const fee = calculateFee();

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-xl shadow-sm border border-neutral-100 mb-8">
      <div className="flex items-center justify-center mb-3">
        <Award className="w-6 h-6 text-diplomatic-600 mr-2" />
        <h3 className="text-xl font-semibold text-diplomatic-900">Registration Fee</h3>
      </div>
      <p className="text-lg font-medium text-diplomatic-800 mb-2">
        Base Fee: <span className="font-bold">{fee.originalFee.toLocaleString()} UZS</span>
      </p>
      <p className="text-sm text-neutral-600 mb-3">
        Qualify for discounts with IELTS 6.5+ or SAT 1350+ test scores!
      </p>
      
      <div className="flex flex-col space-y-2 bg-neutral-50 p-3 rounded-lg mb-3">
        <div className="flex items-center text-sm text-neutral-700">
          <BadgeCheck className="w-4 h-4 text-green-600 mr-2" />
          <span>IELTS 6.5+: 10,000 UZS discount</span>
        </div>
        <div className="flex items-center text-sm text-neutral-700">
          <BadgeCheck className="w-4 h-4 text-green-600 mr-2" />
          <span>SAT 1350+: 10,000 UZS discount</span>
        </div>
        <div className="text-xs text-neutral-500 mt-1">
          Max discount: 20,000 UZS
        </div>
      </div>
      
      {(fee.discount > 0) && (
        <div className="text-green-700 bg-green-50 p-2 rounded text-sm mb-3">
          Your Discount: {fee.discount.toLocaleString()} UZS
        </div>
      )}
      
      <div className="text-lg font-bold text-diplomatic-900 border-t pt-3">
        Your Fee: {fee.finalFee.toLocaleString()} UZS
      </div>
    </div>
  );
};

export default FeeCalculator;
