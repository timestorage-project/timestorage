import { FC } from 'react'
import { 
  FileText, 
  Upload, 
  Download, 
  File as FileIcon,
  Image as ImageIcon,
  Film,
  Share2,
  Trash2,
  ArrowRight,
  Database,
  Shield,
  File
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Header from '@/components/Header'
import { Motion } from './ui/motion'
import { Typography } from './ui/typography'

const MockDashboard: FC = () => {
  const navigate = useNavigate()
  const uuid = 'timestorage-demo'
  
  // Mock storage data
  const storageStats = {
    totalSpace: '100 GB',
    usedSpace: '42 GB',
    availableSpace: '58 GB',
    percentUsed: 42,
    usedPercentage: 42
  }

  // Mock file categories
  const fileCategories = [
    { id: 'documents', title: 'Documents', count: 156, icon: <FileText className="h-6 w-6" />, size: '12.4 GB', color: 'primary' },
    { id: 'images', title: 'Images', count: 342, icon: <ImageIcon className="h-6 w-6" />, size: '18.7 GB', color: 'secondary' },
    { id: 'videos', title: 'Videos', count: 28, icon: <Film className="h-6 w-6" />, size: '9.2 GB', color: 'accent' },
    { id: 'other', title: 'Other Files', count: 64, icon: <File className="h-6 w-6" />, size: '1.7 GB', color: 'neutral' }
  ]

  // Mock recent activities
  const recentActivities = [
    { 
      id: 1, 
      action: 'Upload', 
      icon: <Upload className="h-4 w-4" />,
      filename: 'project_report.pdf', 
      timestamp: '2 hours ago',
      color: 'text-success'
    },
    { 
      id: 2, 
      action: 'Download', 
      icon: <Download className="h-4 w-4" />,
      filename: 'vacation_photos.zip', 
      timestamp: '5 hours ago',
      color: 'text-info'
    },
    { 
      id: 3, 
      action: 'Share', 
      icon: <Share2 className="h-4 w-4" />,
      filename: 'presentation.pptx', 
      timestamp: 'Yesterday',
      color: 'text-warning'
    },
    { 
      id: 4, 
      action: 'Delete', 
      icon: <Trash2 className="h-4 w-4" />,
      filename: 'old_backups.zip', 
      timestamp: '3 days ago',
      color: 'text-error'
    }
  ]

  // Note: Security status can be implemented as needed in the future
  // const securityStatus = {
  //   isSecure: true,
  //   lastScan: '2 hours ago',
  //   threatsDetected: 0,
  //   icon: <Shield className="h-6 w-6 text-success" />
  // }

  // Icon helper function - kept for potential future use
  // const getActionIcon = (action: string) => {
  //   switch (action.toLowerCase()) {
  //     case 'upload':
  //       return <Upload className="h-4 w-4" />
  //     case 'download':
  //       return <Download className="h-4 w-4" />
  //     case 'share':
  //       return <Share2 className="h-4 w-4" />
  //     case 'delete':
  //       return <Trash2 className="h-4 w-4" />
  //     default:
  //       return <File className="h-4 w-4" />
  //   }
  // }

  return (
    <div className="min-h-screen bg-base-100">
      <Header title={`TimeStorage - ${uuid}`} showMenu={true} />

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <Motion variant="fadeIn">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              Welcome back!
            </h1>
            <p className="text-gray-500">Here's what's happening with your storage</p>
          </div>
        </Motion>

        {/* Stats Grid */}
        <Motion variant="slideUp" delay={0.1}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { 
                label: 'Total Storage', 
                value: `${storageStats.usedSpace} / ${storageStats.totalSpace}`, 
                icon: <Database className="h-6 w-6" />,
                color: 'primary'
              },
              { 
                label: 'Files', 
                value: '520', 
                icon: <FileIcon className="h-6 w-6" />,
                color: 'secondary'
              },
              { 
                label: 'Shared', 
                value: '10', 
                icon: <Share2 className="h-6 w-6" />,
                color: 'accent'
              },
              { 
                label: 'Trash', 
                value: '5', 
                icon: <Trash2 className="h-6 w-6" />,
                color: 'neutral'
              },
            ].map((stat, index) => (
              <div 
                key={index}
                className={`card bg-base-200 shadow-md hover:shadow-lg transition-shadow`}
              >
                <div className="card-body p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{stat.label}</p>
                      <h3 className="text-2xl font-bold">{stat.value}</h3>
                    </div>
                    <div className={`p-3 rounded-full bg-${stat.color}/10 text-${stat.color}`}>
                      {stat.icon}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Motion>

        {/* File Categories Section */}
        <Motion variant="slideUp" delay={0.2}>
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">File Categories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {fileCategories.map((category, index) => (
                <div 
                  key={index}
                  className="card bg-base-200 shadow-md hover:shadow-lg transition-transform hover:-translate-y-1 cursor-pointer"
                  onClick={() => navigate(`/files?type=${category.id}`)}
                >
                  <div className="card-body p-4">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-lg bg-${category.color}/10 text-${category.color}`}>
                        {category.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold">{category.title}</h3>
                        <Typography variant="body2" color="neutral">
                          {category.count} files • {category.size}
                        </Typography>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </Motion>

        {/* Recent Activity */}
        <Motion variant="slideUp" delay={0.3}>
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
            <div className="card bg-base-200 shadow-md">
              <div className="card-body p-0">
                <div className="overflow-x-auto">
                  <table className="table">
                    <tbody>
                      {recentActivities.map((activity) => (
                        <tr key={activity.id} className="hover:bg-base-300 cursor-pointer">
                          <td>
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-full ${activity.color}`}>
                                {activity.icon}
                              </div>
                              <div>
                                <div className="font-medium">{activity.filename}</div>
                                <div className="text-sm text-gray-500">{activity.action} • {activity.timestamp}</div>
                              </div>
                            </div>
                          </td>
                          <td className="text-right">
                            <button className="btn btn-ghost btn-sm">
                              <ArrowRight className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        </Motion>

        {/* Security Status */}
        <Motion variant="slideUp" delay={0.4}>
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Security Status</h2>
            <div className="card bg-base-200 shadow-md">
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">Account Protection</h3>
                    <Typography variant="body2" color="neutral">
                      Your account is secured with Auth0
                    </Typography>
                  </div>
                  <div className="p-2 rounded-full bg-success/10 text-success">
                    <Shield className="h-6 w-6" />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">File Encryption</h3>
                    <Typography variant="body2" color="neutral">
                      All files are encrypted at rest
                    </Typography>
                  </div>
                  <div className="p-2 rounded-full bg-success/10 text-success">
                    <Shield className="h-6 w-6" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </Motion>
      </div>
    </div>  
  )
}

export default MockDashboard
