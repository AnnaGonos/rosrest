import './FAQSection.css'

export type FAQItem = {
    question: string
    answer: string
}

type Props = {
    items: FAQItem[]
    title?: string
}

export default function FAQSection({ items, title = 'Часто задаваемые вопросы' }: Props) {
    if (!items || items.length === 0) return null

    return (
        <div className="faq-section">
            <h2 className="section-title--lg faq-section__title">{title}</h2>
            <div className="faq-section__container">
                {items.map((item, index) => (
                    <details key={index} className="faq-item">
                        <summary className="faq-item__question">
                            <span className="faq-item__text card-title-sm">{item.question}</span>
                            <span className="faq-item__icon"><i className="bi bi-plus-lg"></i></span>
                        </summary>
                        <div className="faq-item__answer">
                            {item.answer}
                        </div>
                    </details>
                ))}
            </div>
        </div>
    )
}
