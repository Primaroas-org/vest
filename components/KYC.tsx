import React, { useState, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ViewState } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Modal } from './Modal';

interface KYCProps {
  onNavigate: (view: ViewState) => void;
}

export const KYCEntry: React.FC<KYCProps> = ({ onNavigate }) => {
  const { dict } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleStartVerification = () => {
    navigate('/kyc/rd-number');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark py-20 px-4 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-full hero-gradient opacity-10 pointer-events-none"></div>
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>

      <div className="bg-white dark:bg-charcoal p-8 md:p-12 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-lg relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex bg-primary p-3 rounded-xl mb-6 shadow-lg shadow-primary/20">
            <span className="material-icons-round text-white text-3xl">verified_user</span>
          </div>
          <h2 className="text-3xl font-extrabold text-charcoal dark:text-white font-display mb-2">
            {dict.kyc.title}
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            {dict.kyc.subtitle}
          </p>
        </div>

        {/* Visual Element */}
        <div className="w-full h-48 bg-gradient-to-br from-primary to-emerald-600 rounded-xl mb-8 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"></div>
          <span className="material-icons-round text-white text-7xl opacity-80 relative z-10">verified_user</span>
        </div>

        {/* Requirements Section */}
        <div className="mb-8">
          <h3 className="text-charcoal dark:text-white text-xl font-bold mb-6">
            {dict.kyc.requirementsTitle}
          </h3>
          
          {/* Checklist */}
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary">
                <span className="material-icons-round font-bold">check</span>
              </div>
              <p className="text-charcoal dark:text-white/90 text-base font-medium">
                {dict.kyc.requirement1}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary">
                <span className="material-icons-round font-bold">check</span>
              </div>
              <p className="text-charcoal dark:text-white/90 text-base font-medium">
                {dict.kyc.requirement2}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary">
                <span className="material-icons-round font-bold">check</span>
              </div>
              <p className="text-charcoal dark:text-white/90 text-base font-medium">
                {dict.kyc.requirement3}
              </p>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={handleStartVerification}
          className="w-full bg-primary hover:bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/25 transition-all active:scale-95 flex items-center justify-center gap-2">
          <span>{dict.kyc.startButton}</span>
          <span className="material-icons-round">arrow_forward</span>
        </button>

        {/* Trust Note */}
        <div className="mt-6 flex items-center justify-center gap-2 text-gray-400 dark:text-gray-500 text-xs">
          <span className="material-icons-round text-base">lock</span>
          <span>{dict.kyc.trustNote}</span>
        </div>

        {/* Footer Compliance Note */}
        <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {dict.kyc.complianceNote}
          </p>
        </div>
      </div>
    </div>
  );
};

