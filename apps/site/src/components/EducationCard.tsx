
import { getFileUrl } from '../utils/getFileUrl';

type EducationInstitution = {
  id: number
  name: string
  websiteUrl: string
  imageUrl?: string | null
  specialties?: string[] | null
}

interface Props {
  item: EducationInstitution
}


const resolveImageUrl = (raw?: string | null) => {
  if (!raw) return 'https://placehold.co/320x180?text=Education';
  const url = getFileUrl(raw);
  return url || raw || 'https://placehold.co/320x180?text=Education';
}

export default function EducationCard({ item }: Props) {
  return (
    <article className="education-card">
      <div className="education-card__image-wrapper">
        <img src={resolveImageUrl(item.imageUrl)} alt={item.name} className="education-card__image" />
      </div>
      <div className="education-card__body">
        <a className="education-card__link" href={item.websiteUrl} target="_blank" rel="noopener noreferrer">
          <h2 className="education-card__title card-subtitle-sm">{item.name}</h2>
        </a>
        {item.specialties && item.specialties.length > 0 && (
          <div className="education-card__specialties">
            <span className="education-card__specialties-label">Специальности:</span>
            <ul>
              {item.specialties.map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </article>
  )
}
