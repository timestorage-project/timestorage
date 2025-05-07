import { FC } from 'react'
import { Typography } from './ui/typography'
import { Header as UIHeader } from './ui/header'

interface HeaderComponentProps {
  title: string
  showBack?: boolean
  showMenu?: boolean
  showSync?: boolean
}

const Header: FC<HeaderComponentProps> = ({ title, showBack = false, showMenu = false, showSync = true }) => {
  return <UIHeader title={<Typography variant='h5'>{title}</Typography>} />
}

export default Header
