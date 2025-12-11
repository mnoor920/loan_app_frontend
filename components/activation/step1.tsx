'use client'
import { useState, useEffect } from 'react';
import { useActivation, Step1Data } from '../../contexts/ActivationContext';

interface Step1Props {
  onNext: (data: Step1Data) => void;
  onClose: () => void;
}

const Step1: React.FC<Step1Props> = ({ onNext, onClose }) => {
  const { getStepData, updateStepData } = useActivation();
  const [formData, setFormData] = useState<Step1Data>({
    gender: 'male',
    fullName: '',
    dateOfBirth: {
      day: '',
      month: '',
      year: ''
    },
    maritalStatus: '',
    nationality: 'Pakistani',
    agreedToTerms: false
  });

  const [errors, setErrors] = useState<Partial<Record<keyof Step1Data, string>>>({});

  // Load saved data on component mount
  useEffect(() => {
    const savedData = getStepData(1) as Step1Data;
    if (savedData) {
      setFormData(savedData);
    }
  }, [getStepData]);

  // Generate days, months, years for dropdowns
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => (currentYear - 18 - i).toString());

  const maritalStatuses = ['Single', 'Married', 'Divorced', 'Widowed'];

  // Prevent copy-paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
  };

  const handleCopy = (e: React.ClipboardEvent) => {
    e.preventDefault();
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof Step1Data, string>> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = 'Name must be at least 3 characters';
    }

    if (!formData.dateOfBirth.day || !formData.dateOfBirth.month || !formData.dateOfBirth.year) {
      newErrors.dateOfBirth = 'Complete date of birth is required';
    }

    if (!formData.maritalStatus) {
      newErrors.maritalStatus = 'Marital status is required';
    }

    if (!formData.agreedToTerms) {
      newErrors.agreedToTerms = 'You must agree to the terms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      updateStepData(1, formData);
      onNext(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-hidden">
      <div className="modal-card bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-none border border-slate-100">
        <div className="p-6 sm:p-8">
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-8">
            <div className="flex items-center">
              <div className="w-8 aspect-square sm:w-10 sm:aspect-square rounded-full bg-emerald-600 text-white flex items-center justify-center font-semibold text-sm sm:text-base border-2 border-emerald-600 shadow-lg shadow-emerald-500/20">
                1
              </div>
            </div>
            <div className="h-0.5 bg-slate-200 flex-1"></div>
            <div className="w-8 aspect-square sm:w-10 sm:aspect-square rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-semibold text-sm sm:text-base border-2 border-slate-200">
              2
            </div>
            <div className="h-0.5 bg-slate-200 flex-1"></div>
            <div className="w-8 aspect-square sm:w-10 sm:aspect-square rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-semibold text-sm sm:text-base border-2 border-slate-200">
              3
            </div>
            <div className="h-0.5 bg-slate-200 flex-1"></div>
            <div className="w-8 aspect-square sm:w-10 sm:aspect-square rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-semibold text-sm sm:text-base border-2 border-slate-200">
              4
            </div>
            <div className="h-0.5 bg-slate-200 flex-1"></div>
            <div className="w-8 aspect-square sm:w-10 sm:aspect-square rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-semibold text-sm sm:text-base border-2 border-slate-200">
              5
            </div>
            <div className="h-0.5 bg-slate-200 flex-1"></div>
            <div className="w-8 aspect-square sm:w-10 sm:aspect-square rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-semibold text-sm sm:text-base border-2 border-slate-200">
              6
            </div>
          </div>

          {/* Form Header */}
          <div className="mb-6 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
              Tell us about yourself
            </h2>
            <p className="text-slate-500 text-sm sm:text-base">
              Make sure this info matches your ID
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            {/* Gender */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Gender:
              </label>
              <div className="flex gap-4">
                <label className={`flex items-center cursor-pointer px-4 py-2 rounded-lg border flex-1 justify-center transition-all ${formData.gender === 'male' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-200'}`}>
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={formData.gender === 'male'}
                    onChange={(e) => setFormData({ ...formData, gender: 'male' })}
                    className="hidden"
                  />
                  <span className="font-medium">Male</span>
                </label>
                <label className={`flex items-center cursor-pointer px-4 py-2 rounded-lg border flex-1 justify-center transition-all ${formData.gender === 'female' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-200'}`}>
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={formData.gender === 'female'}
                    onChange={(e) => setFormData({ ...formData, gender: 'female' })}
                    className="hidden"
                  />
                  <span className="font-medium">Female</span>
                </label>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Full Name:
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                onPaste={handlePaste}
                onCopy={handleCopy}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-slate-900 transition-all font-medium"
                placeholder="Enter your full name"
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600 font-medium flex items-center gap-1">⚠️ {errors.fullName}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Date of Birth:
              </label>
              <div className="grid grid-cols-3 gap-3">
                <select
                  value={formData.dateOfBirth.day}
                  onChange={(e) => setFormData({
                    ...formData,
                    dateOfBirth: { ...formData.dateOfBirth, day: e.target.value }
                  })}
                  className="px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-slate-900 transition-all"
                >
                  <option value="">Day</option>
                  {days.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
                <select
                  value={formData.dateOfBirth.month}
                  onChange={(e) => setFormData({
                    ...formData,
                    dateOfBirth: { ...formData.dateOfBirth, month: e.target.value }
                  })}
                  className="px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-slate-900 transition-all"
                >
                  <option value="">Month</option>
                  {months.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
                <select
                  value={formData.dateOfBirth.year}
                  onChange={(e) => setFormData({
                    ...formData,
                    dateOfBirth: { ...formData.dateOfBirth, year: e.target.value }
                  })}
                  className="px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-slate-900 transition-all"
                >
                  <option value="">Year</option>
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              {errors.dateOfBirth && (
                <p className="mt-1 text-sm text-red-600 font-medium flex items-center gap-1">⚠️ {errors.dateOfBirth}</p>
              )}
            </div>

            {/* Marital Status */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Marital Status:
              </label>
              <select
                value={formData.maritalStatus}
                onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-slate-900 transition-all"
              >
                <option value="">Select marital status</option>
                {maritalStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              {errors.maritalStatus && (
                <p className="mt-1 text-sm text-red-600 font-medium flex items-center gap-1">⚠️ {errors.maritalStatus}</p>
              )}
            </div>

            {/* Nationality */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Nationality:
              </label>
              <input
                type="text"
                value="Pakistani"
                disabled
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed font-medium"
              />
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start gap-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <input
                type="checkbox"
                checked={formData.agreedToTerms}
                onChange={(e) => setFormData({ ...formData, agreedToTerms: e.target.checked })}
                className="w-5 h-5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 mt-0.5 flex-shrink-0 cursor-pointer accent-emerald-600"
              />
              <label className="text-sm text-slate-600 leading-relaxed">
                I understand that it is obligated to report all of its customer's payment behaviors to credit bureaus and that failure to repay on time will affect my capability of applying for loans in the future, whether from Global Dominion Financing, Inc. here or from other financial institutions.
              </label>
            </div>
            {errors.agreedToTerms && (
              <p className="text-sm text-red-600 font-medium flex items-center gap-1">⚠️ {errors.agreedToTerms}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-slate-100">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-bold"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors font-bold shadow-lg shadow-emerald-600/20"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step1;