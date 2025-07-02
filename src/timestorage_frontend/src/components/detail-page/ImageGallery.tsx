import React from 'react'
import { Motion } from '../ui/motion'
import { ImageGalleryProps } from './types'

const ImageGallery: React.FC<ImageGalleryProps> = ({ fileCache, onImageClick }) => {
  const images = Object.entries(fileCache).filter(
    ([, fileDetails]) => fileDetails.metadata?.isImage && fileDetails.content
  )

  if (images.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-neutral-content/70">
          No image previews currently available. Images will appear here once viewed or downloaded.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {images.map(([fileId, { content, metadata }]) => (
        <Motion
          key={metadata.fileId}
          variant="slideUp"
          className="card bg-base-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
        >
          <div className="card-body p-0">
            <div className="p-3 bg-base-300">
              <h4 className="font-medium text-sm truncate" title={metadata.fileName}>
                {metadata.fileName}
              </h4>
            </div>
            <div className="p-4 flex justify-center bg-base-100">
              <img
                src={content}
                alt={metadata.fileName}
                className="max-w-full max-h-64 object-contain cursor-pointer"
                onClick={() => onImageClick(metadata.fileId)}
              />
            </div>
          </div>
        </Motion>
      ))}
    </div>
  )
}

export default ImageGallery
