import { useRef, useEffect, useState } from 'react';
import './AboutSection.css'
import { OutlineArrowButtonLink } from '../LinkButtons'

function useAnimatedInView(ref: React.RefObject<HTMLElement>, delay = 0) {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        if (!ref.current) return;
        let timeoutId: number | undefined;
        const observer = new window.IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    timeoutId = window.setTimeout(() => setVisible(true), delay);
                } else {
                    setVisible(false);
                }
            },
            { threshold: 0.2 }
        );
        observer.observe(ref.current);
        return () => {
            observer.disconnect();
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [ref, delay]);
    return visible;
}

export default function AboutSection() {
    const sectionRef = useRef<HTMLElement>(null);
    const visible = useAnimatedInView(sectionRef, 0);
    return (
        <section ref={sectionRef} className="about-section">
            <h2 className={
                'about-section__title section-title--lg about-section__title-animated' +
                (visible ? ' about-section__title-visible' : '')
            }> [ О нас ] </h2>
            <div className="about-section__content">
                <div className={
                    'about-section__description about-section__description-animated' +
                    (visible ? ' about-section__description-visible' : '')
                }>
                    <p className="about-section__text body-text--light">
                        Некоммерческое партнерство «Российская Ассоциация Реставраторов» основано в 2004 году в Санкт-Петербурге как всероссийское профессиональное объединение реставраторов.
                    </p>
                    <p className="about-section__text about-section__text--spaced body-emphasis">Наша <b>миссия</b> - сохранять <b>культурное наследие России</b> через профессионализм, сотрудничество, образование и правовую поддержку.
                    </p>
                </div>
                <OutlineArrowButtonLink className="about-section__details" href="#">Узнать больше</OutlineArrowButtonLink>
            </div>
            <div className="about-section__stats">
                <img src="../public/about-cover-image.png" alt="About Us" className={
                    'about-section__image about-section__image-animated' +
                    (visible ? ' about-section__image-visible' : '')
                } />
                <div className={
                    'about-section__stats-list-animated' +
                    (visible ? ' about-section__stats-list-visible' : '')
                }>
                    <div className="about-section__stats-list">
                        <div className="stat">
                            <b className="stat__number">20</b>
                            <div className="stat__label body-text">лет профессиональной деятельности</div>
                        </div>
                        <div className="stat">
                            <div className="stat__number">130+</div>
                            <div className="stat__label body-text">организаций и мастеров — членов Ассоциации</div>
                        </div>
                        <div className="stat">
                            <div className="stat__number">1000+</div>
                            <div className="stat__label body-text">объектов культурного наследия отреставрировано</div>
                        </div>
                        <div className="stat">
                            <div className="stat__number">5+</div>
                            <div className="stat__label body-text">стран в международных проектах</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
