import React, { ChangeEvent } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '../ui/button';
import { FileUploaderProps } from './types';

const FileUploader: React.FC<FileUploaderProps> = ({
  label,
  fileType,
  refId,
  isUploading,
  onUpload,
  inputRef,
}) => {
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (fileType === 'PDF' && !file.type.includes('pdf')) {
      alert('Please upload a PDF file');
      return;
    }
    
    onUpload(file, refId);
  };

  return (
    <div>
      <input
        type="file"
        id={`file-upload-${refId}`}
        accept={fileType === 'PDF' ? 'application/pdf' : '*'}
        className="hidden"
        onChange={handleFileChange}
        ref={inputRef}
      />
      <Button
        variant="outline"
        className="flex items-center gap-2"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
      >
        <Upload className="w-4 h-4" />
        {isUploading ? 'Uploading...' : `Upload ${fileType || 'File'}`}
      </Button>
    </div>
  );
};

export default FileUploader;
