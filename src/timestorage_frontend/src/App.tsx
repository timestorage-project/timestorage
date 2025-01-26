import { FC } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import DetailPage from './pages/DetailPage'
import WizardPage from './pages/WizardPage'
import { DataProvider } from './context/DataContext'

const App: FC = () => {
  return (
    <BrowserRouter>
      <DataProvider>
        <Routes>
          <Route path='/' element={<Navigate to={window.location.pathname.split('/')[1] || ''} replace />} />
          <Route path='/:projectId' element={<Dashboard />} />
          <Route path='/:projectId/:type' element={<DetailPage />} />
          <Route path='/:projectId/wizard' element={<WizardPage />} />
          <Route path='/:projectId/forms' element={<div>Forms Page</div>} />
          <Route path='/:projectId/gallery' element={<div>Gallery Page</div>} />
          <Route path='/:projectId/profile' element={<div>Profile Page</div>} />
        </Routes>
      </DataProvider>
    </BrowserRouter>
  )
}
export default App
