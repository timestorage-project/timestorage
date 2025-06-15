import { FC } from 'react'
import { FileText, Clock, Upload, Download, Settings, User, Shield, HardDrive } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Container } from '@/components/ui/container'
import { Grid } from '@/components/ui/grid'
import { Card, CardContent } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import { motion } from '@/components/ui/motion'
import BottomNavigation from '@/components/BottomNavigation'
import Header from '@/components/Header'

const MockDashboard: FC = () => {
  const navigate = useNavigate()
  const uuid = 'timestorage-demo'

  // Mock storage data
  const storageStats = {
    totalSpace: '100 GB',
    usedSpace: '42 GB',
    availableSpace: '58 GB',
    percentUsed: 42
  }

  // Mock file categories
  const fileCategories = [
    { id: 'documents', title: 'Documents', count: 156, icon: 'fileText', size: '12.4 GB' },
    { id: 'images', title: 'Images', count: 342, icon: 'image', size: '18.7 GB' },
    { id: 'videos', title: 'Videos', count: 28, icon: 'video', size: '9.2 GB' },
    { id: 'other', title: 'Other Files', count: 64, icon: 'file', size: '1.7 GB' }
  ]

  // Mock recent activities
  const recentActivities = [
    { id: 1, action: 'Upload', filename: 'project_report.pdf', timestamp: '2 hours ago' },
    { id: 2, action: 'Download', filename: 'vacation_photos.zip', timestamp: '5 hours ago' },
    { id: 3, action: 'Share', filename: 'presentation.pptx', timestamp: 'Yesterday' },
    { id: 4, action: 'Delete', filename: 'old_backups.zip', timestamp: '3 days ago' }
  ]

  // Dashboard action cards
  const actionCards = [
    { id: 'upload', title: 'Upload Files', icon: 'upload', description: 'Add new files to your storage' },
    { id: 'download', title: 'Download Files', icon: 'download', description: 'Get your stored files' },
    { id: 'share', title: 'Share Files', icon: 'share', description: 'Share files with others' },
    { id: 'settings', title: 'Settings', icon: 'settings', description: 'Manage your account' }
  ]

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'fileText':
        return <FileText className='h-6 w-6 text-primary' />
      case 'upload':
        return <Upload className='h-6 w-6 text-primary' />
      case 'download':
        return <Download className='h-6 w-6 text-primary' />
      case 'settings':
        return <Settings className='h-6 w-6 text-primary' />
      case 'share':
        return <User className='h-6 w-6 text-primary' />
      case 'image':
        return <FileText className='h-6 w-6 text-primary' />
      case 'video':
        return <FileText className='h-6 w-6 text-primary' />
      case 'file':
        return <FileText className='h-6 w-6 text-primary' />
      default:
        return <FileText className='h-6 w-6 text-primary' />
    }
  }

  return (
    <div className='min-h-screen bg-background'>
      <Header title={`TimeStorage - ${uuid}`} showMenu={true} />

      <Container maxWidth='sm' className='mt-8 mb-24 px-4'>
        {/* Storage Overview */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Typography variant='h3' className='mb-6'>
            Storage Overview
          </Typography>

          <Card className='mb-6'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between mb-2'>
                <Typography variant='h6'>Storage Usage</Typography>
                <HardDrive className='h-5 w-5 text-primary' />
              </div>

              <div className='flex justify-between mb-1'>
                <Typography variant='body2' color='muted'>
                  Used Space
                </Typography>
                <Typography variant='body2'>{storageStats.usedSpace}</Typography>
              </div>

              <div className='flex justify-between mb-2'>
                <Typography variant='body2' color='muted'>
                  Total Space
                </Typography>
                <Typography variant='body2'>{storageStats.totalSpace}</Typography>
              </div>

              {/* Progress bar */}
              <div className='w-full bg-secondary h-2 rounded-full'>
                <div className='bg-primary h-2 rounded-full' style={{ width: `${storageStats.percentUsed}%` }}></div>
              </div>

              <Typography variant='body2' className='mt-1 text-right'>
                {storageStats.percentUsed}% used
              </Typography>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <Typography variant='h3' className='mb-4'>
            Quick Actions
          </Typography>

          <Grid container className='gap-4 mb-8'>
            {actionCards.map((action, index) => (
              <Grid item xs={6} key={action.id}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.1, duration: 0.3 }}
                >
                  <Card
                    className='h-36 cursor-pointer transition-all hover:shadow-md hover:-translate-y-1 bg-card/80'
                    onClick={() => navigate(`/view/${uuid}/${action.id}`)}
                  >
                    <CardContent className='p-4'>
                      <div className='mb-2 text-primary'>{getIconComponent(action.icon)}</div>
                      <Typography variant='h6' className='mb-1'>
                        {action.title}
                      </Typography>
                      <Typography variant='body2' color='muted'>
                        {action.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <Typography variant='h3' className='mb-4'>
            Recent Activity
          </Typography>

          <Card className='mb-8'>
            <CardContent className='p-4'>
              {recentActivities.map((activity, index) => (
                <div
                  key={activity.id}
                  className={`flex items-center justify-between py-2 ${
                    index < recentActivities.length - 1 ? 'border-b border-border' : ''
                  }`}
                >
                  <div className='flex items-center'>
                    <Clock className='h-4 w-4 text-muted-foreground mr-2' />
                    <div>
                      <Typography variant='body2'>{activity.filename}</Typography>
                      <Typography variant='body2' color='muted'>
                        {activity.action} • {activity.timestamp}
                      </Typography>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* File Categories */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <Typography variant='h3' className='mb-4'>
            File Categories
          </Typography>

          <Grid container className='gap-4 mb-8'>
            {fileCategories.map((category, index) => (
              <Grid item xs={6} key={category.id}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1, duration: 0.3 }}
                >
                  <Card
                    className='cursor-pointer transition-all hover:shadow-md hover:-translate-y-1 bg-card/80'
                    onClick={() => navigate(`/view/${uuid}/category/${category.id}`)}
                  >
                    <CardContent className='p-4'>
                      <div className='mb-2 text-primary'>{getIconComponent(category.icon)}</div>
                      <Typography variant='h6' className='mb-1'>
                        {category.title}
                      </Typography>
                      <Typography variant='body2' color='muted'>
                        {category.count} files • {category.size}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>

        {/* Security Status */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          <Typography variant='h3' className='mb-4'>
            Security Status
          </Typography>

          <Card className='mb-8'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between mb-4'>
                <div>
                  <Typography variant='h6'>Account Protection</Typography>
                  <Typography variant='body2' color='muted'>
                    Your account is secured with Auth0
                  </Typography>
                </div>
                <Shield className='h-6 w-6 text-green-500' />
              </div>

              <div className='flex items-center justify-between'>
                <div>
                  <Typography variant='h6'>File Encryption</Typography>
                  <Typography variant='body2' color='muted'>
                    All files are encrypted at rest
                  </Typography>
                </div>
                <Shield className='h-6 w-6 text-green-500' />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </Container>

      <BottomNavigation />
    </div>
  )
}

export default MockDashboard
