import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Motion } from '../components/ui/motion'

// Icons
import { ArrowRight, ArrowLeft, Camera, Trash, ImagePlus } from 'lucide-react'

// Custom components
import BottomNavigation from '../components/BottomNavigation'
import { useData } from '../context/DataContext'
import ErrorView from '../components/ErrorView'
import LoadingView from '../components/LoadingView'
import { fileToBase64, getFileMetadata } from '../utils/fileUtils'

import { IWizardQuestion } from '@/types/structures'
import Header from '@/components/Header'
import { useTranslation } from '../hooks/useTranslation'

interface WizardState {
  currentQuestionIndex: number;
  answers: Record<string, string | string[]>;
  isCompleted: boolean;
}

interface StagedFiles {
  [questionId: string]: File | File[];
}

const WizardPage = () => {
  const navigate = useNavigate()
  const { uuid, sectionId } = useParams<{ uuid: string; sectionId: string }>()
  const { data, isLoading, error: hookError, uuid: resolvedUuid, service } = useData(uuid)
  const { t } = useTranslation()
  const [availableWizards, setAvailableWizards] = useState<{ id: string; title: string }[]>([])
  const [selectedWizard, setSelectedWizard] = useState<string | null>(sectionId || null)
  const [questions, setQuestions] = useState<IWizardQuestion[]>([])
  const [error, setError] = useState<string | null>(null)
  const [stagedFiles, setStagedFiles] = useState<StagedFiles>({})
  const [previewUrls, setPreviewUrls] = useState<Record<string, string | string[]>>({})
  const [isUploading, setIsUploading] = useState(false)

  const [saving, setSaving] = useState(false)

  // Effect to find all available wizard sections and load questions when data is loaded
  useEffect(() => {
    if (data && data.nodes) {
      const wizards = Object.entries(data.nodes)
        .filter(([_, section]) => section.isWizard)
        .map(([key, section]) => ({ id: key, title: section.title }))

      setAvailableWizards(wizards)

      // If no wizard is selected and we have wizards available, select the first one
      if (!selectedWizard && wizards.length > 0) {
        setSelectedWizard(wizards[0].id)
      }

      // Load questions for the selected wizard
      if (selectedWizard && data.nodes[selectedWizard]?.isWizard) {
        const wizardNode = data.nodes[selectedWizard]
        setQuestions(wizardNode.questions || [])
        setError(null)
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
          isCompleted: false,
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
      const result = await service.uploadFile(resolvedUuid, base64Data, metadata)
      const fileId = (result as string).match(/ID: (file-\d+)/)?.[1]
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

    const newFiles = Array.from(files)
    setStagedFiles((prev) => ({
      ...prev,
      [currentQuestion.id]: multiple ? newFiles : newFiles[0],
    }))

    const urls = newFiles.map((file) => URL.createObjectURL(file))
    setPreviewUrls((prev) => ({
      ...prev,
      [currentQuestion.id]: multiple ? urls : urls[0],
    }))
  }

  const handleNextClick = async () => {
    if (stagedFiles[currentQuestion.id]) {
      const filesToUpload = stagedFiles[currentQuestion.id]
      try {
        setIsUploading(true)
        if (Array.isArray(filesToUpload)) {
          const fileIds = await Promise.all(filesToUpload.map((file) => handleFileUpload(file)))
          handleAnswer(fileIds)
        } else {
          const fileId = await handleFileUpload(filesToUpload)
          handleAnswer(fileId)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to upload file')
        setIsUploading(false)
        return
      } finally {
        setIsUploading(false)
      }
    }

    if (state.currentQuestionIndex === questions.length - 1) {
      handleWizardCompletion()
      return
    }
    setState((prev) => ({
      ...prev,
      currentQuestionIndex: Math.min(prev.currentQuestionIndex + 1, questions.length - 1),
    }))
  }

  const handleWizardCompletion = async () => {
    try {
      setSaving(true) // Start saving

      // Process each answer and submit it
      const submissions = Object.entries(state.answers).map(([questionId, answer]) => {
        // Find the corresponding question to get the refId
        const question = questions.find((q) => q.id === questionId)
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
          await service.updateValue(resolvedUuid, submission.key, submission.value, true)
        }
      }

      // Set completion state and navigate
      setState((prev) => ({ ...prev, isCompleted: true }))
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to submit answers')
    } finally {
      setSaving(false)
    }
  }


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
              isCompleted: false,
            },
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
    return <LoadingView message={t('WIZARD_SAVING_ANSWERS')} />
  }

  if (isLoading && !data) {
    return <LoadingView message={t('WIZARD_LOADING')} />
  }

  if (hookError) {
    return <ErrorView message={hookError} />
  }

  if (error) {
    return <ErrorView message={error} />
  }

  const currentQuestion = questions[state.currentQuestionIndex]

  const handlePrevious = () => {
    setState((prev) => ({
      ...prev,
      currentQuestionIndex: Math.max(0, prev.currentQuestionIndex - 1),
    }))
  }

  const handleAnswer = (value: string | string[]) => {
    setState((prev) => ({
      ...prev,
      answers: {
        ...prev.answers,
        [currentQuestion.id]: value,
      },
    }))
  }

  const renderQuestion = () => {
    if (!currentQuestion) return null

    return (
      <div className="card bg-base-100 shadow-xl w-full max-w-lg">
        <div className="card-body">
          <h2 className="card-title text-2xl font-bold mb-4">{t(currentQuestion.question) || t('WIZARD_ANSWER_QUESTION')}</h2>
          {(() => {
            switch (currentQuestion.type) {
              case 'text':
                return (
                  <div className="form-control w-full">
                    <label className="label mb-2">
                      <span className="label-text">{t(currentQuestion.question) || t('WIZARD_YOUR_ANSWER')}</span>
                    </label>
                    <input
                      type="text"
                      placeholder={t('WIZARD_ENTER_ANSWER')}
                      className="input input-bordered w-full input-persistent-border"
                      value={state.answers[currentQuestion.id] || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAnswer(e.target.value)}
                    />
                  </div>
                )

              case 'select':
                return (
                  <div className="form-control w-full">
                    <label className="label mb-2">
                      <span className="label-text">{t(currentQuestion.question) || t('WIZARD_SELECT_OPTION')}</span>
                    </label>
                    <select
                      className="select select-bordered select-lg w-full select-persistent-border"
                      value={
                        typeof state.answers[currentQuestion.id] === 'string'
                          ? (state.answers[currentQuestion.id] as string)
                          : ''
                      }
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleAnswer(e.target.value)}
                    >
                      <option disabled value="">
                        {t('WIZARD_SELECT_OPTION')}
                      </option>
                      {currentQuestion.options?.map((option) => (
                        <option key={option} value={option}>
                          {t(option)}
                        </option>
                      ))}
                    </select>
                  </div>
                )

              case 'multiselect':
                return (
                  <div className="form-control w-full">
                    <label className="label mb-2">
                      <span className="label-text">{t(currentQuestion.question) || t('WIZARD_SELECT_OPTIONS')}</span>
                    </label>
                    <div className="flex flex-col space-y-2">
                      {currentQuestion.options?.map((option) => (
                        <label key={option} className="label cursor-pointer">
                          <input
                            type="checkbox"
                            className="checkbox checkbox-primary"
                            checked={
                              Array.isArray(state.answers[currentQuestion.id]) &&
                              (state.answers[currentQuestion.id] as string[]).includes(option)
                            }
                            onChange={(e) => {
                              const currentAnswers = (state.answers[currentQuestion.id] as string[]) || []
                              if (e.target.checked) {
                                handleAnswer([...currentAnswers, option])
                              } else {
                                handleAnswer(currentAnswers.filter((ans) => ans !== option))
                              }
                            }}
                          />
                          <span className="label-text">{t(option)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )

              case 'photo':
                return (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      id="photo-upload"
                      className="hidden"
                      onChange={(e) => handlePhotoCapture(e, false)}
                    />
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      id="camera-upload"
                      className="hidden"
                      onChange={(e) => handlePhotoCapture(e, false)}
                    />
                    <div className="flex flex-wrap gap-2 mb-3">
                      <button
                        className="btn btn-primary"
                        onClick={() => document.getElementById('camera-upload')?.click()}
                      >
                        <Camera className="h-4 w-4" />
                        {t('WIZARD_TAKE_PHOTO')}
                      </button>
                      <label htmlFor="photo-upload">
                        <button
                          className="btn btn-info"
                          onClick={() => document.getElementById('photo-upload')?.click()}
                        >
                          <ImagePlus className="h-4 w-4" />
                          {t('WIZARD_CHOOSE_PHOTO')}
                        </button>
                      </label>
                    </div>

                    {previewUrls[currentQuestion.id] && (
                      <div className="mt-2 p-2 bg-muted rounded">
                        <img
                          src={previewUrls[currentQuestion.id] as string}
                          alt="Preview"
                          className="max-w-full h-auto rounded"
                        />
                        <button
                          className="btn btn-xs btn-error mt-2"
                          onClick={() => {
                            const newStagedFiles = { ...stagedFiles }
                            delete newStagedFiles[currentQuestion.id]
                            setStagedFiles(newStagedFiles)

                            const newPreviewUrls = { ...previewUrls }
                            delete newPreviewUrls[currentQuestion.id]
                            setPreviewUrls(newPreviewUrls)
                          }}
                        >
                          <Trash className="h-3 w-3" />
                          {t('WIZARD_REMOVE')}
                        </button>
                      </div>
                    )}
                  </div>
                )

              case 'multiphoto':
                return (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      id="multi-photo-upload"
                      className="hidden"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePhotoCapture(e, true)}
                    />
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      capture="environment"
                      id="multi-camera-upload"
                      className="hidden"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePhotoCapture(e, true)}
                    />
                    <div className="flex flex-wrap gap-2 mb-3">
                      <button
                        className="btn btn-primary"
                        onClick={() => document.getElementById('multi-camera-upload')?.click()}
                      >
                        <Camera className="h-4 w-4" />
                        {t('WIZARD_TAKE_PHOTOS')}
                      </button>
                      <label htmlFor="multi-photo-upload">
                        <button
                          className="btn btn-info"
                          onClick={() => document.getElementById('multi-photo-upload')?.click()}
                        >
                          <ImagePlus className="h-4 w-4" />
                          {t('WIZARD_CHOOSE_PHOTOS')}
                        </button>
                      </label>
                    </div>

                    {Array.isArray(previewUrls[currentQuestion.id]) &&
                      (previewUrls[currentQuestion.id] as string[]).length > 0 && (
                        <div className="mt-3 p-3 bg-base-200 rounded-lg">
                          <p className="text-sm text-muted-foreground">
                            {(previewUrls[currentQuestion.id] as string[]).length} {t('WIZARD_PHOTOS_STAGED')}
                          </p>
                          <div className="mt-2 flex overflow-x-auto gap-2">
                            {(previewUrls[currentQuestion.id] as string[]).map((url: string, index: number) => (
                              <div key={url} className="relative flex-shrink-0">
                                <img src={url} alt={`Preview ${index + 1}`} className="w-32 h-32 object-cover rounded" />
                                <button
                                  className="btn btn-xs btn-error absolute top-1 right-1"
                                  onClick={() => {
                                    const newStagedFiles = [...(stagedFiles[currentQuestion.id] as File[])]
                                    newStagedFiles.splice(index, 1)
                                    setStagedFiles((prev) => ({
                                      ...prev,
                                      [currentQuestion.id]: newStagedFiles,
                                    }))

                                    const newPreviewUrls = [...(previewUrls[currentQuestion.id] as string[])]
                                    newPreviewUrls.splice(index, 1)
                                    setPreviewUrls((prev) => ({
                                      ...prev,
                                      [currentQuestion.id]: newPreviewUrls,
                                    }))
                                  }}
                                >
                                  <Trash className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                          <button
                            className="btn btn-outline mt-2"
                            onClick={() => {
                              const newStagedFiles = { ...stagedFiles }
                              delete newStagedFiles[currentQuestion.id]
                              setStagedFiles(newStagedFiles)

                              const newPreviewUrls = { ...previewUrls }
                              delete newPreviewUrls[currentQuestion.id]
                              setPreviewUrls(newPreviewUrls)
                            }}
                          >
                            <Trash className="h-4 w-4" />
                            {t('WIZARD_CLEAR_ALL')}
                          </button>
                        </div>
                      )}
                  </div>
                )
              default:
                return null
            }
          })()}
        </div>
      </div>
    )
  }

  const wizardTitle = (selectedWizard && data?.nodes?.[selectedWizard]?.title) || 'Guida alla posa'

  return (
    <div className="min-h-screen bg-base-200">
      <Header title={t(wizardTitle)} />

      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center pb-24">
        {!isLoading && !error && selectedWizard && questions.length > 0 && (
          <>
            <div className="w-full max-w-4xl flex justify-center mb-8">
              <progress
                className="progress progress-primary w-56"
                value={(state.currentQuestionIndex / (questions.length - 1)) * 100}
                max="100"
              ></progress>
            </div>

            <Motion
              key={state.currentQuestionIndex}
              variant="fadeIn"
              className="w-full flex items-center justify-center"
            >
              {renderQuestion()}
            </Motion>

            <div className="flex justify-between mt-6 w-full max-w-lg">
              <button
                className="btn btn-neutral"
                disabled={state.currentQuestionIndex === 0}
                onClick={handlePrevious}
              >
                <ArrowLeft className="h-4 w-4" />
                {t('WIZARD_BACK')}
              </button>

              <button
                className={`btn ${
                  state.currentQuestionIndex === questions.length - 1 ? 'btn-success' : 'btn-primary'
                }`}
                onClick={handleNextClick}
                disabled={isUploading}
              >
                {isUploading && <span className="loading loading-spinner"></span>}
                {state.currentQuestionIndex === questions.length - 1 ? t('WIZARD_COMPLETE') : t('WIZARD_NEXT')}
                {state.currentQuestionIndex !== questions.length - 1 && <ArrowRight className="h-4 w-4" />}
              </button>
            </div>
          </>
        )}

        {!selectedWizard && availableWizards.length > 0 && (
          <div className="card bg-base-100 shadow-xl w-full max-w-lg">
            <div className="card-body">
              <h2 className="card-title text-2xl font-bold mb-4">{t('WIZARD_SELECT_WIZARD')}</h2>
              <div className="space-y-2">
                {availableWizards.map((wizard) => (
                  <button
                    key={wizard.id}
                    className="btn btn-outline w-full"
                    onClick={() => setSelectedWizard(wizard.id)}
                  >
                    {t(wizard.title)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  )
}

export default WizardPage
