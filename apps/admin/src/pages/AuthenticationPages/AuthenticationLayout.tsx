import { Image, Paper } from '@mantine/core'
import classes from './AuthenticationPages.module.css'
import authenticationImage from '../../BkLFI0udiDYYi8oaJhoGG76bQ44YOd43qqADt8BZsiDuGIZVxPrzGhHChmx3eZ8nxrjT-0IQqkYn0uFv1sg8mc1u.jpg'
import logoImage from '../../darr4y2t9w34i7ky4vq89op7s5svzgr5.png'

interface AuthenticationLayoutProps {
  children: React.ReactNode
  backgroundImage?: string
  showLogo?: boolean
}

export default function AuthenticationLayout({ 
  children, 
  backgroundImage = authenticationImage,
  showLogo = false 
}: AuthenticationLayoutProps) {
  return (
    <div className={classes.wrapper}>
      <Paper className={classes.form}>
        {showLogo && (
          <Image src={logoImage} alt="RosRest Logo"
            className={classes.authenticationLogo} />
        )}
        {children}
      </Paper>
      <Image className={classes.backgroundImage}
        src={backgroundImage} 
        alt="Authentication Background" 
      />
    </div>
  )
}