export const KYCRDNumber: React.FC<KYCProps> = ({ onNavigate }) => {
  const { dict } = useLanguage();
  const navigate = useNavigate();
  const [letters, setLetters] = useState('');
  const [digits, setDigits] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLettersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^А-ЯЁ]/gi, '').toUpperCase().slice(0, 2);
    setLetters(value);
    setError(null);
  };

  const handleDigitsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 8);
    setDigits(value);
    setError(null);
  };

  const handleContinue = () => {
    if (letters.length !== 2) {
      setError(dict.kyc.rdLettersRequired || 'Please enter 2 Cyrillic letters');
      return;
    }
    if (digits.length !== 8) {
      setError(dict.kyc.rdDigitsRequired || 'Please enter 8 digits');
      return;
    }
    // Store RD number in sessionStorage for submission
    const rdNumber = `${letters}${digits}`;
    sessionStorage.setItem('kyc_rd_number', rdNumber);
    // Navigate to document upload (step 3)
    navigate('/kyc/verify');
  };

  const canContinue = letters.length === 2 && digits.length === 8;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark py-20 px-4 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-full hero-gradient opacity-10 pointer-events-none"></div>
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>

      <div className="bg-white dark:bg-charcoal rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-2xl relative z-10">
        {/* Progress Bar */}
        <div className="flex flex-col gap-3 p-8 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex gap-6 justify-between items-center">
            <p className="text-charcoal dark:text-white text-base font-semibold leading-normal">
              {dict.kyc.identityVerification || 'Identity Verification'}
            </p>
            <p className="text-primary dark:text-primary text-sm font-medium leading-normal">
              {dict.kyc.step1of4 || 'Step 1 of 4'}
            </p>
          </div>
          <div className="rounded bg-gray-200 dark:bg-gray-700 overflow-hidden h-2.5">
            <div className="h-full rounded bg-primary transition-all" style={{ width: '25%' }}></div>
          </div>
        </div>

        <div className="p-8 md:p-10 flex flex-col gap-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-2 text-primary">
              <span className="material-icons-round text-[28px]">badge</span>
            </div>
            <h2 className="text-3xl font-extrabold text-charcoal dark:text-white font-display tracking-tight">
              {dict.kyc.enterRDNumber || 'Enter your RD Number'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed max-w-md mx-auto">
              {dict.kyc.rdNumberDescription || 'Your Registration Number (RD) is a 10-character unique identifier for Mongolian citizens. Please ensure it matches your ID card exactly.'}
            </p>
          </div>

          {/* Input Section */}
          <div className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Split Input Field */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Letters Input */}
              <div className="flex-1 sm:max-w-[140px]">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  {dict.kyc.rdLetters || 'Letters (Cyrillic)'}
                </label>
                <div className="relative group">
                  <input
                    value={letters}
                    onChange={handleLettersChange}
                    className="w-full h-14 px-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-lg font-bold text-charcoal dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all uppercase text-center tracking-widest"
                    maxLength={2}
                    placeholder="АА"
                    type="text"
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
                    <span className="text-xs font-medium bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600">
                      А-Я
                    </span>
                  </div>
                </div>
              </div>

              {/* Digits Input */}
              <div className="flex-1">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  {dict.kyc.rdDigits || 'Digits'}
                </label>
                <div className="relative group">
                  <input
                    value={digits}
                    onChange={handleDigitsChange}
                    className="w-full h-14 px-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-lg font-bold text-charcoal dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all tracking-[0.15em]"
                    inputMode="numeric"
                    maxLength={8}
                    placeholder="00000000"
                    type="text"
                  />
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
                    <span className="material-icons-round text-[20px]">123</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Regulatory Info */}
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4 flex gap-3 items-start">
              <span className="material-icons-round text-blue-600 dark:text-blue-400 text-[20px] mt-0.5">info</span>
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-bold mb-1">
                  {dict.kyc.whyWeNeedThis || 'Why we need this?'}
                </p>
                <p className="text-blue-700/80 dark:text-blue-300/70 text-xs">
                  {dict.kyc.regulatoryCompliance || 'Regulatory compliance requires us to verify the identity of all investors on the platform.'}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex flex-col gap-4">
            <button
              onClick={handleContinue}
              disabled={!canContinue}
              className={`w-full h-14 rounded-xl font-bold text-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                canContinue
                  ? 'bg-primary hover:bg-emerald-600 text-white shadow-lg shadow-primary/25'
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-80'
              }`}>
              <span>{dict.kyc.continue || 'Continue'}</span>
              <span className="material-icons-round">arrow_forward</span>
            </button>
            <button
              onClick={() => navigate('/kyc')}
              className="w-full py-3 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white font-medium text-sm transition-colors">
              {dict.kyc.goBack || 'Go back to previous step'}
            </button>
          </div>
        </div>

        {/* Footer of Card */}
        <div className="bg-gray-50 dark:bg-gray-800/30 px-8 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-center gap-2 text-gray-400 dark:text-gray-500">
          <span className="material-icons-round text-[16px]">lock</span>
          <span className="text-xs">
            {dict.kyc.dataEncryptedNote || 'Your data is encrypted and securely stored.'}
          </span>
        </div>
      </div>
    </div>
  );
};

