import { FC, useState, useEffect } from 'react'
import {
  Box,
  Container,
  Typography,
  styled,
  IconButton,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  LinearProgress,
  Fade
} from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useNavigate } from 'react-router-dom'

import PhotoCamera from '@mui/icons-material/PhotoCamera'
import DeleteIcon from '@mui/icons-material/Delete'
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate'
import BottomNavigation from '@/components/BottomNavigation'
import Header from '../components/Header'
import { useData, WizardQuestion } from '@/context/DataContext'
import ErrorView from '@/components/ErrorView'
import LoadingView from '@/components/LoadingView'

interface WizardState {
  currentQuestionIndex: number
  answers: Record<string, string | string[]>
  isCompleted: boolean
}

const WizardPage: FC = () => {
  const navigate = useNavigate()
  const { projectId, getWizardQuestions } = useData()
  const [questions, setQuestions] = useState<WizardQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const storageKey = `window_installation_wizard_${projectId}`

  const [state, setState] = useState<WizardState>(() => {
    const saved = localStorage.getItem(storageKey)
    return saved
      ? JSON.parse(saved)
      : {
          currentQuestionIndex: 0,
          answers: {},
          isCompleted: false
        }
  })

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoading(true)
        const questionData = await getWizardQuestions()
        setQuestions(questionData)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load questions')
      } finally {
        setLoading(false)
      }
    }

    loadQuestions()
  }, [getWizardQuestions])

  useEffect(() => {
    if (state.isCompleted) {
      navigate('/')
    }
    localStorage.setItem(storageKey, JSON.stringify(state))
  }, [state, navigate, storageKey])

  if (loading && questions.length === 0) {
    return <LoadingView message='Loading installation wizard...' />
  }

  if (error) {
    return <ErrorView message={error} />
  }

  if (questions.length === 0) {
    return <ErrorView message='No questions available' />
  }

  const currentQuestion = questions[state.currentQuestionIndex]
  const progress = ((state.currentQuestionIndex + 1) / questions.length) * 100

  const handleNext = () => {
    if (state.currentQuestionIndex === questions.length - 1) {
      setState(prev => ({ ...prev, isCompleted: true }))
      return
    }
    setState(prev => ({
      ...prev,
      currentQuestionIndex: prev.currentQuestionIndex + 1
    }))
  }

  const handlePrevious = () => {
    setState(prev => ({
      ...prev,
      currentQuestionIndex: Math.max(0, prev.currentQuestionIndex - 1)
    }))
  }

  const handleAnswer = (value: string | string[]) => {
    setState(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [currentQuestion.id]: value
      }
    }))
  }

  const handlePhotoCapture = async (event: React.ChangeEvent<HTMLInputElement>, multiple: boolean) => {
    const files = event.target.files
    if (!files) return

    try {
      const photoUrls = await Promise.all(
        Array.from(files).map(file => {
          return new Promise<string>(resolve => {
            const reader = new FileReader()
            reader.onloadend = () => {
              resolve(reader.result as string)
            }
            reader.readAsDataURL(file)
          })
        })
      )

      setState(prev => ({
        ...prev,
        answers: {
          ...prev.answers,
          [currentQuestion.id]: multiple
            ? [...((prev.answers[currentQuestion.id] as string[]) || []), ...photoUrls]
            : photoUrls[0]
        }
      }))
    } catch (error) {
      console.error('Error processing photos:', error)
    }
  }

  const handleRemovePhoto = (indexToRemove: number) => {
    setState(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [currentQuestion.id]: (prev.answers[currentQuestion.id] as string[]).filter(
          (_, index) => index !== indexToRemove
        )
      }
    }))
  }

  const renderQuestion = () => {
    const currentAnswer = state.answers[currentQuestion.id]

    switch (currentQuestion.type) {
      case 'text':
        return (
          <TextField
            fullWidth
            multiline
            rows={4}
            variant='outlined'
            value={currentAnswer || ''}
            onChange={e => handleAnswer(e.target.value)}
            sx={{ mt: 3 }}
          />
        )

      case 'select':
        return (
          <RadioGroup value={currentAnswer || ''} onChange={e => handleAnswer(e.target.value)} sx={{ mt: 3 }}>
            {currentQuestion.options?.map(option => (
              <FormControlLabel key={option} value={option} control={<Radio />} label={option} sx={{ mb: 1 }} />
            ))}
          </RadioGroup>
        )

      case 'multiselect':
        return (
          <Box sx={{ mt: 3 }}>
            {currentQuestion.options?.map(option => (
              <FormControlLabel
                key={option}
                control={
                  <Checkbox
                    checked={((currentAnswer as string[]) || []).includes(option)}
                    onChange={e => {
                      const current = (currentAnswer as string[]) || []
                      const newValue = e.target.checked ? [...current, option] : current.filter(item => item !== option)
                      handleAnswer(newValue)
                    }}
                  />
                }
                label={option}
                sx={{ display: 'block', mb: 1 }}
              />
            ))}
          </Box>
        )

      case 'photo':
        return (
          <Box sx={{ mt: 3 }}>
            <input
              accept='image/*'
              style={{ display: 'none' }}
              id='photo-input'
              type='file'
              capture='environment'
              onChange={e => handlePhotoCapture(e, false)}
            />
            {currentAnswer ? (
              <Box sx={{ position: 'relative', width: 'fit-content' }}>
                <img
                  src={currentAnswer as string}
                  alt='Taken'
                  style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }}
                />
                <IconButton
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' }
                  }}
                  onClick={() => handleAnswer('')}
                >
                  <DeleteIcon sx={{ color: 'white' }} />
                </IconButton>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', gap: 2 }}>
                <label htmlFor='photo-input'>
                  <Button variant='contained' component='span' startIcon={<PhotoCamera />}>
                    Take Photo
                  </Button>
                </label>
                <label htmlFor='photo-input'>
                  <Button variant='outlined' component='span' startIcon={<AddPhotoAlternateIcon />}>
                    Upload Photo
                  </Button>
                </label>
              </Box>
            )}
          </Box>
        )

      case 'multiphoto':
        return (
          <Box sx={{ mt: 3 }}>
            <input
              accept='image/*'
              style={{ display: 'none' }}
              id='multi-photo-input'
              type='file'
              multiple
              capture='environment'
              onChange={e => handlePhotoCapture(e, true)}
            />
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <label htmlFor='multi-photo-input'>
                <Button variant='contained' component='span' startIcon={<PhotoCamera />}>
                  Take Photos
                </Button>
              </label>
              <label htmlFor='multi-photo-input'>
                <Button variant='outlined' component='span' startIcon={<AddPhotoAlternateIcon />}>
                  Upload Photos
                </Button>
              </label>
            </Box>
            <ImageGrid>
              {((currentAnswer as string[]) || []).map((photo, index) => (
                <Box key={index} sx={{ position: 'relative' }}>
                  <img
                    src={photo}
                    alt={`${index + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                  />
                  <IconButton
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
                      padding: '4px'
                    }}
                    onClick={() => handleRemovePhoto(index)}
                  >
                    <DeleteIcon sx={{ color: 'white', fontSize: '1.2rem' }} />
                  </IconButton>
                </Box>
              ))}
            </ImageGrid>
          </Box>
        )
      default:
        return null
    }
  }

  return (
    <Root>
      <Header title={`Window Installation - ${projectId}`} showMenu={true} />

      <LinearProgress
        variant='determinate'
        value={progress}
        sx={{ position: 'fixed', top: '64px', left: 0, right: 0 }}
      />

      <Container maxWidth='sm' sx={{ mt: 4, mb: 10 }}>
        <QuestionContainer>
          <Fade key={currentQuestion.id} in timeout={400}>
            <Box>
              <Typography variant='h4' sx={{ mb: 2 }}>
                {currentQuestion.question}
              </Typography>
              {renderQuestion()}

              <NavigationButtons>
                <Button
                  variant='outlined'
                  startIcon={<ArrowBackIcon />}
                  onClick={handlePrevious}
                  disabled={state.currentQuestionIndex === 0}
                >
                  Previous
                </Button>
                <Button variant='contained' endIcon={<ArrowForwardIcon />} onClick={handleNext}>
                  {state.currentQuestionIndex === questions.length - 1 ? 'Finish' : 'Next'}
                </Button>
              </NavigationButtons>
            </Box>
          </Fade>
        </QuestionContainer>
      </Container>

      <BottomNavigation />
    </Root>
  )
}

const Root = styled('div')`
  min-height: 100vh;
  background-color: #f5f5f5;
`

const QuestionContainer = styled(Box)`
  min-height: calc(100vh - 180px);
  display: flex;
  flex-direction: column;
  justify-content: center;
`

const NavigationButtons = styled(Box)`
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
`

const ImageGrid = styled(Box)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;

  & img {
    aspect-ratio: 1;
  }
`

export default WizardPage
