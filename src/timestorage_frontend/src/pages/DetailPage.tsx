import { FC } from 'react'
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

const DetailPage: FC = () => {
  const { type } = useParams()
  const { data, isLoading, error, projectId } = useData()

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
              <ListItemText primary={item.label} secondary={item.value} />
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
  background-color: #f5f5f5;
`

const ListItemStyled = styled(ListItem)`
  background-color: white;
  border-radius: 8px;
  margin-bottom: 8px;
  padding: 12px 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`

export default DetailPage
