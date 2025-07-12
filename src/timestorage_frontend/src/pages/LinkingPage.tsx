import { FC, useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { internalApiClient } from '@/services/apiClient'
import Header from '@/components/Header'
import LoadingView from '@/components/LoadingView'
import ErrorView from '@/components/ErrorView'
import { toastService } from '@/services/toastService'
import { useTranslation } from '@/hooks/useTranslation'
import { Link } from 'lucide-react'

interface ProjectPosition {
  id: string
  positionNumber: number
  sequenceNumber: number
  buildingFloor: string | null
  description: string
  assetModelId: string
  width: number | null
  height: number | null
  notes: string | null
  projectId: string
  qrTagId: string | null
  tenantId: string
  createdAt: string
  updatedAt: string
  assetModel?: {
    id: string
    name: string
    type: string
    brand: string
    model: string
  }
  qrTag?: {
    id: string
    serialNo: string
    sequence: number
    year: number
    clientCode: string
    status: string
  }
}

interface QrTag {
  id: string
  serialNo: string
  sequence: number
  year: number
  clientCode: string
  status: string
  issueDate: string
  issuer: string
  structure?: Record<string, unknown>
  data?: Record<string, unknown>
  projectId?: string | null
  assetModelId?: string
  tenantId: string
  createdAt: string
  updatedAt: string
  assetModel?: {
    id: string
    name: string
    type: string
    brand: string
    model: string
  }
}

interface Project {
  id: string
  projectNumber: string
  projectDate: string
  customerLastName: string
  customerFirstName: string
  businessName: string
  address: string
  zip: string
  city: string
  province: string
  country: string
  buildingType: string
  referenceFirstName: string | null
  referenceLastName: string | null
  email: string
  phoneNumber: string | null
  documents: unknown[]
  status: string
  tenantId: string
  createdAt: string
  updatedAt: string
}

const LinkingPage: FC = () => {
  const navigate = useNavigate()
  const { projectId, positionId: pathPositionId, qrTagId: pathQrTagId } = useParams<{ 
    projectId: string
    positionId?: string
    qrTagId?: string 
  }>()
  const [searchParams] = useSearchParams()
  const { user, isInstaller, isAuthenticated } = useAuthStore()
  const { t } = useTranslation()

  // Get optional parameters from either path or query parameters (path takes precedence)
  const positionId = pathPositionId || searchParams.get('positionId')
  const qrTagId = pathQrTagId || searchParams.get('qrTagId')

  // State
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [positions, setPositions] = useState<ProjectPosition[]>([])
  const [qrTags, setQrTags] = useState<QrTag[]>([])
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(positionId)
  const [selectedQrTagId, setSelectedQrTagId] = useState<string | null>(qrTagId)
  const [isLinking, setIsLinking] = useState(false)
  const [isUnlinking, setIsUnlinking] = useState(false)
  const [linkingError, setLinkingError] = useState<string | null>(null)

  // Authentication check
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    // Check if user has installer role (optional protection)
    if (user && !isInstaller) {
      navigate('/go')
      return
    }
  }, [isAuthenticated, user, isInstaller, navigate])

  // Define loadData with useCallback to avoid dependency warning
  const loadData = useCallback(async () => {
    if (!projectId) return

    try {
      setLoading(true)
      setError(null)

      // Load project, positions, and QR tags in parallel
      const [projectResponse, positionsResponse, qrTagsResponse] = await Promise.all([
        internalApiClient.get<Project>(`/projects/${projectId}`),
        internalApiClient.get<ProjectPosition[]>(`/project-positions/by-project/${projectId}`),
        internalApiClient.get<QrTag[]>(`/qrtags`)
      ])

      setProject(projectResponse.data)
      setPositions(positionsResponse.data)
      setQrTags(qrTagsResponse.data)
    } catch (err) {
      console.error('Failed to load data:', err)
      setError(err instanceof Error ? err.message : t('LINKING_FAILED_TO_LOAD_DATA'))
    } finally {
      setLoading(false)
    }
  }, [projectId])

  // Load data
  useEffect(() => {
    if (!projectId) {
      setError(t('LINKING_PROJECT_ID_REQUIRED'))
      setLoading(false)
      return
    }

    loadData()
  }, [projectId, loadData])

  const handleLink = async () => {
    if (!selectedPositionId || !selectedQrTagId) {
      const errorMessage = t('LINKING_SELECT_BOTH_POSITION_AND_QR_TAG')
      setLinkingError(errorMessage)
      toastService.warning(errorMessage)
      return
    }

    try {
      setIsLinking(true)
      setLinkingError(null)

      // Link QR tag to the specific position using the new API
      await internalApiClient.patch(`/project-positions/${selectedPositionId}/link-qrtag/${selectedQrTagId}`)

      // Update local state instead of refetching all data
      const selectedQrTag = qrTags.find(tag => tag.id === selectedQrTagId)
      if (selectedQrTag) {
        // Update the position with the linked QR tag
        setPositions(prevPositions => 
          prevPositions.map(position => 
            position.id === selectedPositionId 
              ? { 
                  ...position, 
                  qrTagId: selectedQrTagId,
                  qrTag: {
                    id: selectedQrTag.id,
                    serialNo: selectedQrTag.serialNo,
                    sequence: selectedQrTag.sequence,
                    year: selectedQrTag.year,
                    clientCode: selectedQrTag.clientCode,
                    status: selectedQrTag.status
                  }
                }
              : position
          )
        )
      }
      
      // Clear selections and error after successful link
      setSelectedPositionId(null)
      setSelectedQrTagId(null)
      setLinkingError(null)
      
      // Show success toast
      toastService.success(t('LINKING_QR_TAG_LINKED_SUCCESS'))
    } catch (err) {
      console.error('Failed to link QR tag:', err)
      const errorMessage = err instanceof Error ? err.message : t('LINKING_FAILED_TO_LINK_QR_TAG')
      setLinkingError(errorMessage)
      toastService.error(errorMessage)
    } finally {
      setIsLinking(false)
    }
  }

  const handleUnlink = async (position: ProjectPosition) => {
    try {
      setIsUnlinking(true)
      setLinkingError(null)

      // Unlink QR tag from the specific position
      await internalApiClient.patch(`/project-positions/${position.id}/unlink-qrtag`)

      // Update local state instead of refetching all data
      setPositions(prevPositions => 
        prevPositions.map(pos => 
          pos.id === position.id 
            ? { ...pos, qrTagId: null, qrTag: undefined }
            : pos
        )
      )
      
      // Clear error after successful unlink
      setLinkingError(null)
      
      // Show success toast
      toastService.success(t('LINKING_QR_TAG_UNLINKED_SUCCESS'))
    } catch (err) {
      console.error('Failed to unlink QR tag:', err)
      const errorMessage = err instanceof Error ? err.message : t('LINKING_FAILED_TO_UNLINK_QR_TAG')
      setLinkingError(errorMessage)
      toastService.error(errorMessage)
    } finally {
      setIsUnlinking(false)
    }
  }

  if (loading) {
    return <LoadingView message={t('LINKING_LOADING_DATA')} />
  }

  if (error) {
    return <ErrorView message={error} />
  }

  if (!project) {
    return <ErrorView message={t('LINKING_PROJECT_NOT_FOUND')} />
  }

  // Filter QR tags - show unassigned ones (not linked to any position)
  const positionsWithQrTags = positions.filter(position => position.qrTag)
  const unassignedQrTags = qrTags.filter(tag => 
    !positions.some(position => position.qrTagId === tag.id)
  )

  const selectedPosition = positions.find(p => p.id === selectedPositionId)
  const selectedQrTag = qrTags.find(q => q.id === selectedQrTagId)

  return (
    <div className="min-h-screen bg-base-200">
      <Header title={t('LINKING_PAGE_TITLE')} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Project Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{project.projectNumber}</h1>
          <p className="text-lg text-base-content/70 mb-2">{project.businessName}</p>
          <p className="text-base-content/60">{project.address}, {project.city}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Position Selection */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">
                <span>{t('LINKING_SELECT_POSITION')}</span>
                {selectedPosition && (
                  <div className="badge badge-primary">{t('LINKING_SELECTED')}</div>
                )}
              </h2>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">{t('LINKING_PROJECT_POSITIONS')}</span>
                </label>
                <select 
                  className="select select-bordered w-full"
                  value={selectedPositionId || ''}
                  onChange={(e) => setSelectedPositionId(e.target.value || null)}
                >
                  <option value="">{t('LINKING_CHOOSE_POSITION')}</option>
                  {positions.map(position => (
                    <option key={position.id} value={position.id}>
                      #{position.positionNumber} - {position.description}
                      {position.buildingFloor && ` (${t('LINKING_FLOOR')}: ${position.buildingFloor})`}
                    </option>
                  ))}
                </select>
              </div>

              {selectedPosition && (
                <div className="mt-4 p-4 bg-base-200 rounded-lg">
                  <h3 className="font-semibold mb-2">{t('LINKING_POSITION_DETAILS')}</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>{t('LINKING_POSITION_NUMBER')}:</strong> {selectedPosition.positionNumber}</p>
                    <p><strong>{t('LINKING_SEQUENCE_NUMBER')}:</strong> {selectedPosition.sequenceNumber}</p>
                    {selectedPosition.buildingFloor && (
                      <p><strong>{t('LINKING_FLOOR')}:</strong> {selectedPosition.buildingFloor}</p>
                    )}
                    <p><strong>{t('LINKING_DESCRIPTION')}:</strong> {selectedPosition.description}</p>
                    {selectedPosition.assetModel && (
                      <p><strong>{t('LINKING_ASSET')}:</strong> {selectedPosition.assetModel.brand} {selectedPosition.assetModel.model}</p>
                    )}
                    {selectedPosition.width && selectedPosition.height && (
                      <p><strong>{t('LINKING_DIMENSIONS')}:</strong> {selectedPosition.width} x {selectedPosition.height}</p>
                    )}
                    {selectedPosition.notes && (
                      <p><strong>{t('LINKING_NOTES')}:</strong> {selectedPosition.notes}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* QR Tag Selection */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">
                <span>{t('LINKING_SELECT_QR_TAG')}</span>
                {selectedQrTag && (
                  <div className="badge badge-primary">{t('LINKING_SELECTED')}</div>
                )}
              </h2>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">{t('LINKING_AVAILABLE_QR_TAGS')}</span>
                </label>
                <select 
                  className="select select-bordered w-full"
                  value={selectedQrTagId || ''}
                  onChange={(e) => setSelectedQrTagId(e.target.value || null)}
                >
                  <option value="">{t('LINKING_CHOOSE_QR_TAG')}</option>
                  {unassignedQrTags.map(qrTag => (
                    <option key={qrTag.id} value={qrTag.id}>
                      {qrTag.serialNo} - {qrTag.status}
                      {qrTag.assetModel && ` (${qrTag.assetModel.name})`}
                    </option>
                  ))}
                </select>
              </div>

              {selectedQrTag && (
                <div className="mt-4 p-4 bg-base-200 rounded-lg">
                  <h3 className="font-semibold mb-2">{t('LINKING_QR_TAG_DETAILS')}</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>{t('LINKING_SERIAL_NO')}:</strong> {selectedQrTag.serialNo}</p>
                    <p><strong>{t('LINKING_STATUS')}:</strong> 
                      <span className={`ml-2 badge ${
                        selectedQrTag.status === 'COMPLETED' ? 'badge-success' :
                        selectedQrTag.status === 'PROCESSING' ? 'badge-warning' :
                        'badge-neutral'
                      }`}>
                        {selectedQrTag.status}
                      </span>
                    </p>
                    <p><strong>{t('LINKING_SEQUENCE')}:</strong> {selectedQrTag.sequence}</p>
                    <p><strong>{t('LINKING_YEAR')}:</strong> {selectedQrTag.year}</p>
                    <p><strong>{t('LINKING_CLIENT_CODE')}:</strong> {selectedQrTag.clientCode}</p>
                    {selectedQrTag.assetModel && (
                      <p><strong>{t('LINKING_ASSET_MODEL')}:</strong> {selectedQrTag.assetModel.brand} {selectedQrTag.assetModel.model}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            className="btn btn-primary btn-lg"
            onClick={handleLink}
            disabled={!selectedPositionId || !selectedQrTagId || isLinking}
          >
            {isLinking && <span className="loading loading-spinner"></span>}
            <Link className="w-5 h-5" />
{t('LINKING_LINK_QR_TAG_TO_POSITION')}
          </button>
        </div>

        {linkingError && (
          <div className="alert alert-error mt-4">
            <span>{linkingError}</span>
          </div>
        )}

        {/* Positions with Linked QR Tags */}
        {positionsWithQrTags.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">{t('LINKING_POSITIONS_WITH_LINKED_QR_TAGS')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {positionsWithQrTags.map(position => (
                <div key={position.id} className="card bg-base-100 shadow-lg">
                  <div className="card-body">
                    <h3 className="card-title text-lg">{t('LINKING_POSITION_NUMBER')} {position.positionNumber}</h3>
                    <div className="space-y-1 text-sm mb-4">
                      <p><strong>{t('LINKING_DESCRIPTION')}:</strong> {position.description}</p>
                      {position.buildingFloor && (
                        <p><strong>{t('LINKING_FLOOR')}:</strong> {position.buildingFloor}</p>
                      )}
                      {position.assetModel && (
                        <p><strong>{t('LINKING_ASSET')}:</strong> {position.assetModel.brand} {position.assetModel.model}</p>
                      )}
                    </div>
                    
                    {position.qrTag && (
                      <div className="border-t pt-4">
                        <h4 className="font-semibold text-primary mb-2">{t('LINKING_LINKED_QR_TAG')}</h4>
                        <div className="space-y-1 text-sm">
                          <p><strong>{t('LINKING_SERIAL_NO')}:</strong> {position.qrTag.serialNo}</p>
                          <p><strong>{t('LINKING_STATUS')}:</strong> 
                            <span className={`ml-2 badge badge-sm ${
                              position.qrTag.status === 'COMPLETED' ? 'badge-success' :
                              position.qrTag.status === 'PROCESSING' ? 'badge-warning' :
                              'badge-neutral'
                            }`}>
                              {position.qrTag.status}
                            </span>
                          </p>
                          <p><strong>{t('LINKING_SEQUENCE')}:</strong> {position.qrTag.sequence}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="card-actions justify-end mt-4">
                      <button
                        className="btn btn-error btn-sm"
                        onClick={() => handleUnlink(position)}
                        disabled={isUnlinking}
                      >
                        {isUnlinking && <span className="loading loading-spinner loading-xs"></span>}
                        {t('LINKING_UNLINK_QR_TAG')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default LinkingPage