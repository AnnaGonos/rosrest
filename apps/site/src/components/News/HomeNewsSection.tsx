import { useEffect, useState, useRef } from 'react';
import NewsCard, { NewsCardItem } from './NewsCard';
import { OutlineButtonLink } from '../LinkButtons';
import './HomeNewsSection.css'


function AnimatedNewsItems({ news }: { news: NewsCardItem[] }) {
    const itemRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];
    const [visibleIndexes, setVisibleIndexes] = useState<number[]>([]);

    useEffect(() => {
        if (!news.length) return;
        let observer: IntersectionObserver | null = null;
        let timeoutIds: number[] = [];
        setVisibleIndexes([]);

        observer = new window.IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const index = Number(entry.target.getAttribute('data-index'));
                if (entry.isIntersecting && !visibleIndexes.includes(index)) {
                    timeoutIds.push(window.setTimeout(() => {
                        setVisibleIndexes((prev) => [...prev, index]);
                    }, index * 200));
                }
            });
        }, { threshold: 0.2 });

        itemRefs.forEach((ref) => {
            if (ref.current) observer?.observe(ref.current);
        });

        if (!('IntersectionObserver' in window)) {
            setVisibleIndexes(news.map((_, i) => i));
        }

        return () => {
            observer?.disconnect();
            timeoutIds.forEach(clearTimeout);
        };
    }, [news]);

    return (
        <>
            {news.slice(1, 4).map((item, idx) => (
                <div
                    key={item.id}
                    ref={itemRefs[idx]}
                    data-index={idx}
                    className={
                        'home-news-section__item home-news-section__item-animated' +
                        (visibleIndexes.includes(idx) || typeof window === 'undefined' ? ' home-news-section__item-visible' : '')
                    }
                >
                    <NewsCard news={item} />
                </div>
            ))}
        </>
    );
}

interface HomeNewsSectionProps {
    title?: string;
    limit?: number;
    className?: string;
}

export default function HomeNewsSection({
    title = 'Новости',
    limit = 4,
    className = '',
}: HomeNewsSectionProps) {
    const [news, setNews] = useState<NewsCardItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const mainRef = useRef<HTMLDivElement>(null);
    const [mainVisible, setMainVisible] = useState(false);
    const itemRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];
    const [_itemVisible, setItemVisible] = useState([false, false, false]);

    useEffect(() => {
        setLoading(true);
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002';
        fetch(`${API_BASE}/news?isDraft=false&page=1&pageSize=${limit}`, {
            headers: { 'accept': 'application/json' },
        })
            .then(res => {
                if (!res.ok) throw new Error('Ошибка загрузки новостей');
                return res.json();
            })
            .then(data => {
                const list = Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : []);
                setNews(list.slice(0, limit));
                setError(null);
            })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [limit]);

    useEffect(() => {
        const ref = mainRef.current;
        if (!ref) return;
        const observer = new window.IntersectionObserver(
            ([entry]) => {
                setMainVisible(entry.isIntersecting);
            },
            { threshold: 0.3 }
        );
        observer.observe(ref);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const observers: IntersectionObserver[] = [];
        itemRefs.forEach((ref, idx) => {
            const el = ref.current;
            if (!el) return;
            const observer = new window.IntersectionObserver(
                ([entry]) => {
                    setItemVisible(prev => {
                        const next = [...prev];
                        next[idx] = entry.isIntersecting;
                        return next;
                    });
                },
                { threshold: 0.3 }
            );
            observer.observe(el);
            observers.push(observer);
        });
        return () => observers.forEach(obs => obs.disconnect());
    }, []);

    return (
        <section className={`home-news-section ${className}`}>
            <div className="home-news-section__header">
                <h2 className="section-title--lg">[ {title} ]</h2>
            </div>
            {loading && <div className="news-status">Загрузка новостей...</div>}
            {error && !loading && <div className="news-status news-status--error">{error}</div>}
            <div className="home-news-section__content">
                <div
                    className={`home-news-section__col home-news-section__col--main${mainVisible ? ' home-news-section__col--main-visible' : ''}`}
                    ref={mainRef}
                >
                    {news[0] && <NewsCard news={news[0]} />}
                </div>
                <div className="home-news-section__col home-news-section__col--list">
                    <AnimatedNewsItems news={news} />
                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
                        <OutlineButtonLink href="/news">Все новости</OutlineButtonLink>
                    </div>
                </div>
            </div>
        </section>
    );
}
