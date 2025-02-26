import { FC, useCallback, useEffect, useState, useRef } from 'react'
import {
  Box,
  Container,
  Typography,
  styled,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ImageList,
  ImageListItem,
  Button,
  CircularProgress
} from '@mui/material'
import { useParams } from 'react-router-dom'
import BottomNavigation from '@/components/BottomNavigation'
import { useData } from '@/context/DataContext'
import Header from '../components/Header'
import ErrorView from '@/components/ErrorView'
import LoadingView from '@/components/LoadingView'
import * as canisterService from '../services/canisterService'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import { fileToBase64, getFileMetadata } from '@/utils/fileUtils'

interface FileCache {
  [key: string]: {
    metadata: FileMetadata
    data?: string
  }
}

interface FileMetadata {
  fileId: string
  fileName: string
  mimeType: string
  isImage: boolean
  uploadTimestamp: string
}

const DetailPage: FC = () => {
  const { sectionId } = useParams<{ sectionId: string }>()
  const { data, isLoading, error, projectId, reloadData } = useData()
  const [fileCache, setFileCache] = useState<FileCache>({})
  const [loadingFiles, setLoadingFiles] = useState<string[]>([])
  const [uploadingKeys, setUploadingKeys] = useState<string[]>([])
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  // Load just the metadata for a file (fast)
  const loadFileMetadata = useCallback(
    async (fileId: string) => {
      if (fileCache[fileId] || loadingFiles.includes(fileId)) return

      try {
        setLoadingFiles(prev => [...prev, fileId])
        // Using the metadata-only endpoint
        const metadata = await canisterService.getFileMetadataByUUIDAndId(projectId, fileId)
        setFileCache(prev => ({
          ...prev,
          [fileId]: {
            metadata
          }
        }))
      } catch (error) {
        console.error(`Error loading file metadata ${fileId}:`, error)
      } finally {
        setLoadingFiles(prev => prev.filter(id => id !== fileId))
      }
    },
    [fileCache, loadingFiles, projectId]
  )

  const downloadFileContent = useCallback(
    async (fileId: string) => {
      // If we're already loading, don't start another request
      if (loadingFiles.includes(fileId)) return

      try {
        setLoadingFiles(prev => [...prev, fileId])

        // Check if this file is in our cache already
        const cachedFile = fileCache[fileId]
        const isImage = cachedFile?.metadata.isImage

        // If we already have the data cached
        if (cachedFile?.data) {
          // For non-images (documents), trigger download automatically
          if (!isImage) {
            const linkElement = document.createElement('a')
            linkElement.href = cachedFile.data
            linkElement.download = cachedFile.metadata.fileName
            document.body.appendChild(linkElement)
            linkElement.click()
            document.body.removeChild(linkElement)
          }
          // For images, we just display them (already handled in the render function)
          return
        }

        // We don't have the data, so fetch it
        const fileData = await canisterService.downloadFileContent(projectId, fileId)

        // Update the cache with the new data
        setFileCache(prev => ({
          ...prev,
          [fileId]: {
            ...prev[fileId],
            data: fileData.dataUrl
          }
        }))

        // For non-images, automatically trigger download after fetching
        if (!isImage) {
          setTimeout(() => {
            const linkElement = document.createElement('a')
            linkElement.href = fileData.dataUrl
            linkElement.download = fileCache[fileId].metadata.fileName
            document.body.appendChild(linkElement)
            linkElement.click()
            document.body.removeChild(linkElement)
          }, 100) // Small delay to ensure state update completes
        }
      } catch (error) {
        console.error(`Error downloading file ${fileId}:`, error)
      } finally {
        setLoadingFiles(prev => prev.filter(id => id !== fileId))
      }
    },
    [fileCache, loadingFiles, projectId]
  )

  const handleFileUpload = async (file: File, refId: string): Promise<void> => {
    try {
      setUploadingKeys(prev => [...prev, refId])
      const base64Data = await fileToBase64(file)
      const metadata = getFileMetadata(file)
      const result = await canisterService.uploadFile(projectId, base64Data, metadata)
      const fileId = result.match(/ID: (file-\d+)/)?.[1]

      if (!fileId) {
        throw new Error('Failed to extract file ID from response')
      }

      // Just extract the key part from the refId path, preserving its exact format
      const key = refId.replace('#/values/', '')

      console.log('Upload complete. Using key path:', key, 'for fileId:', fileId)

      // Use the exact key as it appears in the refId
      await canisterService.updateValue(projectId, key, fileId, true)

      // Reload data after successful upload
      await reloadData()
    } catch (error) {
      console.error('Error uploading file:', error)
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
    // Pre-load only file metadata for all files (fast)
    if (data && sectionId && data[sectionId]) {
      const pageData = data[sectionId]
      pageData.children?.forEach(item => {
        if (canisterService.isFileId(item.value)) {
          loadFileMetadata(item.value)
        }
      })
    }
  }, [data, sectionId, loadFileMetadata])

  if (isLoading && !data) {
    return <LoadingView message='Loading page...' />
  }

  if (error) {
    return <ErrorView message={error} />
  }

  if (!data || !sectionId || !data[sectionId]) {
    return <ErrorView message={`Section "${sectionId}" not found`} />
  }

  const pageData = data[sectionId]

  const renderValue = (item: { label: string; value: string; fileType?: string; path?: string }) => {
    console.log('Processing item:', item) // Add this for debugging

    // Check if it's a file reference
    if (canisterService.isFileId(item.value)) {
      const fileId = item.value
      console.log('Found file ID:', fileId)

      // If we're still loading the metadata
      if (loadingFiles.includes(fileId) && !fileCache[fileId]) {
        return <CircularProgress size={20} />
      }

      const fileInfo = fileCache[fileId]
      console.log(fileInfo)

      // If we failed to load metadata
      if (!fileInfo) {
        return <Typography color='error'>Failed to load file</Typography>
      }

      const { metadata } = fileInfo

      // If it's an image and we have the data (content was downloaded)
      if (metadata.isImage && fileInfo.data) {
        return (
          <img
            src={fileInfo.data}
            alt={metadata.fileName}
            style={{
              maxWidth: '100%',
              maxHeight: '200px',
              objectFit: 'contain',
              borderRadius: '4px'
            }}
          />
        )
      }

      // If it's an image but we haven't downloaded the content yet
      if (metadata.isImage && !fileInfo.data) {
        return (
          <Button
            variant='outlined'
            startIcon={
              <span role='img' aria-label='Image'>
                🖼️
              </span>
            }
            onClick={() => downloadFileContent(fileId)}
            disabled={loadingFiles.includes(fileId)}
          >
            {loadingFiles.includes(fileId) ? 'Loading...' : `View ${metadata.fileName}`}
          </Button>
        )
      }

      // For PDF or other non-image files - single button approach
      const isPdf = metadata.mimeType.includes('pdf') || item.fileType === 'PDF'
      const icon = isPdf ? (
        <PictureAsPdfIcon />
      ) : (
        <span role='img' aria-label='File'>
          {canisterService.getFileIcon(metadata.mimeType)}
        </span>
      )

      return (
        <Box>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
            {metadata.fileName} ({metadata.mimeType.split('/')[1]})
          </Typography>
          <Button
            variant={fileInfo.data ? 'contained' : 'outlined'}
            startIcon={icon}
            onClick={() => downloadFileContent(fileId)}
            disabled={loadingFiles.includes(fileId)}
          >
            {loadingFiles.includes(fileId) ? 'Downloading...' : 'Download'}
          </Button>
        </Box>
      )
    }
    console.log(item.value, item)
    // For empty values that should be PDF files, show upload button
    if ((item.value === '-' || item.value === '') && item.fileType === 'PDF') {
      const inputId = `file-upload-${item.label.replace(/\s+/g, '-').toLowerCase()}`
      const refId = item.path || `#/values/${sectionId}/${item.label.replace(/\s+/g, '_').toLowerCase()}`

      console.log('Creating upload button for:', refId)

      return (
        <Box>
          <input
            type='file'
            id={inputId}
            accept='application/pdf'
            style={{ display: 'none' }}
            onChange={e => handleUploadPdf(e, refId)}
            ref={el => (fileInputRefs.current[inputId] = el)}
          />
          <Button
            variant='outlined'
            startIcon={<FileUploadIcon />}
            endIcon={<PictureAsPdfIcon />}
            onClick={() => fileInputRefs.current[inputId]?.click()}
            disabled={uploadingKeys.includes(refId)}
            sx={{ mt: 1 }}
          >
            {uploadingKeys.includes(refId) ? 'Uploading...' : 'Upload PDF'}
          </Button>
        </Box>
      )
    }

    return item.value
  }

  return (
    <Root>
      <Header title={`PosaCheck - ${projectId}`} showMenu={true} />

      <Container maxWidth='sm' sx={{ mt: 4, mb: 10 }}>
        <Typography variant='h5' sx={{ mb: 3 }}>
          {pageData.title}
        </Typography>

        <List>
          {pageData.children?.map((item, index) => (
            <ListItemStyled key={index} divider>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <span role='img' aria-label={item.label}>
                  {item.icon}
                </span>
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                secondary={renderValue(item)}
                secondaryTypographyProps={{
                  component: 'div'
                }}
              />
            </ListItemStyled>
          ))}
        </List>

        {pageData.showImages && (
          <Box sx={{ mt: 4 }}>
            <ImageList sx={{ width: '100%' }} cols={3} rowHeight={164}>
              {[1, 2, 3].map(item => (
                <ImageListItem key={item}>
                  <img
                    src={`/window-${item}.jpg`}
                    alt={`Window sample ${item}`}
                    loading='lazy'
                    style={{ borderRadius: 8 }}
                  />
                </ImageListItem>
              ))}
            </ImageList>
          </Box>
        )}
      </Container>

      <BottomNavigation />
    </Root>
  )
}

const Root = styled('div')`
  min-height: 100vh;
  background-color: #f9fafb;
`

const ListItemStyled = styled(ListItem)`
  background-color: white;
  border-radius: 8px;
  margin-bottom: 8px;
  padding: 12px 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`

export default DetailPage
