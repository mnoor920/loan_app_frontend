'use client'
import { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { useActivation } from '../../contexts/ActivationContext';

interface Step6Props {
  onFinish: () => void;
  onBack: () => void;
  onClose: () => void;
}

const Step6: React.FC<Step6Props> = ({ onFinish, onBack, onClose }) => {
  const { updateStepData, clearData } = useActivation();
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [error, setError] = useState('');

  const clearSignature = () => {
    sigCanvas.current?.clear();
    setError('');
  };

  const handleFinish = () => {
    if (sigCanvas.current?.isEmpty()) {
      setError('Please provide your signature');
      return;
    }
    
    // Get signature data
    const signatureData = sigCanvas.current?.toDataURL();
    
    // Save signature data
    updateStepData(6, { signature: signatureData });
    
    // Clear all activation data after successful completion
    setTimeout(() => {
      clearData();
    }, 1000);
    
    onFinish();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="modal-card bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-100">
        <div className="p-6 sm:p-8">
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-8">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-semibold text-sm sm:text-base cursor-pointer hover:bg-emerald-700 transition-colors">✓</div>
                {i < 5 && <div className="w-8 sm:w-12 h-0.5 bg-emerald-600"></div>}
              </div>
            ))}

            <div className="w-8 aspect-square sm:w-10 sm:aspect-square shrink-0 rounded-full bg-emerald-600 text-white flex items-center justify-center font-semibold text-sm sm:text-base border-2 border-emerald-600 shadow-lg shadow-emerald-500/20">6</div>
          </div>

          <div className="mb-6 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Digital Signature</h2>
            <p className="text-slate-500 text-sm sm:text-base">Please sign below to complete your activation.</p>
          </div>

          <div className="space-y-4">
            {/* Signature Pad */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Your Signature</label>
              <div className="border-2 border-slate-300 rounded-xl overflow-hidden bg-white hover:border-emerald-500 transition-colors">
                <SignatureCanvas
                  ref={sigCanvas}
                  canvasProps={{
                    className: 'w-full h-64 cursor-crosshair',
                    style: { touchAction: 'none' }
                  }}
                  backgroundColor="rgb(255, 255, 255)"
                />
              </div>
              {error && <p className="mt-2 text-sm text-red-600 font-medium flex items-center gap-1">⚠️ {error}</p>}
            </div>

            {/* Clear Button */}
            <button onClick={clearSignature} className="w-full sm:w-auto px-6 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-bold text-sm">
              Clear Signature
            </button>

            {/* Terms */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-sm text-slate-600">
                By signing, you confirm that all information provided is accurate and you agree to the terms and conditions of the loan application process.
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-8 pt-6 border-t border-slate-100">
            <button onClick={onBack} className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-bold">Back</button>
            <button onClick={handleFinish} className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors font-bold shadow-lg shadow-emerald-600/20">Finish</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step6;