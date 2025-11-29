import { useEffect, useRef, useState } from 'react'
import Lottie from 'lottie-react'
import '../../styles/Main/UsageGuideSection.css'

const UsageGuideSection = () => {
    const containerRef = useRef(null)
    const [ratio, setRatio] = useState(0.5)
    const [dragging, setDragging] = useState(false)
    const animationFrameRef = useRef(null)
    const [uploadAnimation, setUploadAnimation] = useState(null)
    const [fittingAnimation, setFittingAnimation] = useState(null)
    const [successAnimation, setSuccessAnimation] = useState(null)
    const successLottieRef = useRef(null)
    const [isMobile, setIsMobile] = useState(false)

    const updateRatioFromClientX = (clientX) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        let pos = clientX - rect.left
        pos = Math.max(0, Math.min(rect.width, pos))
        const newRatio = pos / rect.width

        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
        }

        animationFrameRef.current = requestAnimationFrame(() => {
            setRatio(newRatio)
        })
    }

    useEffect(() => {
        const handlePointerMove = (event) => {
            if (!dragging) return
            event.preventDefault()
            updateRatioFromClientX(event.clientX)
        }

        const handlePointerUp = () => {
            if (!dragging) return
            setDragging(false)
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
        }

        if (dragging) {
            window.addEventListener('pointermove', handlePointerMove, { passive: false })
            window.addEventListener('pointerup', handlePointerUp)
        }

        return () => {
            window.removeEventListener('pointermove', handlePointerMove)
            window.removeEventListener('pointerup', handlePointerUp)
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
        }
    }, [dragging])

    const handlePointerDown = (event) => {
        event.preventDefault()
        setDragging(true)
        updateRatioFromClientX(event.clientX)
    }

    const handleContainerClick = (event) => {
        if (dragging) return
        updateRatioFromClientX(event.clientX)
    }

    useEffect(() => {
        // Lottie 애니메이션 로드
        fetch('/Image/lottie/upload files loader.json')
            .then(response => response.json())
            .then(data => setUploadAnimation(data))
            .catch(error => console.error('Lottie 로드 실패:', error))

        fetch('/Image/lottie/fitting.json')
            .then(response => response.json())
            .then(data => setFittingAnimation(data))
            .catch(error => console.error('Lottie 로드 실패:', error))

        fetch('/Image/lottie/success.json')
            .then(response => response.json())
            .then(data => setSuccessAnimation(data))
            .catch(error => console.error('Lottie 로드 실패:', error))
    }, [])

    useEffect(() => {
        if (successLottieRef.current && successAnimation) {
            successLottieRef.current.setSpeed(0.35)
        }
    }, [successAnimation])

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    return (
        <section className="usage-guide-section">
            <div className="usage-guide-container">
                <div className="usage-guide-label">간편한 드레스 매칭</div>
                <div className="usage-guide-steps">
                    <div className="usage-step">
                        <div className="step-circle">
                            {uploadAnimation && (
                                <Lottie
                                    animationData={uploadAnimation}
                                    loop={true}
                                    className="step-icon-lottie"
                                />
                            )}
                        </div>
                        <div className="step-label">사용자의 이미지<br /> 업로드</div>
                    </div>
                    <div className="step-arrow">→</div>
                    <div className="usage-step">
                        <div className="step-circle">
                            {fittingAnimation && (
                                <Lottie
                                    animationData={fittingAnimation}
                                    loop={true}
                                    className="step-icon-lottie step-icon-lottie-fitting"
                                />
                            )}
                        </div>
                        <div className="step-label">원하는 드레스를<br /> 드레그</div>
                    </div>
                    <div className="step-arrow">→</div>
                    <div className="usage-step">
                        <div className="step-circle">
                            {successAnimation && (
                                <Lottie
                                    lottieRef={successLottieRef}
                                    animationData={successAnimation}
                                    loop={true}
                                    className="step-icon-lottie"
                                />
                            )}
                        </div>
                        <div className="step-label">매칭완료</div>
                    </div>
                </div>
                <div
                    ref={containerRef}
                    className="usage-guide-slider"
                    onClick={handleContainerClick}
                >
                    <div className="slider-image slider-before slider-image-ex-b">
                        <img className="slider-img-ex-b" src="/Image/main/ex_B.jpg" alt="드레스 착용 전 예시" />
                    </div>

                    <div className="slider-image slider-after slider-image-ex-a">
                        <div
                            className="slider-after-clip"
                            style={{ '--clip-right': `${(1 - ratio) * 100}%` }}
                        >
                            <img className="slider-img-ex-a" src="/Image/main/ex_A.png" alt="드레스 착용 후 예시" />
                        </div>
                    </div>

                    <div
                        className={`slider-bar ${dragging ? 'dragging' : ''}`}
                        style={{
                            left: `${ratio * 100}%`
                        }}
                    />
                    <div
                        className={`slider-handle ${dragging ? 'dragging' : ''}`}
                        style={{
                            top: isMobile ? '50%' : '300px',
                            left: `${ratio * 100}%`,
                            transform: `translate(-50%, -50%)`
                        }}
                        onPointerDown={handlePointerDown}
                        role="presentation"
                    >
                        <div className="slider-knob">⇄</div>
                    </div>
                </div>
                <p className="usage-guide-hint">
                    핸들을 드래그해서 전, 후 이미지를 비교해 보세요.
                </p>
            </div>
        </section>
    )
}

export default UsageGuideSection


