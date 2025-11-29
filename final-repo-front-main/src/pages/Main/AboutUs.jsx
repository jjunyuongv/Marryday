import { useEffect, useMemo, useRef, useState } from 'react'
import '../../styles/Main/AboutUs.css'

const AboutUs = ({ onNavigateToGeneral, onNavigateToCustom, onNavigateToAnalysis }) => {
    const sectionRef = useRef(null)
    const textItemRefs = useRef([])
    const touchStartXRef = useRef(null)
    const [isVisible, setIsVisible] = useState(false)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [isFading, setIsFading] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [currentSlide, setCurrentSlide] = useState(0)

    const textSections = useMemo(() => [
        {
            title: 'AI 자동 피팅 체험',
            description: (
                <>
                    원하는 드레스 이미지를 목록에서 골라 전신 사진 위로 가볍게 드래그해보세요.
                    AI가 자연스럽게 맞춰 실제 입어본 듯한 모습을 바로 보여드립니다
                    복잡한 과정 없이 드래그 한 번으로 다양한 스타일을 쉽고 자연스럽게 체험해보실 수 있습니다
                </>
            ),
            button: onNavigateToGeneral
                ? { label: '일반피팅 바로가기 →', onClick: onNavigateToGeneral }
                : null,
        },
        {
            title: '커스텀 피팅 체험',
            description: (
                <>
                    원하시는 드레스가 목록에 없어도 걱정하지 않으셔도 됩니다. <br />
                    고객님이 직접 가져오신 드레스 이미지를 업로드하면 AI가 전신 사진과 자연스럽게 맞춰
                    마치 바로 입어본 듯한 피팅 결과를 만들어드립니다.
                    원하는 어떤 드레스든 자유롭게 입어보는 경험을 편하게 즐겨보세요.
                </>
            ),
            button: onNavigateToCustom
                ? { label: '커스텀 피팅 바로가기 →', onClick: onNavigateToCustom }
                : null,
        },
        {
            title: 'AI 체형 분석',
            description: (
                <>
                    고객님의 전신 사진을 업로드하면 AI가 전체적인 비율과 실루엣을 분석해드립니다.
                    체형 특징을 바탕으로 어떤 스타일이 잘 어울릴지 미리 이해할 수 있어
                    드레스를 선택하기 전 더욱 정확한 기준을 갖고 비교해보실 수 있습니다
                </>
            ),
            button: onNavigateToAnalysis
                ? { label: '체형분석 바로가기 →', onClick: onNavigateToAnalysis }
                : null,
        },
    ], [onNavigateToAnalysis, onNavigateToCustom, onNavigateToGeneral])

    const [visibleItems, setVisibleItems] = useState(() => Array(textSections.length).fill(false))

    const images = [
        '/Image/main/About1.jpg',
        '/Image/main/About2.jpg',
        '/Image/main/About3.jpg'
    ]

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsVisible(true)
                    }
                })
            },
            {
                threshold: 0.1,
                rootMargin: '0px 0px 0px 0px'
            }
        )

        if (sectionRef.current) {
            observer.observe(sectionRef.current)
        }

        return () => {
            if (sectionRef.current) {
                observer.unobserve(sectionRef.current)
            }
        }
    }, [])

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768)
        }

        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
        setVisibleItems((prev) => {
            if (prev.length === textSections.length) return prev
            return Array(textSections.length).fill(false)
        })
    }, [textSections.length])

    // 각 텍스트 아이템의 가시성 감지
    useEffect(() => {
        if (isMobile) {
            setVisibleItems(Array(textSections.length).fill(true))
            return undefined
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                        setVisibleItems((prev) => {
                            const newVisible = [...prev]
                            const index = textItemRefs.current.indexOf(entry.target)
                            if (index !== -1) {
                                newVisible[index] = true
                            }
                            return newVisible
                        })
                    }
                })
            },
            {
                threshold: [0, 0.3, 0.5, 0.7, 1.0],
                rootMargin: '0px 0px -20% 0px'
            }
        )

        textItemRefs.current.forEach((ref) => {
            if (ref) observer.observe(ref)
        })

        return () => observer.disconnect()
    }, [isMobile, textSections.length])

    // 이미지 자동 로테이션
    useEffect(() => {
        if (isVisible) {
            const interval = setInterval(() => {
                setIsFading(true)
                setTimeout(() => {
                    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length)
                    setIsFading(false)
                }, 1000) // 페이드 아웃 시간
            }, 4000) // 4초마다 이미지 변경

            return () => clearInterval(interval)
        }
    }, [isVisible, images.length])

    const handlePrevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + textSections.length) % textSections.length)
    }

    const handleNextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % textSections.length)
    }

    const handleTouchStart = (e) => {
        if (!isMobile) return
        touchStartXRef.current = e.touches[0].clientX
    }

    const handleTouchEnd = (e) => {
        if (!isMobile || touchStartXRef.current === null) return
        const touchEndX = e.changedTouches[0].clientX
        const diff = touchEndX - touchStartXRef.current
        const threshold = 40
        if (diff > threshold) {
            handlePrevSlide()
        } else if (diff < -threshold) {
            handleNextSlide()
        }
        touchStartXRef.current = null
    }

    return (
        <section ref={sectionRef} className={`about-us-section ${isVisible ? 'visible' : ''}`}>
            <h2 className="about-us-title">About us</h2>
            <div className="about-us-content-wrapper">
                <div className="left-container">
                    <div
                        className="about-us-text-content"
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                    >
                        {textSections.map((item, index) => {
                            const isActiveMobile = isMobile && index === currentSlide
                            const itemClasses = [
                                'about-us-text-item',
                                visibleItems[index] ? 'visible' : '',
                                isMobile ? (isActiveMobile ? 'mobile-active' : 'mobile-hidden') : ''
                            ].join(' ').trim()

                            return (
                                <div
                                    key={item.title}
                                    ref={(el) => { textItemRefs.current[index] = el }}
                                    className={itemClasses}
                                >
                                    <h3 className="about-us-main-text">{item.title}</h3>
                                    <p className="about-us-description">{item.description}</p>
                                    {isMobile && isActiveMobile && (
                                        <div className="about-us-slider-controls">
                                            <button
                                                type="button"
                                                className="about-us-slider-button"
                                                onClick={handlePrevSlide}
                                                aria-label="이전 소개"
                                            >
                                                &lt;
                                            </button>
                                            <span className="about-us-slider-indicator">
                                                {index + 1} / {textSections.length}
                                            </span>
                                            <button
                                                type="button"
                                                className="about-us-slider-button"
                                                onClick={handleNextSlide}
                                                aria-label="다음 소개"
                                            >
                                                &gt;
                                            </button>
                                        </div>
                                    )}
                                    {item.button && !isMobile && (
                                        <button
                                            className="about-us-navigate-button type1"
                                            onClick={item.button.onClick}
                                        >
                                            <span className="btn-txt">{item.button.label}</span>
                                        </button>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
                <div className="right-container">
                    <div className="about-us-image-container">
                        <img
                            src={images[currentImageIndex]}
                            alt={`About us ${currentImageIndex + 1}`}
                            className={`about-us-rotating-image ${isFading ? 'fade-out' : 'fade-in'}`}
                        />
                    </div>
                </div>
            </div>
        </section>
    )
}

export default AboutUs

