import { Button, Container, Image, SimpleGrid, Text, Title } from '@mantine/core'
import { useNavigate } from 'react-router-dom'
import image from './image.svg'
import classes from './NotFoundImage.module.css'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <Container className={classes.root}>
      <SimpleGrid spacing={{ base: 40, sm: 80 }} cols={{ base: 1, sm: 2 }}>
        <Image src={image} className={classes.mobileImage} />
        <div>
          <Title className={classes.title}>404
            Страница не найдена</Title>
          <Text c="dimmed" size="lg">
            К сожалению, запрашиваемая страница не существует или была перемещена.
          </Text>
          <Button
            variant="outline"
            size="md"
            mt="xl"
            className={classes.control}
            onClick={() => navigate('/')}
          >
           На главную страницу
          </Button>
        </div>
        <Image src={image} className={classes.desktopImage} />
      </SimpleGrid>
    </Container>
  )
}
