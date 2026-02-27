import { useState, useEffect } from 'react'

interface TypewriterTextProps {
    text: string
    speed?: number 
    delay?: number
    className?: string
    cursor?: boolean 
}

export default function TypewriterText({ 
    text, 
    speed = 1, 
    delay = 10, 
    className = '', 
    cursor = true 
}: TypewriterTextProps) {
    const [displayedText, setDisplayedText] = useState('')
    const [currentIndex, setCurrentIndex] = useState(0)
    const [showCursor, setShowCursor] = useState(true)

    useEffect(() => {
        const startTimer = setTimeout(() => {
            if (currentIndex < text.length) {
                const currentChar = text[currentIndex]
                let charDelay = speed
                
                charDelay = speed + (Math.random() - 0.5) * speed * 0.6
                
                if (currentChar === ' ') charDelay *= 1.5
                if ([',', '.', '!', '?', ':', ';'].includes(currentChar)) charDelay *= 2
                
                const timer = setTimeout(() => {
                    setDisplayedText(prev => prev + text[currentIndex])
                    setCurrentIndex(prev => prev + 1)
                }, charDelay)
                return () => clearTimeout(timer)
            } else {
                setShowCursor(false)
            }
        }, delay)

        return () => clearTimeout(startTimer)
    }, [currentIndex, text, speed, delay, cursor])

    return (
        <span className={className}>
            {displayedText}
            {cursor && currentIndex <= text.length && (
                <span style={{ 
                    opacity: showCursor ? 1 : 0,
                    transition: 'opacity 0.1s',
                    borderRight: '3px solid currentColor',
                    marginLeft: '2px'
                }}>
                    &nbsp;
                </span>
            )}
        </span>
    )
}
