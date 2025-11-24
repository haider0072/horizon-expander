import React, { useCallback, useState } from 'react';

interface UploadZoneProps {
  onFileSelected: (file: File) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFileSelected }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      onFileSelected(files[0]);
    }
  }, [onFileSelected]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelected(e.target.files[0]);
    }
  }, [onFileSelected]);

  return (
    <div 
      className={`
        relative w-full max-w-md mx-auto h-96 border-2 border-dashed rounded-2xl 
        flex flex-col items-center justify-center text-center transition-all duration-300
        cursor-pointer overflow-hidden group
        ${isDragging 
          ? 'border-brand-500 bg-brand-900/20' 
          : 'border-white/10 hover:border-white/20 bg-dark-800/50 hover:bg-dark-800'}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById('fileInput')?.click()}
    >
      <input 
        type="file" 
        id="fileInput" 
        className="hidden" 
        accept="image/*"
        onChange={handleFileInput} 
      />
      
      <div className="absolute inset-0 bg-gradient-to-tr from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      <div className="p-8 space-y-4 z-10">
        <div className={`w-20 h-20 mx-auto rounded-full bg-dark-900 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-300 ${isDragging ? 'text-brand-500' : 'text-gray-400'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>
        
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">Upload Portrait Photo</h3>
          <p className="text-sm text-gray-400 max-w-[240px] mx-auto">
            Drag & drop a 3:4 portrait image here, or click to browse.
          </p>
        </div>

        <div className="pt-4">
            <span className="px-3 py-1 rounded-full bg-white/5 text-xs font-medium text-brand-100 border border-white/10">
                Supports JPG, PNG, WebP
            </span>
        </div>
      </div>
    </div>
  );
};
