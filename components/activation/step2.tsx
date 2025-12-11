'use client'
import { useState, useEffect } from 'react';
import { validatePakistaniPhone } from '../../lib/pakistani-validators';
import { useActivation, Step2Data } from '../../contexts/ActivationContext';

interface Step2Props {
  onNext: (data: Step2Data) => void;
  onBack: () => void;
  onClose: () => void;
}

const Step2: React.FC<Step2Props> = ({ onNext, onBack, onClose }) => {
  const { getStepData, updateStepData } = useActivation();
  const [references, setReferences] = useState([
    { fullName: '', relationship: '', phoneNumber: '' }
  ]);
  const [errors, setErrors] = useState<string[]>([]);

  // Load saved data on component mount
  useEffect(() => {
    const savedData = getStepData(2) as Step2Data;
    if (savedData?.familyRelatives && savedData.familyRelatives.length > 0) {
      setReferences(savedData.familyRelatives);
    }
  }, [getStepData]);

  // Prevent copy-paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
  };

  const handleCopy = (e: React.ClipboardEvent) => {
    e.preventDefault();
  };

  const addReference = () => {
    if (references.length < 3) {
      setReferences([...references, { fullName: '', relationship: '', phoneNumber: '' }]);
    }
  };

  const removeReference = (index: number) => {
    if (references.length > 1) {
      setReferences(references.filter((_, i) => i !== index));
    }
  };

  const updateReference = (index: number, field: string, value: string) => {
    const updated = [...references];
    updated[index] = { ...updated[index], [field]: value };
    setReferences(updated);
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const result = validatePakistaniPhone(phone);
    return result.isValid;
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    references.forEach((ref, index) => {
      if (!ref.fullName.trim()) {
        newErrors.push(`Reference ${index + 1}: Full name is required`);
      }
      if (!ref.relationship.trim()) {
        newErrors.push(`Reference ${index + 1}: Relationship is required`);
      }
      if (!ref.phoneNumber.trim()) {
        newErrors.push(`Reference ${index + 1}: Phone number is required`);
      } else {
        const phoneValidation = validatePakistaniPhone(ref.phoneNumber);
        if (!phoneValidation.isValid) {
          newErrors.push(`Reference ${index + 1}: ${phoneValidation.error}`);
        }
      }
    });

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const stepData: Step2Data = { familyRelatives: references };
      updateStepData(2, stepData);
      onNext(stepData);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="modal-card bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-100">
        <div className="p-6 sm:p-8">
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-8">
            <div className="w-8 aspect-square sm:w-10 sm:aspect-square shrink-0 rounded-full bg-emerald-600 text-white flex items-center justify-center font-semibold text-sm sm:text-base cursor-pointer hover:bg-emerald-700 transition-colors">
              ✓
            </div>
            <div className="w-8 sm:w-12 h-0.5 bg-emerald-600"></div>
            <div className="flex items-center">
              <div className="w-8 aspect-square sm:w-10 sm:aspect-square shrink-0 rounded-full bg-emerald-600 text-white flex items-center justify-center font-semibold text-sm sm:text-base border-2 border-emerald-600 shadow-lg shadow-emerald-500/20">
                2
              </div>
            </div>
            <div className="h-0.5 bg-slate-200 flex-1"></div>
            <div className="w-8 aspect-square sm:w-10 sm:aspect-square shrink-0 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-semibold text-sm sm:text-base border-2 border-slate-200">
              3
            </div>
            <div className="h-0.5 bg-slate-200 flex-1"></div>
            <div className="w-8 aspect-square sm:w-10 sm:aspect-square shrink-0 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-semibold text-sm sm:text-base border-2 border-slate-200">
              4
            </div>
            <div className="h-0.5 bg-slate-200 flex-1"></div>
            <div className="w-8 aspect-square sm:w-10 sm:aspect-square shrink-0 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-semibold text-sm sm:text-base border-2 border-slate-200">
              5
            </div>
            <div className="h-0.5 bg-slate-200 flex-1"></div>
            <div className="w-8 aspect-square sm:w-10 sm:aspect-square shrink-0 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-semibold text-sm sm:text-base border-2 border-slate-200">
              6
            </div>
          </div>

          {/* Form Header */}
          <div className="mb-6 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
              Character References
            </h2>
            <p className="text-slate-500 text-sm sm:text-base">
              Please provide the following information.
            </p>
          </div>

            {/* References */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span className="w-1 h-6 bg-emerald-500 rounded-full"></span>
                Family / Relatives
              </h3>

              {references.map((reference, index) => (
                <div key={index} className="p-4 sm:p-6 border border-slate-200 rounded-xl space-y-4 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-slate-900">
                      Reference {index + 1}
                    </h4>
                    {references.length > 1 && (
                      <button
                        onClick={() => removeReference(index)}
                        className="text-red-600 hover:text-red-700 text-sm font-semibold bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Full name
                    </label>
                    <input
                      type="text"
                      value={reference.fullName}
                      onChange={(e) => updateReference(index, 'fullName', e.target.value)}
                      onPaste={handlePaste}
                      onCopy={handleCopy}
                      placeholder="Full name"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-slate-900 transition-all font-medium"
                    />
                  </div>

                  {/* Relationship and Phone Number */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Relationship
                      </label>
                      <input
                        type="text"
                        value={reference.relationship}
                        onChange={(e) => updateReference(index, 'relationship', e.target.value)}
                        onPaste={handlePaste}
                        onCopy={handleCopy}
                        placeholder="Relationship"
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-slate-900 transition-all font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={reference.phoneNumber}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Only allow numbers, max 11 digits
                          if (/^[0-9]*$/.test(value) && value.length <= 11) {
                            updateReference(index, 'phoneNumber', value);
                          }
                        }}
                        onPaste={handlePaste}
                        onCopy={handleCopy}
                        placeholder="03XXXXXXXXX"
                        maxLength={11}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-slate-900 transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Reference Button */}
              {references.length < 3 && (
                <button
                  onClick={addReference}
                  className="w-full px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl text-emerald-600 hover:border-emerald-500 hover:bg-emerald-50 transition-colors font-bold flex items-center justify-center gap-2"
                >
                  <span className="text-xl leading-none">+</span> Add Another Reference
                </button>
              )}

              {/* Errors */}
              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <ul className="space-y-1">
                    {errors.map((error, index) => (
                      <li key={index} className="text-sm text-red-600 font-medium flex items-center gap-2">
                        <span>⚠️</span> {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-8 pt-6 border-t border-slate-100">
              <button
                onClick={onBack}
                className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-bold"
              >
                Back
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

export default Step2;