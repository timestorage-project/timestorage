import { useCallback, useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

// Shadcn/UI components
import { Button } from '../components/ui/button'
import { Container } from '../components/ui/container'
import { Typography } from '../components/ui/typography'
import { Spinner } from '../components/ui/spinner'

// Icons
import { Upload } from 'lucide-react' // Renamed to avoid conflict

// Custom components
import BottomNavigation from '../components/BottomNavigation'
import { Header } from '../components/ui/header'
import { useData } from '../context/DataContext'
import ErrorView from '../components/ErrorView'
import LoadingView from '../components/LoadingView'
import * as canisterService from '../services/canisterService'
import { fileToBase64, getFileMetadata as utilGetFileMetadata } from '../utils/fileUtils' // Renamed to avoid conflict

interface FileCache {
  [key: string]: {
    metadata: FileMetadata
    data?: string
    error?: boolean // Optional: to mark if loading metadata failed
  }
}

interface FileMetadata {
  fileId: string
  fileName: string
  mimeType: string
  isImage: boolean
  uploadTimestamp: string // Assuming this comes from canisterService or utilGetFileMetadata
}

// Define item type for clarity, based on usage in the component
interface PageDataItem {
  label: string
  value: string
  fileType?: string // e.g., 'PDF'
  path?: string // Used for constructing refId
  icon?: string // For display in the list
  // Potentially other properties from your data structure
}

const DetailPage = () => {
  const { sectionId } = useParams<{ sectionId: string }>()
  const { data, isLoading, error, projectId, reloadData } = useData()
  const [fileCache, setFileCache] = useState<FileCache>({})
  const [loadingFiles, setLoadingFiles] = useState<string[]>([]) // Tracks file IDs being loaded (metadata or content)
  const [uploadingKeys, setUploadingKeys] = useState<string[]>([]) // Tracks refIds for uploads
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  const loadFileMetadata = useCallback(
    async (fileId: string) => {
      if (fileCache[fileId]?.metadata || loadingFiles.includes(fileId)) return

      try {
        setLoadingFiles(prev => [...prev, fileId])
        const metadata = await canisterService.getFileMetadataByUUIDAndId(projectId, fileId)
        setFileCache(prev => ({
          ...prev,
          [fileId]: { metadata }
        }))
      } catch (err) {
        console.error(`Error loading file metadata ${fileId}:`, err)
        setFileCache(prev => ({
          ...prev,
          [fileId]: {
            ...prev[fileId],
            error: true,
            metadata: { fileId, fileName: 'Error loading metadata', mimeType: '', isImage: false, uploadTimestamp: '' }
          } // Provide fallback metadata
        }))
      } finally {
        setLoadingFiles(prev => prev.filter(id => id !== fileId))
      }
    },
    [fileCache, loadingFiles, projectId]
  )

  const downloadFileContent = useCallback(
    async (fileId: string) => {
      if (loadingFiles.includes(fileId) && fileCache[fileId]?.data) return // Already loading or data exists

      try {
        setLoadingFiles(prev => [...prev, fileId])

        const cachedFile = fileCache[fileId]
        if (!cachedFile || !cachedFile.metadata) {
          console.warn(`Metadata for ${fileId} not found. Attempting to load before download.`)
          await loadFileMetadata(fileId) // Try to load metadata first
          // Re-check after loading, this part might need more sophisticated state management
          // For now, we proceed assuming it might be available after the await
        }

        const currentMetadata = fileCache[fileId]?.metadata // Get potentially updated metadata
        if (!currentMetadata) {
          throw new Error(`Metadata for ${fileId} could not be loaded.`)
        }

        const isImage = currentMetadata.isImage

        if (cachedFile?.data) {
          // If data was already cached
          if (!isImage) {
            const linkElement = document.createElement('a')
            linkElement.href = cachedFile.data
            linkElement.download = currentMetadata.fileName
            document.body.appendChild(linkElement)
            linkElement.click()
            document.body.removeChild(linkElement)
          }
          return
        }

        const fileData = await canisterService.downloadFileContent(projectId, fileId)
        setFileCache(prev => ({
          ...prev,
          [fileId]: {
            metadata: currentMetadata, // Use the metadata we know is good
            data: fileData.dataUrl
          }
        }))

        if (!isImage) {
          setTimeout(() => {
            const linkElement = document.createElement('a')
            linkElement.href = fileData.dataUrl
            linkElement.download = currentMetadata.fileName
            document.body.appendChild(linkElement)
            linkElement.click()
            document.body.removeChild(linkElement)
          }, 100)
        }
      } catch (err) {
        console.error(`Error downloading file ${fileId}:`, err)
      } finally {
        setLoadingFiles(prev => prev.filter(id => id !== fileId))
      }
    },
    [fileCache, loadingFiles, projectId, loadFileMetadata]
  )

  const handleFileUpload = async (file: File, refId: string): Promise<void> => {
    try {
      setUploadingKeys(prev => [...prev, refId])
      const base64Data = await fileToBase64(file)
      // Ensure utilGetFileMetadata returns an object compatible with FileMetadata (excluding fileId initially)
      const partialMetadata = utilGetFileMetadata(file)

      // The canisterService.uploadFile likely returns the full metadata including fileId or just fileId
      const result = await canisterService.uploadFile(projectId, base64Data, partialMetadata) // Removed 'as any' cast
      const fileId = result.match(/ID: (file-\d+)/)?.[1] // Or however fileId is obtained

      if (!fileId) {
        throw new Error('Failed to extract file ID from upload response')
      }

      const key = refId.replace('#/values/', '')
      console.log('Upload complete. Using key path:', key, 'for fileId:', fileId)
      await canisterService.updateValue(projectId, key, fileId, true)

      await reloadData() // Reloads the main data which might include the new file reference
      // Optionally, preload metadata for the newly uploaded file
      loadFileMetadata(fileId)
    } catch (err) {
      console.error('Error uploading file:', err)
      // Potentially show an error to the user
    } finally {
      setUploadingKeys(prev => prev.filter(key => key !== refId))
    }
  }

  const handleUploadPdf = (event: React.ChangeEvent<HTMLInputElement>, refId: string) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    const file = files[0]
    if (!file.type.includes('pdf')) {
      alert('Please upload a PDF file')
      return
    }
    handleFileUpload(file, refId)
  }

  useEffect(() => {
    if (data && sectionId && data[sectionId]) {
      const currentSectionData = data[sectionId]
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
    return <LoadingView message='Loading page...' />
  }

  if (error) {
    return <ErrorView message={typeof error === 'string' ? error : 'An unknown error occurred'} />
  }

  if (!data || !sectionId || !data[sectionId]) {
    return <ErrorView message={sectionId ? `Section "${sectionId}" not found` : 'Section data not available.'} />
  }

  const pageData = data[sectionId]

  const renderValue = (item: PageDataItem) => {
    console.log('Processing item:', item)

    if (canisterService.isFileId(item.value)) {
      const fileId = item.value
      const fileInfo = fileCache[fileId]

      if (loadingFiles.includes(fileId) && !fileInfo?.metadata) {
        return <Spinner size='sm' />
      }

      if (!fileInfo || !fileInfo.metadata || fileInfo.error) {
        return (
          <div className='flex items-center gap-2'>
            <Typography color='destructive'>{fileInfo?.metadata?.fileName || 'File metadata error.'}</Typography>
            {!loadingFiles.includes(fileId) && ( // Show retry only if not currently loading
              <Button variant='link' size='sm' onClick={() => loadFileMetadata(fileId)}>
                Retry
              </Button>
            )}
          </div>
        )
      }

      const { metadata } = fileInfo // metadata is now guaranteed to exist and not be an error placeholder

      if (metadata.isImage && fileInfo.data) {
        return (
          <img
            src={fileInfo.data}
            alt={metadata.fileName}
            style={{
              maxWidth: '100%',
              maxHeight: '200px',
              objectFit: 'contain',
              borderRadius: '4px',
              border: '1px solid #eee'
            }}
          />
        )
      }

      if (metadata.isImage && !fileInfo.data) {
        // Image, but content not yet downloaded
        return (
          <Button
            variant='outline'
            className='flex items-center gap-2'
            onClick={() => downloadFileContent(fileId)}
            disabled={loadingFiles.includes(fileId)}
          >
            {loadingFiles.includes(fileId) ? 'Loading Preview...' : `View ${metadata.fileName}`}
          </Button>
        )
      }

      // For PDF or other non-image files

      return (
        <div>
          <Typography variant='body2' color='muted' className='mb-1 truncate' title={metadata.fileName}>
            {metadata.fileName} ({metadata.mimeType.split('/')[1]})
          </Typography>
          <Button
            variant='outline'
            onClick={() => downloadFileContent(fileId)}
            className='flex items-center gap-2'
            disabled={loadingFiles.includes(fileId)}
          >
            {loadingFiles.includes(fileId) ? 'Downloading...' : 'Download'}
          </Button>
        </div>
      )
    }

    if ((item.value === '-' || item.value === '') && item.fileType === 'PDF') {
      const inputId = `file-upload-${item.label.replace(/\s+/g, '-').toLowerCase()}`
      // Ensure sectionId is available for refId construction
      const refId =
        item.path ||
        (sectionId
          ? `#/values/${sectionId}/${item.label.replace(/\s+/g, '_').toLowerCase()}`
          : `#/values/unknown_section/${item.label.replace(/\s+/g, '_').toLowerCase()}`)

      return (
        <div>
          <input
            type='file'
            id={inputId}
            accept='application/pdf'
            className='hidden'
            onChange={e => handleUploadPdf(e, refId)}
            ref={el => (fileInputRefs.current[inputId] = el)}
          />
          <Button
            variant='outline'
            className='flex items-center gap-2'
            onClick={() => fileInputRefs.current[inputId]?.click()}
            disabled={uploadingKeys.includes(refId)}
          >
            <Upload className='w-4 h-4' />
            {uploadingKeys.includes(refId) ? 'Uploading...' : 'Upload PDF'}
          </Button>
        </div>
      )
    }

    // Default rendering for other values (e.g., simple text)
    return <Typography variant='body1'>{String(item.value)}</Typography>
  }

  return (
    <div className='min-h-screen '>
      <Header title={pageData.title || (projectId ? `Details - ${projectId}` : 'Details')} />

      <Container maxWidth='sm' className='py-4 pb-20'>
        {' '}
        {/* Increased pb for BottomNavigation */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          <Typography variant='h4' className='mb-2'>
            {pageData.title}
          </Typography>

          {pageData.description && (
            <Typography variant='body1' color='muted' className='mb-6'>
              {pageData.description}
            </Typography>
          )}

          <ul className='space-y-4'>
            {pageData.children?.map((item: PageDataItem, index: number) => (
              <li key={index} className='p-3 border rounded-md shadow-sm'>
                <div className='flex items-start gap-3'>
                  <div className='flex-grow min-w-0'>
                    {' '}
                    {/* Added min-w-0 for better truncation handling if needed */}
                    <Typography variant='subtitle1' className='font-semibold'>
                      {item.label}
                    </Typography>
                    <div className='mt-1'>{renderValue(item)}</div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {pageData.showImages && (
            <div className='mt-8'>
              <Typography variant='h5' className='mb-4'>
                Image Gallery
              </Typography>
              <AnimatePresence>
                {Object.entries(fileCache)
                  .filter(([, fileDetails]) => fileDetails.metadata?.isImage && fileDetails.data)
                  .map(([fileId, { data, metadata }]) => (
                    <motion.div
                      key={fileId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className='mb-6 overflow-hidden rounded-lg border shadow-md'
                    >
                      <Typography variant='subtitle2' className='p-3 bg-muted/50 border-b'>
                        {metadata.fileName}
                      </Typography>
                      <div className='p-2'>
                        <img
                          src={data}
                          alt={metadata.fileName}
                          className='w-full h-auto max-h-[400px] object-contain rounded-md'
                        />
                      </div>
                    </motion.div>
                  ))}
              </AnimatePresence>
              {Object.values(fileCache).filter(f => f.metadata?.isImage && f.data).length === 0 && (
                <Typography variant='body2' color='muted'>
                  No image previews currently available. Images will appear here once viewed or downloaded.
                </Typography>
              )}
            </div>
          )}
        </motion.div>
      </Container>

      <BottomNavigation />
    </div>
  )
}

export default DetailPage
