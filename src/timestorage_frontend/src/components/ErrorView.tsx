import { FC } from 'react'
import { Box, Typography, Button, styled } from '@mui/material'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import { useData } from '../context/DataContext'

interface ErrorViewProps {
  message: string
}

const ErrorView: FC<ErrorViewProps> = ({ message }) => {
  const { reloadData } = useData()

  return (
    <ErrorContainer>
      <ContentWrapper>
        <StyledErrorIcon />
        <ErrorText variant='h6'>{message}</ErrorText>
        <Button variant='contained' color='primary' onClick={reloadData} startIcon={<ErrorOutlineIcon />}>
          Try Again
        </Button>
      </ContentWrapper>
    </ErrorContainer>
  )
}

const ErrorContainer = styled(Box)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.9);
  z-index: 1000;
`

const ContentWrapper = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 24px;
  border-radius: 8px;
  background-color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`

const StyledErrorIcon = styled(ErrorOutlineIcon)`
  color: #d32f2f;
  font-size: 48px;
`

const ErrorText = styled(Typography)`
  color: #d32f2f;
  text-align: center;
`

export default ErrorView
