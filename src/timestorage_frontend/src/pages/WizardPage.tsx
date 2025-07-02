import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Motion } from '../components/ui/motion'

// Shadcn/UI components
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Progress } from '../components/ui/progress'
import { Label } from '../components/ui/label'
import { Select } from '../components/ui/select'
import { Container } from '../components/ui/container'
import { Typography } from '../components/ui/typography'

// Icons
import { ArrowRight, ArrowLeft, Camera, Trash, ImagePlus } from 'lucide-react'

// Custom components
import BottomNavigation from '../components/BottomNavigation'
import { useData } from '../context/DataContext'
import ErrorView from '../components/ErrorView'
import LoadingView from '../components/LoadingView'
import { fileToBase64, getFileMetadata } from '../utils/fileUtils'
import * as canisterService from '../services/canisterService'
import { IWizardQuestion } from '@/types/structures'
import Header from '@/components/Header'

interface WizardState {
  currentQuestionIndex: number
  answers: Record<string, string | string[]>
  isCompleted: boolean
}

const WizardPage = () => {
  const navigate = useNavigate()
  const { uuid, getWizardQuestions, data } = useData()
  const { sectionId } = useParams<{ sectionId: string }>()
  const [availableWizards, setAvailableWizards] = useState<{ id: string; title: string }[]>([])
  const [selectedWizard, setSelectedWizard] = useState<string | null>(sectionId || null)
  const [questions, setQuestions] = useState<IWizardQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [animationDirection, setAnimationDirection] = useState(1)

  // Effect to find all available wizard sections when data is loaded
  useEffect(() => {
    if (data) {
      const wizards = Object.entries(data.nodes)
        .filter(([_, section]) => section.isWizard)
        .map(([key, section]) => ({ id: key, title: section.title }))

      setAvailableWizards(wizards)

      // If no wizard is selected and we have wizards available, select the first one
      if (!selectedWizard && wizards.length > 0) {
        setSelectedWizard(wizards[0].id)
      }
    }
  }, [data, selectedWizard])

  const storageKey = `window_installation_wizard_${uuid}_${selectedWizard}`

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

  const processKey = (key: string): string => {
    // Remove the #/values/ prefix and replace / with .
    return key.replace('#/values/', '').replace(/\//g, '.')
  }

  const handleFileUpload = async (file: File): Promise<string> => {
    try {
      const base64Data = await fileToBase64(file)
      const metadata = getFileMetadata(file)
      const result = await canisterService.uploadFile(uuid, base64Data, metadata)
      const fileId = result.match(/ID: (file-\d+)/)?.[1]
      if (!fileId) {
        throw new Error('Failed to extract file ID from response')
      }
      return fileId
    } catch (error) {
      console.error('Error uploading file:', error)
      throw error
    }
  }

  const handlePhotoCapture = async (event: React.ChangeEvent<HTMLInputElement>, multiple: boolean) => {
    if (!currentQuestion) return
    const files = event.target.files
    if (!files) return

    try {
      const fileIds = await Promise.all(
        Array.from(files).map(async file => {
          return await handleFileUpload(file)
        })
      )

      setState(prev => ({
        ...prev,
        answers: {
          ...prev.answers,
          [currentQuestion.id]: multiple ? fileIds : fileIds[0]
        }
      }))
    } catch (error) {
      console.error('Error processing photos:', error)
      setError(error instanceof Error ? error.message : 'Failed to upload photos')
    }
  }

  const handleWizardCompletion = async () => {
    try {
      setSaving(true) // Start saving
      setLoading(true)

      // Process each answer and submit it
      const submissions = Object.entries(state.answers).map(([questionId, answer]) => {
        // Find the corresponding question to get the refId
        const question = questions.find(q => q.id === questionId)
        if (!question?.refId) return null

        // Process the key
        const processedKey = processKey(question.refId)

        // Handle different types of answers
        let processedValue = ''
        if (Array.isArray(answer)) {
          // For multiselect or photo arrays, join with commas
          processedValue = answer.join(',')
        } else if (typeof answer === 'string') {
          processedValue = answer
        }

        return { key: processedKey, value: processedValue }
      })

      // Filter out null values and submit each answer
      for (const submission of submissions.filter(Boolean)) {
        if (submission) {
          await canisterService.updateValue(uuid, submission.key, submission.value, true)
        }
      }

      // Set completion state and navigate
      setState(prev => ({ ...prev, isCompleted: true }))
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to submit answers')
    } finally {
      setLoading(false)
      setSaving(false)
    }
  }

  // Changed to use selectedWizard for fetching questions
  useEffect(() => {
    const loadQuestions = async () => {
      if (!selectedWizard) return

      try {
        setLoading(true)
        const questionData = await getWizardQuestions(selectedWizard)
        setQuestions(questionData)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load questions')
      } finally {
        setLoading(false)
      }
    }

    loadQuestions()
  }, [getWizardQuestions, selectedWizard])

  // Reset state when changing wizards
  useEffect(() => {
    if (selectedWizard) {
      const saved = localStorage.getItem(storageKey)
      setState(
        saved
          ? JSON.parse(saved)
          : {
              currentQuestionIndex: 0,
              answers: {},
              isCompleted: false
            }
      )
    }
  }, [selectedWizard, storageKey])

  useEffect(() => {
    if (state.isCompleted) {
      navigate(`/${uuid}`)
    }
    if (selectedWizard) {
      localStorage.setItem(storageKey, JSON.stringify(state))
    }
  }, [state, navigate, storageKey, uuid, selectedWizard])

  if (saving) {
    return <LoadingView message='Saving your answers...' />
  }

  if (loading && questions.length === 0) {
    return <LoadingView message='Loading installation wizard...' />
  }

  if (error) {
    return <ErrorView message={error} />
  }

  if (!selectedWizard) {
    return (
      <div className='min-h-screen '>
        <Header title={`PosaCheck - ${uuid}`} showMenu={true} />

        {loading && <LoadingView message='Loading wizard...' />}

        {error && <ErrorView message={error} />}

        {!loading && !error && !selectedWizard && availableWizards.length > 0 && (
          <Container maxWidth='sm' className='py-4'>
            <Motion variant='fadeIn'>
              <Typography variant='h5' className='mb-3'>
                Select an installation wizard
              </Typography>
              <div className='space-y-2'>
                {availableWizards.map(wizard => (
                  <Button
                    key={wizard.id}
                    variant='outline'
                    className='w-full mb-1'
                    onClick={() => setSelectedWizard(wizard.id)}
                  >
                    {wizard.title}
                  </Button>
                ))}
              </div>
            </Motion>
          </Container>
        )}
        <BottomNavigation />
      </div>
    )
  }

  const currentQuestion = questions[state.currentQuestionIndex]
  const handleNext = () => {
    if (state.currentQuestionIndex === questions.length - 1) {
      handleWizardCompletion()
      return
    }
    setState(prev => ({
      ...prev,
      currentQuestionIndex: Math.min(prev.currentQuestionIndex + 1, questions.length - 1)
    }))
  }

  const handlePrevious = () => {
    setAnimationDirection(-1)
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

  const handleRemovePhoto = (questionId: string) => {
    setState(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: Array.isArray(prev.answers[questionId]) ? [] : ''
      }
    }))
  }

  const renderQuestion = () => {
    switch (currentQuestion.type) {
      case 'text':
        return (
          <div className='mb-4'>
            <Label htmlFor={`question-${currentQuestion.id}`} className='mb-2'>
              {currentQuestion.question || 'Your answer'}
            </Label>
            <Input
              id={`question-${currentQuestion.id}`}
              className='w-full'
              placeholder='Enter your answer'
              value={state.answers[currentQuestion.id] || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAnswer(e.target.value)}
            />
          </div>
        )

      case 'select':
        return (
          <div className='mb-4'>
            <Label htmlFor={`dropdown-${currentQuestion.id}`} className='mb-2'>
              {currentQuestion.question || 'Select an option'}
            </Label>
            <Select
              value={
                typeof state.answers[currentQuestion.id] === 'string'
                  ? (state.answers[currentQuestion.id] as string)
                  : ''
              }
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleAnswer(e.target.value)}
              placeholder='Select an option'
              id={`dropdown-${currentQuestion.id}`}
            >
              {currentQuestion.options?.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </div>
        )

      case 'photo':
        return (
          <div className='mb-4'>
            <input
              type='file'
              accept='image/*'
              id='photo-upload'
              className='hidden'
              onChange={e => handlePhotoCapture(e, false)}
            />
            <div className='flex flex-wrap gap-2 mb-3'>
              <label htmlFor='photo-upload'>
                <Button
                  variant='primary'
                  className='cursor-pointer flex items-center gap-2'
                  disabled={!!state.answers[currentQuestion.id]}
                >
                  <Camera className='h-4 w-4' />
                  Take Photo
                </Button>
              </label>

              {state.answers[currentQuestion.id] && (
                <Button
                  variant='secondary'
                  className='flex items-center gap-2'
                  onClick={() => handleRemovePhoto(currentQuestion.id)}
                >
                  <Trash className='h-4 w-4' />
                  Remove
                </Button>
              )}
            </div>

            {state.answers[currentQuestion.id] && (
              <div className='mt-2 p-2 bg-muted rounded'>
                <Typography variant='body2' className='text-muted-foreground'>
                  Photo ID: {state.answers[currentQuestion.id]}
                </Typography>
              </div>
            )}
          </div>
        )

      case 'multiphoto':
        return (
          <div className='mb-4'>
            <input
              type='file'
              accept='image/*'
              multiple
              id='multi-photo-upload'
              className='hidden'
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePhotoCapture(e, true)}
            />
            <label htmlFor='multi-photo-upload'>
              <Button variant='primary' className='cursor-pointer flex items-center gap-2'>
                <ImagePlus className='h-4 w-4' />
                Add Photos
              </Button>
            </label>

            {Array.isArray(state.answers[currentQuestion.id]) && state.answers[currentQuestion.id].length > 0 && (
              <Motion variant='fadeIn' className='mt-3 p-3 bg-base-200 rounded-lg'>
                <Typography variant='body2' className='text-muted-foreground'>
                  {(state.answers[currentQuestion.id] as string[]).length} photo(s) uploaded
                </Typography>
                <div className='mt-2 space-y-1'>
                  {(state.answers[currentQuestion.id] as string[]).map((photoId: string, index: number) => (
                    <Typography key={photoId} variant='caption' className='block'>
                      Photo {index + 1}: {photoId}
                    </Typography>
                  ))}
                </div>
                <Button
                  variant='outline'
                  onClick={handlePrevious}
                  className='flex items-center gap-1'
                  disabled={state.currentQuestionIndex === 0}
                >
                  <Trash className='h-4 w-4' />
                  Clear All
                </Button>
              </Motion>
            )}
          </div>
        )
      default:
        return null
    }
  }

  const wizardTitle = data?.nodes?.[selectedWizard]?.title || 'Guida alla posa'

  return (
    <div className='min-h-screen '>
      <Header title={wizardTitle} />

      {loading && <LoadingView message='Loading wizard...' />}

      {error && <ErrorView message={error} />}

      {!loading && !error && selectedWizard && questions.length > 0 && currentQuestion && (
        <Container maxWidth='sm' className='pb-10 pt-2'>
          <div className='w-full'>
            <Motion
              key={state.currentQuestionIndex}
              variant={animationDirection > 0 ? 'slideInRight' : 'slideInLeft'}
              className='w-full'
            >
              <Progress value={((state.currentQuestionIndex + 1) / questions.length) * 100} className='mb-3' />
              <Typography variant='body2' className='mb-2 text-muted-foreground'>
                Question {state.currentQuestionIndex + 1} of {questions.length}
              </Typography>

              <div className='mb-6'>
                <Typography variant='h6' className='mb-3'>
                  {currentQuestion.question || 'Answer the question'}
                </Typography>
                {renderQuestion()}

                <div className='flex justify-between mt-6'>
                  <Button
                    variant='outline'
                    disabled={state.currentQuestionIndex === 0}
                    onClick={handlePrevious}
                    className='flex items-center gap-1'
                  >
                    <ArrowLeft className='h-4 w-4' />
                    Back
                  </Button>

                  <Button
                    variant={state.currentQuestionIndex === questions.length - 1 ? 'primary' : 'outline'}
                    onClick={state.currentQuestionIndex === questions.length - 1 ? handleWizardCompletion : handleNext}
                    className='flex items-center gap-1'
                  >
                    {state.currentQuestionIndex === questions.length - 1 ? 'Complete' : 'Next'}
                    {state.currentQuestionIndex !== questions.length - 1 && <ArrowRight className='h-4 w-4' />}
                  </Button>
                </div>
              </div>
            </Motion>
          </div>
        </Container>
      )}
      <BottomNavigation />
    </div>
  )
}

export default WizardPage
