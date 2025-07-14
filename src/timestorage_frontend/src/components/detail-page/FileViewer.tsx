import { useState, useCallback } from 'react'
import { FileText, Download, File, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { FileCacheItem } from './types'

interface FileViewerProps {
  file: FileCacheItem;
  onDownload: (file: FileCacheItem) => Promise<void>;
  isDownloading: boolean;
}

export function FileViewer({ file, onDownload, isDownloading }: FileViewerProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const isImage = file.mimeType?.startsWith('image/') || false
  const isPdf = file.mimeType === 'application/pdf'

  const handleImageLoad = useCallback(() => {
    setIsImageLoaded(true)
    setImageError(false)
  }, [])

  const handleImageError = useCallback(() => {
    setImageError(true)
    setIsImageLoaded(false)
  }, [])

  const getFileIcon = () => {
    if (isPdf) return <FileText className="w-12 h-12 text-error" />
    if (isImage) return <ImageIcon className="w-12 h-12 text-primary" />
    return <File className="w-12 h-12 text-neutral" />
  }

  return (
    <div className="card bg-base-100 shadow-xl mb-4">
      <div className="card-body">
        <div className="flex flex-col items-center justify-center p-4">
          {isImage && file.content ? (
            <div className="relative w-full max-w-md">
              {!isImageLoaded && !imageError && (
                <div className="animate-pulse flex items-center justify-center w-full h-48 bg-base-200 rounded-lg">
                  <ImageIcon className="w-12 h-12 text-base-300" />
                </div>
              )}
              {(isImageLoaded || imageError) && (
                <img
                  src={file.content}
                  alt={file.name}
                  className={`w-full h-auto rounded-lg ${!isImageLoaded ? 'hidden' : ''}`}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 bg-base-200 rounded-lg w-full max-w-xs">
              {getFileIcon()}
              <span className="mt-2 text-sm text-center break-all">{file.name}</span>
            </div>
          )}
          
          <div className="mt-4 w-full flex justify-center">
            <Button
              variant="primary"
              onClick={() => onDownload(file)}
              loading={isDownloading}
              className="w-full sm:w-auto"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FileViewer
