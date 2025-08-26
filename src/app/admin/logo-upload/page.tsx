'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../components/AuthProvider';

export default function LogoUploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();

  // Redirect if not admin
  if (!isAuthenticated || !isAdmin) {
    router.push('/login');
    return null;
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        setMessage({ type: 'error', text: 'Invalid file type. Only JPEG, PNG, and SVG files are allowed.' });
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setMessage({ type: 'error', text: 'File size too large. Maximum size is 5MB.' });
        return;
      }

      setSelectedFile(file);
      setMessage(null);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Please select a file first.' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('logo', selectedFile);

      const response = await fetch('/api/admin/upload-logo', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

             if (response.ok) {
         setMessage({ type: 'success', text: data.message || 'Logo uploaded successfully!' });
         
         // Store the logo data URL in localStorage for temporary use
         if (data.dataUrl) {
           localStorage.setItem('siteLogo', data.dataUrl);
           localStorage.setItem('siteLogoFileName', data.fileName || 'logo.png');
         }
         
         setSelectedFile(null);
         setPreviewUrl(null);
         if (fileInputRef.current) {
           fileInputRef.current.value = '';
         }
       } else {
         setMessage({ type: 'error', text: data.error || 'Upload failed.' });
       }
    } catch (error) {
      setMessage({ type: 'error', text: 'Upload failed. Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const event = { target: { files: [file] } } as any;
      handleFileSelect(event);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Upload Logo</h1>
          
          {/* File Upload Area */}
          <div className="mb-8">
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-700 mb-2">
                Click to upload or drag and drop
              </p>
              <p className="text-sm text-gray-500">
                PNG, JPG, JPEG, SVG up to 5MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/svg+xml"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* Preview */}
          {previewUrl && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview:</h3>
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <img
                  src={previewUrl}
                  alt="Logo preview"
                  className="max-w-full max-h-64 mx-auto object-contain"
                />
                <p className="text-sm text-gray-600 mt-2 text-center">
                  {selectedFile?.name} ({(selectedFile?.size ? (selectedFile.size / 1024 / 1024).toFixed(2) : '0.00')} MB)
                </p>
              </div>
            </div>
          )}

          {/* Upload Button */}
          <div className="flex justify-center">
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg transition disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Upload Logo'}
            </button>
          </div>

          {/* Message */}
          {message && (
            <div className={`mt-6 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 p-6 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Instructions:</h3>
            <ul className="text-blue-800 space-y-2">
              <li>• Upload your company logo in PNG, JPG, JPEG, or SVG format</li>
              <li>• Maximum file size: 5MB</li>
              <li>• Recommended dimensions: 200x200 pixels or larger</li>
              <li>• The logo will be displayed in the header of your website</li>
              <li>• For best results, use a transparent background (PNG/SVG)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
