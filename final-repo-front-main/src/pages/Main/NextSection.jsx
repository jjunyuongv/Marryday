import { useEffect, useRef, useState } from 'react'
import '../../styles/Main/NextSection.css'

const NextSection = () => {
    const sectionRef = useRef(null)
    const videoRef = useRef(null)
    const [isVisible, setIsVisible] = useState(false)

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

    // 비디오 자동 재생
    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        const handleLoadedMetadata = () => {
            video.playbackRate = 1.0
            video.play().catch(err => console.error('Video play error:', err))
        }

        if (video.readyState >= 1) {
            handleLoadedMetadata()
        } else {
            video.addEventListener('loadedmetadata', handleLoadedMetadata)
        }

        return () => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata)
        }
    }, [])

    return (
        <section ref={sectionRef} className={`next-section ${isVisible ? 'visible' : ''}`}>

            <div className="next-section-video-banner">
                <video
                    ref={videoRef}
                    className="next-section-video"
                    muted
                    loop
                    playsInline
                >
                    <source src="/Image/main/Main_bn3.mp4" type="video/mp4" />
                </video>
                <div className="next-section-video-overlay"></div>
                <div className="next-section-video-text">
                    <span className="video-text-line">“ 당신의 가장 아름다운 순간,</span>
                    <br className="video-text-break" />
                    <span className="video-text-line">지금부터 시작됩니다 ”</span>
                </div>
            </div>

        </section>
    )
}

export default NextSection

