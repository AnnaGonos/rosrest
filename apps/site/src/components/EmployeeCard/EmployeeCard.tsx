import React from 'react'

type Employee = {
  id: string
  fullName: string
  position?: string | null
  photoUrl?: string | null
  email?: string | null
  phone?: string | null
  profileUrl?: string | null
}

interface EmployeeCardProps {
  employee: Employee
  resolveImage: (url?: string | null) => string | undefined
  type: 'square' | 'circle'
  variant?: 'person' | ''
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({ employee: e, resolveImage, type, variant='' }) => {
  const initials = e.fullName?.split(' ').map(n => n[0]).join('') || ''
  const photoSrc = resolveImage(e.photoUrl)

  return (
    <div className="team-card">
      <div className={`team-card__image ${type} ${variant === '' ? '' : 'person'}`}>
        {e.profileUrl ? (
          <a href={e.profileUrl} target="_blank" rel="noopener noreferrer">
            {photoSrc ? (
              <img src={photoSrc} alt={e.fullName} />
            ) : (
              <div className="team-card__placeholder">{initials}</div>
            )}
          </a>
        ) : (
          <>
            {photoSrc ? (
              <img src={photoSrc} alt={e.fullName} />
            ) : (
              <div className="team-card__placeholder">{initials}</div>
            )}
          </>
        )}
      </div>
      <div className="team-card__info">
        {e.profileUrl ? (
          <a className="team-card__name card-subtitle" href={e.profileUrl} target="_blank" rel="noopener noreferrer">
            {e.fullName}
          </a>
        ) : (
          <div className="team-card__name card-subtitle">{e.fullName}</div>
        )}
        {e.position && <div className="team-card__position card-detail">{e.position}</div>}
        <div className="team-card__contacts card-contact">
          {e.email && <a href={`mailto:${e.email}`}>{e.email}</a>}
          {e.phone && <div>{e.phone}</div>}
        </div>
      </div>
    </div>
  )
}

export default EmployeeCard
