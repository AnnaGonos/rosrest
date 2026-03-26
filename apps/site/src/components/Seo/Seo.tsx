import { Helmet } from 'react-helmet-async'

type SeoProps = {
  title: string
  description: string
  canonical?: string
  url?: string
  locale?: string
  image?: string
  imageWidth?: number
  imageHeight?: number
  imageAlt?: string
  type?: string
  robots?: string
  twitterCard?: string
}

export default function Seo({
  title,
  description,
  canonical,
  url,
  locale = 'ru_RU',
  image,
  imageWidth,
  imageHeight,
  imageAlt,
  type = 'website',
  robots = 'index,follow',
  twitterCard = 'summary_large_image',
}: SeoProps) {
  const defaultImage = 'https://sun9-69.userapi.com/s/v1/ig1/bX-NpwK__M4KqE6WAbCParOfT8goTecETcc2NHEFLTOVTosd5Wxd0p5UCgsZ9DhDF1gfD04J.jpg?quality=96&as=32x26,48x39,72x58,108x87,160x128,240x193,360x289,480x385,540x433,640x514,720x578,1080x867,1280x1027,1440x1156,2552x2048&from=bu&u=4fhL890ZMThwmbj7RTfU5oMPb1NcvffQIaiV5ObY9Qw&cs=2552x0'
  const img = image ?? defaultImage

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      {url && <meta property="og:url" content={url} />}
      <meta property="og:locale" content={locale} />
      {img && <meta property="og:image" content={img} />}
      {imageWidth && <meta property="og:image:width" content={String(imageWidth)} />}
      {imageHeight && <meta property="og:image:height" content={String(imageHeight)} />}
      {imageAlt && <meta property="og:image:alt" content={imageAlt} />}
      {img && <meta name="twitter:image" content={img} />}
      <meta name="robots" content={robots} />
      <meta name="twitter:card" content={twitterCard} />
      {canonical && <link rel="canonical" href={canonical} />}
    </Helmet>
  )
}
