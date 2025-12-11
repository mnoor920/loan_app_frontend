'use client'
import React, { useState, useEffect } from 'react';
import { useActivation, Step3Data } from '../../contexts/ActivationContext';

interface Step3Props {
  onNext: (data: Step3Data) => void;
  onBack: () => void;
  onClose: () => void;
}

const Step3: React.FC<Step3Props> = ({ onNext, onBack, onClose }) => {
  const { getStepData, updateStepData } = useActivation();
  const [formData, setFormData] = useState<Step3Data>({
    residingCountry: 'Pakistan',
    stateRegionProvince: '',
    townCity: ''
  });

  const [errors, setErrors] = useState<Partial<Record<keyof Step3Data, string>>>({});

  // Load saved data on component mount
  useEffect(() => {
    const savedData = getStepData(3) as Step3Data;
    if (savedData) {
      setFormData(savedData);
    }
  }, [getStepData]);

  const pakistanProvinces = ['Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan', 'Gilgit-Baltistan', 'Azad Kashmir'];

  const handlePaste = (e: React.ClipboardEvent) => e.preventDefault();
  const handleCopy = (e: React.ClipboardEvent) => e.preventDefault();

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof Step3Data, string>> = {};
    if (!formData.stateRegionProvince.trim()) newErrors.stateRegionProvince = 'Province is required';
    if (!formData.townCity.trim()) newErrors.townCity = 'City is required';
    else if (formData.townCity.trim().length < 2) newErrors.townCity = 'City name must be at least 2 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      updateStepData(3, formData);
      onNext(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="modal-card bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-100">
        <div className="p-6 sm:p-8">
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-8">
            {[1, 2].map(i => (
              <React.Fragment key={i}>
                <div className="w-8 aspect-square sm:w-10 sm:aspect-square shrink-0 rounded-full bg-emerald-600 text-white flex items-center justify-center font-semibold text-sm sm:text-base cursor-pointer hover:bg-emerald-700 transition-colors">✓</div>
                <div className="w-8 sm:w-12 h-0.5 bg-emerald-600"></div>
              </React.Fragment>
            ))}
            <div className="flex items-center">
              <div className="w-8 aspect-square sm:w-10 sm:aspect-square shrink-0 rounded-full bg-emerald-600 text-white flex items-center justify-center font-semibold text-sm sm:text-base border-2 border-emerald-600 shadow-lg shadow-emerald-500/20">3</div>
            </div>
            <div className="h-0.5 bg-slate-200 flex-1"></div>
            {[4, 5, 6].map(i => (
              <React.Fragment key={i}>
                <div className="w-8 aspect-square sm:w-10 sm:aspect-square shrink-0 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-semibold text-sm sm:text-base border-2 border-slate-200">{i}</div>
                {i < 6 && <div className="h-0.5 bg-slate-200 flex-1"></div>}
              </React.Fragment>
            ))}
          </div>

          <div className="mb-6 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Current residential address</h2>
            <p className="text-slate-500 text-sm sm:text-base">Please provide your current place of residence.</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Residing Country</label>
              <input type="text" value="Pakistan" disabled className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed font-medium"/>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">State / Region / Province</label>
                <select value={formData.stateRegionProvince} onChange={(e) => setFormData({ ...formData, stateRegionProvince: e.target.value })} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-slate-900 transition-all font-medium">
                  <option value="">Select province</option>
                  {pakistanProvinces.map(province => <option key={province} value={province}>{province}</option>)}
                </select>
                {errors.stateRegionProvince && <p className="mt-1 text-sm text-red-600 font-medium flex items-center gap-1">⚠️ {errors.stateRegionProvince}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Town / City</label>
                <input type="text" value={formData.townCity} onChange={(e) => setFormData({ ...formData, townCity: e.target.value })} onPaste={handlePaste} onCopy={handleCopy} placeholder="Enter your city" className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-slate-900 transition-all font-medium"/>
                {errors.townCity && <p className="mt-1 text-sm text-red-600 font-medium flex items-center gap-1">⚠️ {errors.townCity}</p>}
              </div>
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

export default Step3;
