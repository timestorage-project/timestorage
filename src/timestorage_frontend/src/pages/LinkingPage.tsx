import { FC, useState } from 'react'
import { useData } from '@/context/DataContext'
import Header from '@/components/Header'
import LoadingView from '@/components/LoadingView'
import ErrorView from '@/components/ErrorView'
import { useNavigate } from 'react-router-dom'

import { useTranslation } from '@/hooks/useTranslation'

const LinkingPage: FC = () => {
  const { project, isLoading, error } = useData()
  const [equipmentUuid, setEquipmentUuid] = useState('')
  const [isLinking, setIsLinking] = useState(false)
  const [linkingError, setLinkingError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { t } = useTranslation()

  const handleLinkEquipment = async () => {
    if (!project || !equipmentUuid) return

    setIsLinking(true)
    setLinkingError(null)

    try {
      navigate(`/view/${equipmentUuid}`)
    } catch (err) {
      setLinkingError(err instanceof Error ? err.message : 'Failed to link equipment')
    } finally {
      setIsLinking(false)
    }
  }

  if (isLoading) {
    return <LoadingView message={t('LOADING_PROJECT_DATA')} />
  }

  if (error) {
    return <ErrorView message={error} />
  }

  if (!project) {
    return <ErrorView message='Project data not found.' />
  }

  return (
    <div className='min-h-screen bg-base-200'>
      <Header title='Link Equipment' />
      <div className='container mx-auto px-4 py-8'>
        <h1 className='text-3xl font-bold mb-2'>{project.info.identification}</h1>
        <p className='text-lg text-base-content/70 mb-8'>{project.info.subIdentification}</p>

        <div className='card bg-base-100 shadow-xl w-full max-w-lg mx-auto'>
          <div className='card-body'>
            <h2 className='card-title'>Link Equipment to Project</h2>
            <p>Enter the UUID of the equipment you want to link to this project.</p>
            <div className='form-control mt-4'>
              <label className='label'>
                <span className='label-text'>Equipment UUID</span>
              </label>
              <input
                type='text'
                placeholder='Enter equipment UUID'
                className='input input-bordered w-full'
                value={equipmentUuid}
                onChange={(e) => setEquipmentUuid(e.target.value)}
              />
            </div>
            {linkingError && <p className='text-error mt-2'>{linkingError}</p>}
            <div className='card-actions justify-end mt-4'>
              <button
                className='btn btn-primary'
                onClick={handleLinkEquipment}
                disabled={isLinking || !equipmentUuid}
              >
                {isLinking && <span className='loading loading-spinner'></span>}
                Link Equipment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LinkingPage