export const KYCDocumentUpload: React.FC<KYCProps> = ({ onNavigate }) => {
  const { dict } = useLanguage();
  const navigate = useNavigate();
  const [documentType, setDocumentType] = useState('mn_id');
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File, type: 'front' | 'back') => {
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage(dict.kyc.fileTooLarge || 'File size must be less than 5MB');
      setShowErrorModal(true);
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage(dict.kyc.invalidFileType || 'Please upload JPEG, PNG or PDF files only');
      setShowErrorModal(true);
      return;
    }

    // Convert file to base64 for storage
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      
      if (type === 'front') {
        setFrontFile(file);
        sessionStorage.setItem('kyc_front_document', base64);
        if (file.type.startsWith('image/')) {
          setFrontPreview(base64);
        } else {
          setFrontPreview(null);
        }
      } else {
        setBackFile(file);
        sessionStorage.setItem('kyc_back_document', base64);
        if (file.type.startsWith('image/')) {
          setBackPreview(base64);
        } else {
          setBackPreview(null);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent, type: 'front' | 'back') => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file, type);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleContinue = () => {
    if (!frontFile || !backFile) {
      setErrorMessage(dict.kyc.uploadBothSides || 'Please upload both front and back of your ID');
      setShowErrorModal(true);
      return;
    }
    // Store document type
    sessionStorage.setItem('kyc_document_type', documentType);
    // Navigate to next step (selfie verification - step 4)
    navigate('/kyc/selfie');
  };

  const canContinue = frontFile !== null && backFile !== null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark py-20 px-4 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-full hero-gradient opacity-10 pointer-events-none"></div>
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>

      <div className="bg-white dark:bg-charcoal rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-3xl relative z-10">
        {/* Progress Bar */}
        <div className="flex flex-col gap-3 p-8 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex gap-6 justify-between items-center">
            <p className="text-charcoal dark:text-white text-base font-semibold leading-normal">
              {dict.kyc.identityVerification || 'Identity Verification'}
            </p>
            <p className="text-primary dark:text-primary text-sm font-medium leading-normal">
              {dict.kyc.step3of4 || 'Step 3 of 4'}
            </p>
          </div>
          <div className="rounded bg-gray-200 dark:bg-gray-700 overflow-hidden h-2.5">
            <div className="h-full rounded bg-primary transition-all" style={{ width: '75%' }}></div>
          </div>
        </div>

        {/* Header */}
        <div className="px-8 pt-8 pb-4 text-center">
          <h2 className="text-3xl font-extrabold text-charcoal dark:text-white font-display mb-2">
            {dict.kyc.verifyIdentity || 'Verify Your Identity'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            {dict.kyc.uploadDescription || 'Please upload a clear photo of your government-issued ID for security compliance and investment eligibility.'}
          </p>
        </div>

        {/* Document Type Selection */}
        <div className="px-8 py-6">
          <div className="flex flex-col gap-2 max-w-[400px] mx-auto">
            <label className="text-charcoal dark:text-white text-sm font-bold">
              {dict.kyc.selectDocumentType || 'Select Document Type'}
            </label>
            <div className="relative">
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="appearance-none flex w-full rounded-xl text-charcoal dark:text-white border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 h-12 px-4 text-base focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all">
                <option value="mn_id">{dict.kyc.mongolianID || 'Mongolian National ID (Smart Card)'}</option>
                <option value="passport">{dict.kyc.passport || 'International Passport'}</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                <span className="material-icons-round">expand_more</span>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Zones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-8 pb-8">
          {/* Front of ID */}
          <div className="flex flex-col gap-3">
            <p className="text-charcoal dark:text-white text-sm font-bold">
              {dict.kyc.frontOfID || 'Front of ID'}
            </p>
            <input
              ref={frontInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg,application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file, 'front');
              }}
              className="hidden"
            />
            <div
              onClick={() => frontInputRef.current?.click()}
              onDrop={(e) => handleDrop(e, 'front')}
              onDragOver={handleDragOver}
              className={`group relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 bg-gray-50 dark:bg-gray-800/30 hover:border-primary dark:hover:border-primary hover:bg-primary/5 transition-all cursor-pointer h-48 text-center ${
                frontFile ? 'border-primary bg-primary/10' : 'border-gray-200 dark:border-gray-700'
              }`}>
              {frontPreview ? (
                <img src={frontPreview} alt="Front preview" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
              ) : (
                <>
                  <span className="material-icons-round text-primary text-4xl mb-3">badge</span>
                  <p className="text-sm font-medium text-charcoal dark:text-white">
                    {dict.kyc.clickToUpload || 'Click to upload or drag & drop'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {dict.kyc.fileFormats || 'JPEG, PNG or PDF (Max 5MB)'}
                  </p>
                </>
              )}
            </div>
            {frontFile && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {frontFile.name}
              </p>
            )}
          </div>

          {/* Back of ID */}
          <div className="flex flex-col gap-3">
            <p className="text-charcoal dark:text-white text-sm font-bold">
              {dict.kyc.backOfID || 'Back of ID'}
            </p>
            <input
              ref={backInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg,application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file, 'back');
              }}
              className="hidden"
            />
            <div
              onClick={() => backInputRef.current?.click()}
              onDrop={(e) => handleDrop(e, 'back')}
              onDragOver={handleDragOver}
              className={`group relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 bg-gray-50 dark:bg-gray-800/30 hover:border-primary dark:hover:border-primary hover:bg-primary/5 transition-all cursor-pointer h-48 text-center ${
                backFile ? 'border-primary bg-primary/10' : 'border-gray-200 dark:border-gray-700'
              }`}>
              {backPreview ? (
                <img src={backPreview} alt="Back preview" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
              ) : (
                <>
                  <span className="material-icons-round text-primary text-4xl mb-3">add_photo_alternate</span>
                  <p className="text-sm font-medium text-charcoal dark:text-white">
                    {dict.kyc.clickToUpload || 'Click to upload or drag & drop'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {dict.kyc.fileFormats || 'JPEG, PNG or PDF (Max 5MB)'}
                  </p>
                </>
              )}
            </div>
            {backFile && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {backFile.name}
              </p>
            )}
          </div>
        </div>

        {/* Guidelines */}
        <div className="px-8 pb-6">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 flex gap-4 items-start">
            <span className="material-icons-round text-primary mt-0.5">info</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-charcoal dark:text-white">
                {dict.kyc.photoGuidelines || 'Photo Guidelines'}
              </p>
              <ul className="text-xs text-gray-600 dark:text-gray-400 list-disc list-inside mt-2 space-y-1">
                <li>{dict.kyc.guideline1 || 'Ensure all four corners are visible in the frame'}</li>
                <li>{dict.kyc.guideline2 || 'Avoid glares or shadows on the document'}</li>
                <li>{dict.kyc.guideline3 || 'Information must be clearly legible'}</li>
                <li>{dict.kyc.guideline4 || 'The document must be valid and not expired'}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-100 dark:border-gray-800 p-8 bg-gray-50 dark:bg-gray-800/30">
          <div className="flex flex-col gap-6">
            {/* Continue Button */}
            <button
              onClick={handleContinue}
              disabled={!canContinue}
              className={`w-full flex items-center justify-center h-14 rounded-xl font-bold text-lg transition-all active:scale-95 ${
                canContinue
                  ? 'bg-primary hover:bg-emerald-600 text-white shadow-lg shadow-primary/25'
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-80'
              }`}>
              {dict.kyc.continue || 'Continue'}
            </button>

            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-8 flex-wrap">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <span className="material-icons-round text-sm">lock</span>
                <span className="text-[10px] uppercase font-bold tracking-widest">
                  {dict.kyc.sslSecured || 'SSL Secured'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <span className="material-icons-round text-sm">verified_user</span>
                <span className="text-[10px] uppercase font-bold tracking-widest">
                  {dict.kyc.govCompliant || 'Gov Compliant'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <span className="material-icons-round text-sm">shield</span>
                <span className="text-[10px] uppercase font-bold tracking-widest">
                  {dict.kyc.dataEncrypted || 'Data Encrypted'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Assistance Link */}
        <div className="px-8 pb-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {dict.kyc.havingTrouble || 'Having trouble?'}{' '}
            <button
              onClick={() => onNavigate('contact')}
              className="text-primary font-bold hover:underline">
              {dict.kyc.contactSupport || 'Contact Support'}
            </button>
          </p>
        </div>
      </div>

      {/* Error Modal */}
      <Modal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title={dict.kyc.errorTitle || 'Error'}
        message={errorMessage}
        confirmText={dict.kyc.modalConfirm || 'OK'}
        type="alert"
      />
    </div>
  );
};

