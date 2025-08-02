'use client';

import { useState, useEffect } from 'react';
import { FaUpload, FaFileAlt } from 'react-icons/fa';

interface ImportExportJob {
  id: string;
  type: 'import' | 'export';
  fileName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  totalItems?: number;
  processedItems?: number;
  error?: string;
  createdAt: string;
}

export default function ImportExportPage() {
  const [jobs, setJobs] = useState<ImportExportJob[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/import-export');
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/api/import-export', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setSelectedFile(null);
        fetchJobs();
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'processing':
        return 'text-blue-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'processing':
        return '⟳';
      case 'failed':
        return '✗';
      default:
        return '⏳';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Import/Export</h1>
        <p className="text-gray-600">Manage product imports and exports</p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Import Products</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Excel File
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaUpload />
            {isUploading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>
      </div>

      {/* Jobs List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Import/Export Jobs</h2>
        <div className="space-y-4">
          {jobs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No jobs found</p>
          ) : (
            jobs.map((job) => (
              <div
                key={job.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <FaFileAlt className="text-gray-400" />
                    <div>
                      <h3 className="font-medium">{job.fileName}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(job.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-medium ${getStatusColor(job.status)}`}
                    >
                      {getStatusIcon(job.status)} {job.status}
                    </span>
                  </div>
                </div>
                
                {job.status === 'processing' && (
                  <div className="mt-3">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{job.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${job.progress}%` }}
                      ></div>
                    </div>
                    {job.totalItems && job.processedItems && (
                      <p className="text-xs text-gray-500 mt-1">
                        {job.processedItems} of {job.totalItems} items processed
                      </p>
                    )}
                  </div>
                )}

                {job.error && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{job.error}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 