import { useRef } from 'react';
import { useState, useEffect } from 'react'
import { OutlineArrowButtonLink } from './LinkButtons'
import './Partners.css'

interface Partner {
  id: string;
  name: string;
  imageUrl: string;
  link: string;
  createdAt: string;
}

export default function Partners() {
  const sectionRef = useRef<HTMLElement>(null);

  const [inView, setInView] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function checkInView() {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;
      if (rect.top < windowHeight && rect.bottom > 0) {
        setInView(true);
      }
    }
    window.addEventListener('scroll', checkInView);
    window.addEventListener('resize', checkInView);
    checkInView();
    return () => {
      window.removeEventListener('scroll', checkInView);
      window.removeEventListener('resize', checkInView);
    };
  }, []);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/partners?limit=17`
        )
        if (!response.ok) throw new Error('Failed to fetch partners')
        const data = await response.json()
        setPartners(data)
      } catch (err) {
        console.error('Error fetching partners:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPartners()
  }, [])

  if (loading) {
    return (
      <section className="partners-section">
        <div className="partners-container">
          <div className="partners-header">
            <h2 className="section-title--lg">[ Партнеры ]</h2>
          </div>
          <p style={{ textAlign: 'center' }}>Загрузка партнеров...</p>
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="partners-section">
      <div className="partners-container">
        <div className="partners-header">
          <h2 className="section-title--lg">[ Партнеры ]</h2>
        </div>

        <div className="partners-grid">
          {partners.map((partner, idx) => {
            const imageUrl = partner.imageUrl.startsWith('http')
              ? partner.imageUrl
              : `${import.meta.env.VITE_API_URL || 'http://localhost:3002'}${partner.imageUrl}`;
            const delay = `${0.08 * idx}s`;
          
            const cardClass = "partner-card" + (inView ? " partner-card--animated" : " partner-card--visible");
            const style = inView ? { '--partner-delay': delay } as React.CSSProperties : {};
            return (
              <a
                key={partner.id}
                href={partner.link}
                target="_blank"
                rel="noopener noreferrer"
                className={cardClass}
                style={style}
              >
                <img src={imageUrl} alt={partner.name} className="partner-logo" />
              </a>
            );
          })}
        </div>

        <OutlineArrowButtonLink style={{ marginTop: '40px' }} href="/about/partners">Больше партнеров</OutlineArrowButtonLink>
      </div>
    </section>
  );
}
