import { useState, useEffect, useRef } from 'react'
import '../../styles/Main/DressCollection.css'

const DressCollection = () => {
    const [count, setCount] = useState(0)
    const [isVisible, setIsVisible] = useState(false)
    const sectionRef = useRef(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !isVisible) {
                    setIsVisible(true)
                }
            },
            { threshold: 0.3 }
        )

        if (sectionRef.current) {
            observer.observe(sectionRef.current)
        }

        return () => {
            if (sectionRef.current) {
                observer.unobserve(sectionRef.current)
            }
        }
    }, [isVisible])

    useEffect(() => {
        if (isVisible && count < 100) {
            const timer = setTimeout(() => {
                setCount(prev => {
                    if (prev < 100) {
                        // 빠르게 카운팅
                        const increment = prev < 50 ? 3 : prev < 80 ? 2 : 1
                        return Math.min(prev + increment, 100)
                    }
                    return prev
                })
            }, 30)

            return () => clearTimeout(timer)
        }
    }, [isVisible, count])

    return (
        <div className="dress-collection-section" ref={sectionRef}>
            <div className={`dress-collection-content ${isVisible ? 'visible' : ''}`}>
                <div className="collection-number">
                    <span className="count-number">{count}</span>
                    <span className="plus-sign">+</span>
                </div>
                <h2 className="collection-title">
                    가지가 넘는 프리미엄 드레스 컬렉션
                </h2>
                <p className="collection-description">
                    다양한 카테고리의 드레스를 통해 당신만의 완벽한 드레스를 찾아보세요
                </p>

            </div>
        </div>
    )
}

export default DressCollection

