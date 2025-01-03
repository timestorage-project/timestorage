import { FC } from 'react'
import { Box, CircularProgress, Typography, styled } from '@mui/material'
import ConstructionIcon from '@mui/icons-material/Construction'

interface LoadingViewProps {
  message?: string
}

const LoadingView: FC<LoadingViewProps> = ({ message = 'Loading data...' }) => {
  return (
    <LoadingContainer>
      <ContentWrapper>
        <IconWrapper>
          <StyledConstructionIcon />
          <StyledCircularProgress />
        </IconWrapper>
        <LoadingText variant='h6'>{message}</LoadingText>
      </ContentWrapper>
    </LoadingContainer>
  )
}

const LoadingContainer = styled(Box)`
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
`

const IconWrapper = styled(Box)`
  position: relative;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
`

const StyledConstructionIcon = styled(ConstructionIcon)`
  color: #2e7d32;
  font-size: 40px;
  position: absolute;
  z-index: 1;
`

const StyledCircularProgress = styled(CircularProgress)`
  position: absolute;
  color: #2e7d32;
  z-index: 0;
`

const LoadingText = styled(Typography)`
  color: #2e7d32;
  text-align: center;
`

export default LoadingView
