'use client'
import React, { useState, useEffect } from 'react';
import { validatePakistaniNIC } from '../../lib/pakistani-validators';
import { useActivation, Step4Data } from '../../contexts/ActivationContext';
import FileUpload from '../ui/FileUpload';
import NICFrontSide from '/public/nic_frontside.jpg';
import NICBackSide from '/public/images/nic_backside.jpg';
import SelfieWithNIC from '/public/selfie_with_cnic.webp';
import ElectricityBill from '/public/images/electricity-bill.png';
import DriverLicense from '/public/driver_lience.jpg';

interface Step4Props {
  onNext: (data: Step4Data) => void;
  onBack: () => void;
  onClose: () => void;
}

const Step4: React.FC<Step4Props> = ({ onNext, onBack, onClose }) => {
  const { getStepData, updateStepData } = useActivation();
  const [formData, setFormData] = useState<Step4Data>({
    idType: 'NIC',
    idNumber: '',
    frontImage: null,
    backImage: null,
    selfieImage: null,
    passportPhoto: null,
    driverLicensePhoto: null,
    electricityBillPhoto: null
  });

  const [errors, setErrors] = useState<Partial<Record<keyof Step4Data, string>>>({});
  const [previews, setPreviews] = useState<{
    front?: string;
    back?: string;
    selfie?: string;
    electricityBill?: string;
    driverLicense?: string;
  }>({});

  // Load saved data on component mount
  useEffect(() => {
    const savedData = getStepData(4) as Step4Data;
    if (savedData) {
      setFormData({
        ...savedData,
        // Files can't be restored from localStorage, so keep them as null
        frontImage: null,
        backImage: null,
        selfieImage: null,
        passportPhoto: null,
        driverLicensePhoto: null,
        electricityBillPhoto: null
      });
    }
  }, [getStepData]);

  const handlePaste = (e: React.ClipboardEvent) => e.preventDefault();
  const handleCopy = (e: React.ClipboardEvent) => e.preventDefault();

  const formatCNIC = (value: string): string => {
    // Remove all non-numeric characters
    const numbers = value.replace(/\D/g, '');

    // Limit to 13 digits
    const limited = numbers.slice(0, 13);

    // Format as XXXXX-XXXXXXX-X
    if (limited.length <= 5) {
      return limited;
    } else if (limited.length <= 12) {
      return `${limited.slice(0, 5)}-${limited.slice(5)}`;
    } else {
      return `${limited.slice(0, 5)}-${limited.slice(5, 12)}-${limited.slice(12)}`;
    }
  };

  const handleFileSelect = (type: 'front' | 'back' | 'selfie' | 'passport' | 'driverLicense' | 'electricityBill', file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setErrors({ ...errors, [type + (type === 'passport' || type === 'driverLicense' || type === 'electricityBill' ? 'Photo' : 'Image')]: 'File size must be less than 10MB' });
      return;
    }
    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/gif'].includes(file.type)) {
      setErrors({ ...errors, [type + (type === 'passport' || type === 'driverLicense' || type === 'electricityBill' ? 'Photo' : 'Image')]: 'Only PNG, JPG, GIF files are allowed' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setPreviews({ ...previews, [type]: reader.result as string });
    reader.readAsDataURL(file);

    const fieldName = type === 'passport' ? 'passportPhoto' :
      type === 'electricityBill' ? 'electricityBillPhoto' :
        type === 'driverLicense' ? 'driverLicensePhoto' :
          type + 'Image';

    setFormData({ ...formData, [fieldName]: file });
    setErrors({ ...errors, [type + (type === 'passport' || type === 'driverLicense' || type === 'electricityBill' ? 'Photo' : 'Image')]: '' });
  };

  const handleFileRemove = (type: 'front' | 'back' | 'selfie' | 'passport' | 'driverLicense' | 'electricityBill') => {
    setPreviews({ ...previews, [type]: undefined });
    const fieldName = type === 'passport' ? 'passportPhoto' :
      type === 'driverLicense' ? 'driverLicensePhoto' :
        type === 'electricityBill' ? 'electricityBillPhoto' :
          type + 'Image';
    setFormData({ ...formData, [fieldName]: null });
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof Step4Data, string>> = {};

    if (!formData.idNumber.trim()) {
      newErrors.idNumber = 'NIC number is required';
    } else {
      const nicValidation = validatePakistaniNIC(formData.idNumber);
      if (!nicValidation.isValid) {
        newErrors.idNumber = nicValidation.error;
      }
    }

    // if (!formData.frontImage) newErrors.frontImage = 'Front NIC image is required';
    // if (!formData.backImage) newErrors.backImage = 'Back NIC image is required';
    // if (!formData.selfieImage) newErrors.selfieImage = 'Selfie image is required';
    // if (!formData.passportPhoto) newErrors.passportPhoto = 'Passport photo is required';
    // if (!formData.driverLicensePhoto) newErrors.driverLicensePhoto = 'Driver license photo is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      updateStepData(4, formData);
      onNext(formData);
    }
  };



  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="modal-card bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-100">
        <div className="p-6 sm:p-8">
          {/* Step Indicator - Same as Step 3 but with step 4 active */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-8">
            {/* Steps 1-3 completed */}
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-8 sm:w-10 aspect-square rounded-full bg-emerald-600 text-white flex items-center justify-center font-semibold text-sm sm:text-base cursor-pointer hover:bg-emerald-700 transition-colors">
                  ✓
                </div>
                {i < 3 && <div className="flex-1 h-0.5 bg-emerald-600"></div>}
              </div>
            ))}


            {/* Step 4 active */}
            <div className="w-8 sm:w-10 aspect-square rounded-full bg-emerald-600 text-white flex items-center justify-center font-semibold text-sm sm:text-base border-2 border-emerald-600 shadow-lg shadow-emerald-500/20">
              4
            </div>
            <div className="flex-1 h-0.5 bg-slate-200"></div>

            {/* Steps 5-6 pending */}
            {[5, 6].map(i => (
              <React.Fragment key={i}>
                <div className="w-8 sm:w-10 aspect-square rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-semibold text-sm sm:text-base border-2 border-slate-200">
                  {i}
                </div>
                {i < 6 && <div className="flex-1 h-0.5 bg-slate-200"></div>}
              </React.Fragment>
            ))}
          </div>


          <div className="mb-6 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Your ID</h2>
            <p className="text-slate-500 text-sm sm:text-base">Your data is secured and protected.</p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">ID Type:</label>
                <input
                  type="text"
                  value="NIC"
                  disabled
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">NIC Number:</label>
                <input
                  type="text"
                  value={formData.idNumber}
                  onChange={(e) => {
                    const formatted = formatCNIC(e.target.value);
                    setFormData({ ...formData, idNumber: formatted });
                  }}
                  onPaste={handlePaste}
                  onCopy={handleCopy}
                  placeholder="XXXXX-XXXXXXX-X"
                  maxLength={15}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-slate-900 transition-all font-medium"
                />
                {errors.idNumber && <p className="mt-1 text-sm text-red-600 font-medium flex items-center gap-1">⚠️ {errors.idNumber}</p>}
              </div>
            </div>

            <FileUpload
              label="Upload front NIC:"
              onFileSelect={(file) => handleFileSelect('front', file)}
              onFileRemove={() => handleFileRemove('front')}
              preview={previews.front}
              error={errors.frontImage}
              placeholderImage={NICFrontSide.src}
              required
            />

            <FileUpload
              label="Upload back NIC:"
              onFileSelect={(file) => handleFileSelect('back', file)}
              onFileRemove={() => handleFileRemove('back')}
              preview={previews.back}
              error={errors.backImage}
              placeholderImage={NICBackSide.src}
              required
            />

            <FileUpload
              label="Upload Selfie with NIC:"
              onFileSelect={(file) => handleFileSelect('selfie', file)}
              onFileRemove={() => handleFileRemove('selfie')}
              preview={previews.selfie}
              error={errors.selfieImage}
              placeholderImage={SelfieWithNIC.src}
              required
            />

            <FileUpload
              label="Upload Electricity Bill: (Optional)"
              onFileSelect={(file) => handleFileSelect('electricityBill', file)}
              onFileRemove={() => handleFileRemove('electricityBill')}
              preview={previews.electricityBill}
              error={errors.electricityBillPhoto}
              placeholderImage={ElectricityBill.src}

            />

            <FileUpload
              label="Upload Driver's License: (Optional)"
              onFileSelect={(file) => handleFileSelect('driverLicense', file)}
              onFileRemove={() => handleFileRemove('driverLicense')}
              preview={previews.driverLicense}
              error={errors.driverLicensePhoto}
              placeholderImage={DriverLicense.src}

            />
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

export default Step4;