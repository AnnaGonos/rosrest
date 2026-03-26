import { Helmet } from 'react-helmet-async'

type SeoProps = {
  title: string
  description: string
  canonical?: string
  url?: string
  locale?: string
  image?: string
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
  type = 'website',
  robots = 'index,follow',
  twitterCard = 'summary_large_image',
}: SeoProps) {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      {url && <meta property="og:url" content={url} />}
      <meta property="og:locale" content={locale} />
      {image && <meta property="og:image" content={image} />}
      <meta name="robots" content={robots} />
      <meta name="twitter:card" content={twitterCard} />
      {canonical && <link rel="canonical" href={canonical} />}
    </Helmet>
  )
}