export const KYCSelfie: React.FC<KYCProps> = ({ onNavigate }) => {
  const { dict } = useLanguage();
  const navigate = useNavigate();
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup camera stream on unmount
  React.useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleFileSelect = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage(dict.kyc.fileTooLarge || 'File size must be less than 5MB');
      setShowErrorModal(true);
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage(dict.kyc.invalidFileType || 'Please upload JPEG or PNG files only');
      setShowErrorModal(true);
      return;
    }

    setSelfieFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setSelfiePreview(base64);
      // Store in sessionStorage for submission
      sessionStorage.setItem('kyc_selfie', base64);
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setErrorMessage(dict.kyc.cameraError || 'Unable to access camera. Please upload a photo instead.');
      setShowErrorModal(true);
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
            setSelfieFile(file);
            // Convert to base64 and store
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64 = reader.result as string;
              setSelfiePreview(base64);
              sessionStorage.setItem('kyc_selfie', base64);
            };
            reader.readAsDataURL(file);
            stopCamera();
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const handleContinue = async () => {
    if (!selfieFile) {
      setErrorMessage(dict.kyc.selfieRequired || 'Please take or upload a selfie');
      setShowErrorModal(true);
      return;
    }

    setIsSubmitting(true);

    // Get all KYC data from sessionStorage
    const rdNumber = sessionStorage.getItem('kyc_rd_number');
    const documentType = sessionStorage.getItem('kyc_document_type');
    const frontDocument = sessionStorage.getItem('kyc_front_document');
    const backDocument = sessionStorage.getItem('kyc_back_document');
    const selfieBase64 = sessionStorage.getItem('kyc_selfie');

    if (!rdNumber || !documentType || !frontDocument || !backDocument || !selfieBase64) {
      setErrorMessage(dict.kyc.missingData || 'Missing KYC data. Please start over.');
      setShowErrorModal(true);
      setIsSubmitting(false);
      return;
    }

    // Submit KYC data to backend
    try {
      const token = localStorage.getItem('supabase.auth.token');
      if (!token) {
        setErrorMessage('Authentication required. Please log in again.');
        setShowErrorModal(true);
        return;
      }

      const response = await fetch('/api/kyc/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rd_number: rdNumber,
          document_type: documentType,
          front_document: frontDocument,
          back_document: backDocument,
          selfie: selfieBase64
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || 'Failed to submit KYC documents');
        setShowErrorModal(true);
        return;
      }

      // Clear sessionStorage
      sessionStorage.removeItem('kyc_rd_number');
      sessionStorage.removeItem('kyc_document_type');
      sessionStorage.removeItem('kyc_front_document');
      sessionStorage.removeItem('kyc_back_document');
      sessionStorage.removeItem('kyc_selfie');

      // Navigate to success screen
      navigate('/kyc/complete');
    } catch (error) {
      console.error('KYC submission error:', error);
      setErrorMessage('An error occurred. Please try again.');
      setShowErrorModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark py-20 px-4 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-full hero-gradient opacity-10 pointer-events-none"></div>
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>

      <div className="bg-white dark:bg-charcoal rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-2xl relative z-10">
        {/* Progress Bar */}
        <div className="flex flex-col gap-3 p-8 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex gap-6 justify-between items-center">
            <p className="text-charcoal dark:text-white text-base font-semibold leading-normal">
              {dict.kyc.identityVerification || 'Identity Verification'}
            </p>
            <p className="text-primary dark:text-primary text-sm font-medium leading-normal">
              {dict.kyc.step4of4 || 'Step 4 of 4'}
            </p>
          </div>
          <div className="rounded bg-gray-200 dark:bg-gray-700 overflow-hidden h-2.5">
            <div className="h-full rounded bg-primary transition-all" style={{ width: '100%' }}></div>
          </div>
        </div>

        {/* Header Visual */}
        <div className="p-8 pb-0">
          <div className="relative w-full aspect-video bg-gray-50 dark:bg-gray-800/30 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 overflow-hidden">
            {selfiePreview ? (
              <img src={selfiePreview} alt="Selfie preview" className="absolute inset-0 w-full h-full object-cover rounded-xl" />
            ) : isCapturing ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover rounded-xl"
                />
                <canvas ref={canvasRef} className="hidden" />
                {/* Guide Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border-4 border-primary/40 rounded-full flex items-center justify-center relative">
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-primary rounded-full"></div>
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 right-4 text-center">
                  <p className="text-xs font-medium uppercase tracking-widest text-white/80 bg-black/50 px-3 py-1 rounded-full">
                    {dict.kyc.visualGuide || 'Visual Verification Guide'}
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* Guide Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="w-48 h-48 border-4 border-primary/40 rounded-full flex items-center justify-center relative">
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-primary rounded-full"></div>
                    <span className="material-icons-round text-6xl text-gray-300 dark:text-gray-600">face</span>
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 right-4 text-center">
                  <p className="text-xs font-medium uppercase tracking-widest text-gray-400 dark:text-gray-500">
                    {dict.kyc.visualGuide || 'Visual Verification Guide'}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Header Text */}
        <div className="px-8 pt-8">
          <h2 className="text-3xl font-extrabold text-charcoal dark:text-white font-display text-center tracking-tight">
            {dict.kyc.quickSelfie || 'Quick Selfie Verification'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed pt-3 text-center max-w-sm mx-auto">
            {dict.kyc.selfieDescription || 'Please ensure your face is clearly visible and within the frame. Avoid wearing hats or sunglasses.'}
          </p>
        </div>

        {/* Checklist */}
        <div className="px-12 py-8 space-y-4">
          <div className="flex items-center gap-x-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex-shrink-0 size-6 bg-primary/20 text-primary rounded-full flex items-center justify-center">
              <span className="material-icons-round text-lg font-bold">check</span>
            </div>
            <p className="text-charcoal dark:text-white text-base font-medium">
              {dict.kyc.goodLighting || 'Good lighting'}
            </p>
          </div>
          <div className="flex items-center gap-x-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex-shrink-0 size-6 bg-primary/20 text-primary rounded-full flex items-center justify-center">
              <span className="material-icons-round text-lg font-bold">check</span>
            </div>
            <p className="text-charcoal dark:text-white text-base font-medium">
              {dict.kyc.neutralExpression || 'Neutral expression'}
            </p>
          </div>
          <div className="flex items-center gap-x-4 py-3">
            <div className="flex-shrink-0 size-6 bg-primary/20 text-primary rounded-full flex items-center justify-center">
              <span className="material-icons-round text-lg font-bold">check</span>
            </div>
            <p className="text-charcoal dark:text-white text-base font-medium">
              {dict.kyc.faceInFrame || 'Face in frame'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-8 pb-10">
          {!selfiePreview ? (
            <>
              {!isCapturing ? (
                <>
                  <button
                    onClick={startCamera}
                    className="w-full bg-primary hover:bg-emerald-600 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-primary/25">
                    <span className="material-icons-round">photo_camera</span>
                    {dict.kyc.takeSelfie || 'Take Selfie'}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full mt-4 text-gray-500 dark:text-gray-400 hover:text-charcoal dark:hover:text-white text-sm font-bold transition-colors">
                    {dict.kyc.uploadPhoto || 'Upload Photo Instead'}
                  </button>
                </>
              ) : (
                <button
                  onClick={capturePhoto}
                  className="w-full bg-primary hover:bg-emerald-600 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-primary/25">
                  <span className="material-icons-round">camera</span>
                  {dict.kyc.capture || 'Capture Photo'}
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={handleContinue}
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-primary/25">
                {isSubmitting ? (
                  <>
                    <span className="material-icons-round animate-spin">refresh</span>
                    <span>{dict.kyc.submitting || 'Submitting...'}</span>
                  </>
                ) : (
                  <>
                    <span>{dict.kyc.continue || 'Continue'}</span>
                    <span className="material-icons-round">arrow_forward</span>
                  </>
                )}
              </button>
              <div className="flex gap-4 mt-4">
                <button
                  onClick={() => {
                    setSelfiePreview(null);
                    setSelfieFile(null);
                  }}
                  className="flex-1 text-gray-500 dark:text-gray-400 hover:text-charcoal dark:hover:text-white text-sm font-bold transition-colors">
                  {dict.kyc.retake || 'Retake'}
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 text-gray-500 dark:text-gray-400 hover:text-charcoal dark:hover:text-white text-sm font-bold transition-colors">
                  {dict.kyc.uploadDifferent || 'Upload Different'}
                </button>
              </div>
            </>
          )}
          <button
            onClick={() => onNavigate('contact')}
            className="w-full mt-4 text-gray-500 dark:text-gray-400 hover:text-charcoal dark:hover:text-white text-sm font-bold transition-colors">
            {dict.kyc.needHelp || 'Need help with verification?'}
          </button>
        </div>

        {/* Footer Context */}
        <div className="px-8 pb-8 flex items-center justify-center gap-2 text-gray-400 dark:text-gray-500">
          <span className="material-icons-round text-sm">lock</span>
          <span className="text-xs font-medium">
            {dict.kyc.encryptedCompliant || 'End-to-end encrypted • Regulatory compliant in Mongolia'}
          </span>
        </div>
      </div>

      {/* Error Modal */}
      <Modal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title={dict.kyc.errorTitle || 'Error'}
        message={errorMessage}
        confirmText={dict.kyc.modalConfirm || 'OK'}
        type="alert"
      />
    </div>
  );
};

export const KYCComplete: React.FC<KYCProps> = ({ onNavigate }) => {
  const { dict } = useLanguage();
  const { user } = useAuth();

  // Refresh user data to get updated KYC status
  React.useEffect(() => {
    // Trigger a page reload after a short delay to refresh user data
    const timer = setTimeout(() => {
      window.location.reload();
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark py-20 px-4 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-full hero-gradient opacity-10 pointer-events-none"></div>
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>

      <div className="bg-white dark:bg-charcoal rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-xl relative z-10 overflow-hidden">
        {/* Decorative Top Gradient Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40"></div>

        <div className="p-8 md:p-12">
          {/* Success Icon */}
          <div className="flex justify-center mb-8">
            <div className="size-24 rounded-full bg-gradient-to-b from-primary/10 to-transparent flex items-center justify-center ring-1 ring-primary/20">
              <div className="size-16 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                <span className="material-icons-round text-white text-[40px] font-bold">check</span>
              </div>
            </div>
          </div>

          {/* Text Content */}
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-charcoal dark:text-white font-display tracking-tight mb-3">
              {dict.kyc.identityVerified || 'Identity Verified Successfully'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed max-w-md mx-auto">
              {dict.kyc.verificationSuccessMessage || 'Your account is now secure and you are ready to start investing in Mongolian real estate.'}
            </p>
          </div>

          {/* Status Summary Tile */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-4 mb-10">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {dict.kyc.accountStatus || 'Account Status'}
              </span>
              <div className="flex items-center gap-2">
                <span className="material-icons-round text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified_user
                </span>
                <span className="text-xl font-bold text-charcoal dark:text-white">
                  {dict.kyc.verified || 'Verified'}
                </span>
              </div>
            </div>
            <div className="hidden sm:block h-10 w-px bg-gray-200 dark:border-gray-700"></div>
            <div className="flex flex-col gap-1 items-start sm:items-end">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {dict.kyc.securityLevel || 'Security Level'}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-primary text-sm font-bold">
                  {dict.kyc.high || 'High'}
                </span>
                <span className="material-icons-round text-primary text-[16px]">lock</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-4">
            <button
              onClick={() => onNavigate('marketplace')}
              className="group relative w-full h-14 bg-primary hover:bg-emerald-600 rounded-xl text-white font-bold text-lg shadow-lg shadow-primary/25 transition-all active:scale-95 flex items-center justify-center gap-2 overflow-hidden">
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <span className="relative z-10">{dict.kyc.exploreProperties || 'Explore Properties'}</span>
              <span className="material-icons-round relative z-10 group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
            <button
              onClick={() => onNavigate('dashboard')}
              className="text-center text-sm font-bold text-gray-500 hover:text-charcoal dark:text-gray-400 dark:hover:text-white transition-colors py-2">
              {dict.kyc.goToDashboard || 'Go to Dashboard'}
            </button>
          </div>
        </div>

        {/* Footer Context */}
        <div className="px-8 pb-8 flex items-center justify-center gap-2 text-gray-400 dark:text-gray-500">
          <span className="material-icons-round text-sm">lock</span>
          <span className="text-xs font-medium">
            {dict.kyc.encryptedCompliant || 'End-to-end encrypted • Regulatory compliant in Mongolia'}
          </span>
        </div>
      </div>
    </div>
  );
};
