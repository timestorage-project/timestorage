import { FC } from 'react'

const Header: FC = () => {
  return (
    <header className='fixed top-0 left-0 w-full z-50 bg-background shadow-md'>
      <div className='container mx-auto flex h-12 items-center px-4'>{/* Content for the toolbar would go here */}</div>
    </header>
  )
}

export default Header
