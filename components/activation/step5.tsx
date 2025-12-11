'use client'
import { useState, useEffect } from 'react';
import { Building2, Wallet } from 'lucide-react';
import { validatePakistaniIBAN, validatePakistaniPhone } from '../../lib/pakistani-validators';
import { useActivation, Step5Data } from '../../contexts/ActivationContext';

interface Step5Props {
  onNext: (data: Step5Data) => void;
  onBack: () => void;
  onClose: () => void;
}

const Step5: React.FC<Step5Props> = ({ onNext, onBack, onClose }) => {
  const { getStepData, updateStepData } = useActivation();
  const [formData, setFormData] = useState<Step5Data>({
    accountType: 'bank',
    bankName: '',
    accountNumber: '',
    accountHolderName: ''
  });

  const [errors, setErrors] = useState<Partial<Record<keyof Step5Data, string>>>({});

  // Load saved data on component mount
  useEffect(() => {
    const savedData = getStepData(5) as Step5Data;
    if (savedData) {
      setFormData(savedData);
    }
  }, [getStepData]);

  const pakistanBanks = ['HBL (Habib Bank Limited)', 'UBL (United Bank Limited)', 'MCB (Muslim Commercial Bank)', 'Allied Bank', 'Bank Alfalah', 'Meezan Bank', 'Faysal Bank', 'Standard Chartered Bank', 'JS Bank', 'Bank Al Habib', 'Askari Bank', 'NBP (National Bank of Pakistan)', 'Soneri Bank', 'Silk Bank'];
  const ewalletProviders = ['JazzCash', 'Easypaisa', 'SadaPay', 'NayaPay', 'Upaisa'];

  const handlePaste = (e: React.ClipboardEvent) => e.preventDefault();
  const handleCopy = (e: React.ClipboardEvent) => e.preventDefault();

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof Step5Data, string>> = {};
    
    if (!formData.bankName) {
      newErrors.bankName = formData.accountType === 'bank' ? 'Bank name is required' : 'E-wallet provider is required';
    }
    
    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = 'Account number is required';
    } else if (formData.accountType === 'bank') {
      const ibanValidation = validatePakistaniIBAN(formData.accountNumber);
      if (!ibanValidation.isValid) {
        newErrors.accountNumber = ibanValidation.error;
      }
    } else if (formData.accountType === 'ewallet') {
      const phoneValidation = validatePakistaniPhone(formData.accountNumber);
      if (!phoneValidation.isValid) {
        newErrors.accountNumber = phoneValidation.error;
      }
    }
    
    if (!formData.accountHolderName.trim()) {
      newErrors.accountHolderName = 'Account holder name is required';
    } else if (formData.accountHolderName.trim().length < 3) {
      newErrors.accountHolderName = 'Name must be at least 3 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      updateStepData(5, formData);
      onNext(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="modal-card bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-100">
        <div className="p-6 sm:p-8">
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-semibold text-sm sm:text-base cursor-pointer hover:bg-emerald-700 transition-colors">✓</div>
                {i < 4 && <div className="w-8 sm:w-12 h-0.5 bg-emerald-600"></div>}
              </div>
            ))}

            <div className="w-8 aspect-square sm:w-10 sm:aspect-square shrink-0 rounded-full bg-emerald-600 text-white flex items-center justify-center font-semibold text-sm sm:text-base border-2 border-emerald-600 shadow-lg shadow-emerald-500/20">5</div>
            <div className="h-0.5 bg-slate-200 flex-1"></div>
            <div className="w-8 aspect-square sm:w-10 sm:aspect-square shrink-0 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-semibold text-sm sm:text-base border-2 border-slate-200">6</div>
          </div>

          <div className="mb-6 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Bank Account Information</h2>
            <p className="text-slate-500 text-sm sm:text-base">Provide your bank or e-wallet details for transactions.</p>
          </div>

          <div className="space-y-6">
            {/* Account Type */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Account Type</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button type="button" onClick={() => setFormData({ ...formData, accountType: 'bank', bankName: '' })} className={`flex items-center gap-3 p-4 border-2 rounded-xl transition-all ${formData.accountType === 'bank' ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200 hover:border-emerald-400 hover:bg-slate-50'}`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.accountType === 'bank' ? 'border-emerald-600' : 'border-slate-300'}`}>
                    {formData.accountType === 'bank' && <div className="w-3 h-3 rounded-full bg-emerald-600"></div>}
                  </div>
                  <Building2 className={`w-5 h-5 ${formData.accountType === 'bank' ? 'text-emerald-700' : 'text-slate-500'}`}/>
                  <span className={`font-bold ${formData.accountType === 'bank' ? 'text-emerald-900' : 'text-slate-700'}`}>Bank Account</span>
                </button>

                <button type="button" onClick={() => setFormData({ ...formData, accountType: 'ewallet', bankName: '' })} className={`flex items-center gap-3 p-4 border-2 rounded-xl transition-all ${formData.accountType === 'ewallet' ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200 hover:border-emerald-400 hover:bg-slate-50'}`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.accountType === 'ewallet' ? 'border-emerald-600' : 'border-slate-300'}`}>
                    {formData.accountType === 'ewallet' && <div className="w-3 h-3 rounded-full bg-emerald-600"></div>}
                  </div>
                  <Wallet className={`w-5 h-5 ${formData.accountType === 'ewallet' ? 'text-emerald-700' : 'text-slate-500'}`}/>
                  <span className={`font-bold ${formData.accountType === 'ewallet' ? 'text-emerald-900' : 'text-slate-700'}`}>E-Wallet</span>
                </button>
              </div>
            </div>

            {/* Bank/E-Wallet Provider */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {formData.accountType === 'bank' ? 'Bank Name' : 'E-Wallet Provider'}
              </label>
              <select value={formData.bankName} onChange={(e) => setFormData({ ...formData, bankName: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-slate-900 transition-all font-medium">
                <option value="">Select an option</option>
                {(formData.accountType === 'bank' ? pakistanBanks : ewalletProviders).map(name => <option key={name} value={name}>{name}</option>)}
              </select>
              {errors.bankName && <p className="mt-1 text-sm text-red-600 font-medium flex items-center gap-1">⚠️ {errors.bankName}</p>}
            </div>

            {/* Account Number */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {formData.accountType === 'bank' ? 'IBAN Account Number' : 'Mobile Number'}
              </label>
              <input 
                type="text" 
                value={formData.accountNumber} 
                onChange={(e) => {
                  const value = e.target.value;
                  if (formData.accountType === 'bank') {
                    // For bank IBAN: allow letters, numbers, and spaces, max 30 characters (with spaces)
                    if (/^[A-Za-z0-9\s]*$/.test(value) && value.length <= 30) {
                      setFormData({ ...formData, accountNumber: value });
                    }
                  } else {
                    // For e-wallet: only numbers, max 11 digits
                    if (/^[0-9]*$/.test(value) && value.length <= 11) {
                      setFormData({ ...formData, accountNumber: value });
                    }
                  }
                }} 
                onPaste={handlePaste} 
                onCopy={handleCopy} 
                placeholder={formData.accountType === 'bank' ? 'PK36SCBL0000001123456702' : '03XXXXXXXXX'} 
                maxLength={formData.accountType === 'bank' ? 30 : 11}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-slate-900 transition-all font-medium"
              />
              {errors.accountNumber && <p className="mt-1 text-sm text-red-600 font-medium flex items-center gap-1">⚠️ {errors.accountNumber}</p>}
            </div>

            {/* Account Holder Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Account Holder Name</label>
              <input type="text" value={formData.accountHolderName} onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })} onPaste={handlePaste} onCopy={handleCopy} placeholder="As it appears on your account" className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-slate-900 transition-all font-medium"/>
              {errors.accountHolderName && <p className="mt-1 text-sm text-red-600 font-medium flex items-center gap-1">⚠️ {errors.accountHolderName}</p>}
            </div>
          </div>

          <div className="flex gap-3 mt-8 pt-6 border-t border-slate-100">
            <button onClick={onBack} className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-bold">Back</button>
            <button onClick={handleSubmit} className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors font-bold shadow-lg shadow-emerald-600/20">Continue</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step5;