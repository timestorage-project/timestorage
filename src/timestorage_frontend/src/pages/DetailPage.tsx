import { useCallback, useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Motion } from '@/components/ui/motion'
import BottomNavigation from '@/components/BottomNavigation'
import { useData } from '@/context/DataContext'
import ErrorView from '@/components/ErrorView'
import LoadingView from '@/components/LoadingView'
import * as canisterService from '@/services/canisterService'
import { fileToBase64, getFileMetadata as utilGetFileMetadata } from '@/utils/fileUtils'
import { FileViewer, FileUploader, DetailItem, ImageGallery } from '@/components/detail-page'
import type { FileCache, FileCacheItem, PageDataItem } from '@/components/detail-page/types'
import Header from '@/components/Header'

import { useTranslation } from '@/hooks/useTranslation'

// Types are now imported from @/components/detail-page/types

const DetailPage = () => {
  const { sectionId } = useParams<{ sectionId: string }>()
  const { data, isLoading, error, uuid, reloadData } = useData()
  const { t } = useTranslation()
  // Define the file cache state with proper typing
  const [fileCache, setFileCache] = useState<FileCache>({})
  const [loadingFiles, setLoadingFiles] = useState<string[]>([]) // Tracks file IDs being loaded (metadata or content)
  const [uploadingKeys, setUploadingKeys] = useState<string[]>([]) // Tracks refIds for uploads
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  const loadFileMetadata = useCallback(
    async (fileId: string) => {
      if (loadingFiles.includes(fileId)) return

      try {
        setLoadingFiles(prev => [...prev, fileId])
        const metadata = await canisterService.getFileMetadataByUUIDAndId(uuid, fileId)

        setFileCache(prev => ({
          ...prev,
          [fileId]: {
            id: fileId,
            name: metadata.fileName || `File ${fileId}`,
            mimeType: metadata.mimeType,
            metadata: metadata,
            content: prev[fileId]?.content,
            error: false
          }
        }))
      } catch (error) {
        console.error('Error loading file metadata:', error)
        setFileCache(prev => ({
          ...prev,
          [fileId]: {
            id: fileId,
            name: `Error loading file ${fileId}`,
            mimeType: 'application/octet-stream',
            metadata: {
              fileId,
              fileName: `Error loading file ${fileId}`,
              mimeType: 'application/octet-stream',
              isImage: false,
              uploadTimestamp: new Date().toISOString()
            },
            error: true
          }
        }))
      } finally {
        setLoadingFiles(prev => prev.filter(id => id !== fileId))
      }
    },
    [uuid, loadingFiles]
  )

  const downloadFileContent = useCallback(
    async (file: FileCacheItem) => {
      const fileId = file.id
      if (!fileId || (loadingFiles.includes(fileId) && file.content)) return

      try {
        setLoadingFiles(prev => [...prev, fileId])

        // If we don't have complete metadata, try to load it
        if (!file.metadata) {
          console.warn('Metadata not found in file cache. Loading metadata first.')
          await loadFileMetadata(fileId)
          // After loading metadata, get the latest file data from cache
          const updatedFile = fileCache[fileId]
          if (!updatedFile?.metadata) {
            throw new Error(`Metadata for ${fileId} could not be loaded.`)
          }
          // Update the file with the latest data from cache
          file = {
            ...file,
            metadata: updatedFile.metadata,
            mimeType: updatedFile.metadata.mimeType,
            name: updatedFile.metadata.fileName || file.name || `File ${fileId}`
          }
        }

        const isImage = file.mimeType?.startsWith('image/') || false

        // Only download if we don't already have the content and we have a valid uuid
        if (!file.content) {
          if (!uuid) {
            console.error('Cannot download file: No UUID available')
            return
          }

          try {
            const fileData = await canisterService.downloadFileContent(uuid, fileId)

            if (!fileData || !fileData.dataUrl) {
              throw new Error('Invalid file data received from server')
            }

            setFileCache(prev => ({
              ...prev,
              [fileId]: {
                ...prev[fileId],
                id: fileId,
                name: file.name || `File ${fileId}`,
                mimeType: file.mimeType || 'application/octet-stream',
                metadata: file.metadata || {
                  fileId,
                  fileName: file.name || `File ${fileId}`,
                  mimeType: file.mimeType || 'application/octet-stream',
                  isImage: file.mimeType?.startsWith('image/') || false,
                  uploadTimestamp: new Date().toISOString()
                },
                content: fileData.dataUrl,
                error: false
              }
            }))

            if (!isImage) {
              // For non-image files, trigger download
              const response = await fetch(fileData.dataUrl)
              const blob = await response.blob()
              const url = window.URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = file.name || `file-${fileId}`
              document.body.appendChild(a)
              a.click()
              window.URL.revokeObjectURL(url)
              a.remove()
            }
          } catch (err) {
            console.error(`Error downloading file ${fileId}:`, err)
            // TODO: Add error toast/notification
          }
        }
      } catch (err) {
        console.error(`Error in downloadFileContent for file ${fileId}:`, err)
        // TODO: Add error toast/notification
      } finally {
        setLoadingFiles(prev => prev.filter(id => id !== fileId))
      }
    },
    [fileCache, loadingFiles, loadFileMetadata, uuid]
  )

  const handleFileUpload = async (file: File, refId: string): Promise<void> => {
    try {
      setUploadingKeys(prev => [...prev, refId])
      const base64Data = await fileToBase64(file)
      const partialMetadata = utilGetFileMetadata(file)

      const result = await canisterService.uploadFile(uuid, base64Data, partialMetadata)
      const fileId = result.match(/ID: (file-\d+)/)?.[1]

      if (!fileId) {
        throw new Error('Failed to extract file ID from upload response')
      }

      const key = refId.replace('#/values/', '')
      console.log('Upload complete. Using key path:', key, 'for fileId:', fileId)
      await canisterService.updateValue(uuid, key, fileId, true)

      await reloadData()
      loadFileMetadata(fileId)
    } catch (err) {
      console.error('Error uploading file:', err)
      // TODO: Add error toast/notification
    } finally {
      setUploadingKeys(prev => prev.filter(key => key !== refId))
    }
  }

  useEffect(() => {
    if (data && sectionId && data.nodes[sectionId]) {
      const currentSectionData = data.nodes[sectionId]
      const fileItems =
        currentSectionData.children?.filter(
          (item: PageDataItem) =>
            item.fileType && (canisterService.isFileId(item.value) || item.value === '-' || item.value === '')
        ) || []

      fileItems.forEach((item: PageDataItem) => {
        if (canisterService.isFileId(item.value)) {
          loadFileMetadata(item.value)
        }
      })
    }
  }, [data, sectionId, loadFileMetadata]) // projectId is not directly used here but loadFileMetadata depends on it.

  if (isLoading && !data) {
    return <LoadingView message={t('LOADING_PAGE')} />
  }

  if (error) {
    return <ErrorView message={typeof error === 'string' ? error : 'An unknown error occurred'} />
  }

  if (!data || !sectionId || !data.nodes[sectionId]) {
    return <ErrorView message={sectionId ? `Section "${sectionId}" not found` : 'Section data not available.'} />
  }

  const pageData = data.nodes[sectionId]

  const renderValue = (item: PageDataItem) => {
    if (canisterService.isFileId(item.value)) {
      const fileId = item.value
      const fileInfo = fileCache[fileId]
      const isLoading = loadingFiles.includes(fileId)
      const isImage = fileInfo?.mimeType?.startsWith('image/') || false

      if (!fileInfo) {
        // If file info is not loaded yet, show a loading state
        return (
          <div className='card bg-base-100 shadow-xl mb-4'>
            <div className='card-body'>
              <div className='flex items-center justify-center p-4'>
                <span className='loading loading-spinner loading-lg'></span>
                <span className='ml-2'>Loading file info...</span>
              </div>
            </div>
          </div>
        )
      }

      return (
        <FileViewer
          key={fileId}
          file={{
            id: fileId,
            name: fileInfo.name || `File ${fileId}`,
            mimeType: fileInfo.mimeType || 'application/octet-stream',
            content: fileInfo.content,
            error: fileInfo.error,
            metadata: fileInfo.metadata || {
              fileId,
              fileName: fileInfo.name || `File ${fileId}`,
              mimeType: fileInfo.mimeType || 'application/octet-stream',
              isImage: isImage,
              uploadTimestamp: new Date().toISOString()
            }
          }}
          onDownload={downloadFileContent}
          isDownloading={isLoading}
        />
      )
    }

    if ((item.value === '-' || item.value === '') && item.fileType) {
      const inputId = `file-upload-${item.label.replace(/\s+/g, '-').toLowerCase()}`
      const refId =
        item.path ||
        (sectionId
          ? `#/values/${sectionId}/${item.label.replace(/\s+/g, '_').toLowerCase()}`
          : `#/values/unknown_section/${item.label.replace(/\s+/g, '_').toLowerCase()}`)

      return (
        <FileUploader
          label={item.label}
          fileType={item.fileType}
          refId={refId}
          isUploading={uploadingKeys.includes(refId)}
          onUpload={handleFileUpload}
          inputRef={{
            current: fileInputRefs.current[inputId] || null
          }}
        />
      )
    }

    // Default rendering for other values
    return <span className='text-base-content'>{String(item.value)}</span>
  }

  return (
    <div className='min-h-screen bg-base-200'>
      <Header title={pageData.title || (uuid ? `Details - ${uuid}` : 'Details')} />

      <div className='container mx-auto px-4 py-6 pb-24'>
        <Motion variant='fadeIn' className='space-y-6'>
          <div className='mb-8'>
            <h1 className='text-3xl font-bold mb-2'>{pageData.title}</h1>
            {pageData.description && <h3 className='text-xl'>{pageData.description}</h3>}
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            {pageData.children?.map((item: PageDataItem, index: number) => (
              <DetailItem key={index} item={item}>
                {renderValue(item)}
              </DetailItem>
            ))}
          </div>

          {pageData.showImages && (
            <div className='mt-8 bg-base-100 rounded-lg p-6 shadow-sm'>
              <h2 className='text-xl font-semibold mb-4'>Image Gallery</h2>
              <ImageGallery
                fileCache={Object.entries(fileCache)
                  .filter(([_, file]) => file.mimeType?.startsWith('image/'))
                  .reduce(
                    (acc, [id, file]) => ({
                      ...acc,
                      [id]: file
                    }),
                    {} as FileCache
                  )}
                onImageClick={fileId => {
                  const file = fileCache[fileId]
                  if (file) {
                    downloadFileContent(file)
                  }
                }}
              />
            </div>
          )}
        </Motion>
      </div>

      <BottomNavigation />
    </div>
  )
}

export default DetailPage
