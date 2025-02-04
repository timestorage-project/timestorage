import { FC, useCallback, useEffect, useState } from 'react'
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
  ImageListItem
} from '@mui/material'
import { useParams } from 'react-router-dom'
import BottomNavigation from '@/components/BottomNavigation'
import { useData } from '@/context/DataContext'
import Header from '../components/Header'
import ErrorView from '@/components/ErrorView'
import LoadingView from '@/components/LoadingView'
import * as canisterService from '../services/canisterService'

interface FileCache {
  [key: string]: string
}

const DetailPage: FC = () => {
  const { type } = useParams()
  const { data, isLoading, error, projectId } = useData()
  const [fileCache, setFileCache] = useState<FileCache>({})
  const [loadingFiles, setLoadingFiles] = useState<string[]>([])

  const isFileId = (value: string) => /^file-\d+$/.test(value)

  const loadFile = useCallback(
    async (fileId: string) => {
      if (fileCache[fileId] || loadingFiles.includes(fileId)) return

      try {
        setLoadingFiles(prev => [...prev, fileId])
        const fileData = await canisterService.getFileByUUIDAndId(projectId, fileId)
        setFileCache(prev => ({
          ...prev,
          [fileId]: fileData
        }))
      } catch (error) {
        console.error(`Error loading file ${fileId}:`, error)
      } finally {
        setLoadingFiles(prev => prev.filter(id => id !== fileId))
      }
    },
    [fileCache, loadingFiles, projectId]
  )

  useEffect(() => {
    // Pre-load all file values
    if (data && type) {
      const pageData = data[type as keyof typeof data]
      pageData.children?.forEach(item => {
        if (isFileId(item.value)) {
          loadFile(item.value)
        }
      })
    }
  }, [data, type, loadFile])

  if (isLoading && !data) {
    return <LoadingView message='Loading page...' />
  }

  if (error) {
    return <ErrorView message={error} />
  }

  if (!data || !type || !data[type as keyof typeof data]) {
    return <div>No data available</div>
  }

  const pageData = data[type as keyof typeof data]

  const renderValue = (item: { label: string; value: string }) => {
    if (isFileId(item.value)) {
      if (loadingFiles.includes(item.value)) {
        return <Typography color='text.secondary'>Loading file...</Typography>
      }
      if (fileCache[item.value]) {
        const isImage = fileCache[item.value].startsWith('data:image/')
        if (isImage) {
          return (
            <img
              src={fileCache[item.value]}
              alt={item.label}
              style={{
                maxWidth: '100%',
                maxHeight: '200px',
                objectFit: 'contain',
                borderRadius: '4px'
              }}
            />
          )
        }
        // For non-image files, show a download link
        return (
          <a
            href={fileCache[item.value]}
            download={`${item.label}.${fileCache[item.value].split(';')[0].split('/')[1]}`}
          >
            Download File
          </a>
        )
      }
      return <Typography color='error'>Failed to load file</Typography>
    }
    return item.value
  }

  return (
    <Root>
      <Header title={`Window Installation - ${projectId}`} showMenu={true} />

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
                  component: 'div' // This allows rendering complex content in secondary text
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
