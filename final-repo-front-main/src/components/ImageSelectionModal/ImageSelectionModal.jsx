import { useState, useEffect } from 'react'
import './ImageSelectionModal.css'

const ImageSelectionModal = ({ isOpen, onClose, images, onSelect }) => {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(0)
        }
    }, [isOpen])

    if (!isOpen || !images || images.length < 2) {
        return null
    }

    const handleSelect = (selectedImage) => {
        if (onSelect) {
            onSelect(selectedImage)
        }
        onClose()
    }

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
    }

    const handleNext = () => {
        setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
    }

    return (
        <div className="image-selection-modal-overlay">
            <div className="image-selection-modal-container">
                <div className="image-selection-modal-header">
                    <h2>어떤 이미지가 마음에 드시나요?</h2>
                    <p>두 이미지 중 하나를 선택해주세요</p>
                </div>

                {/* 모바일 네비게이터 */}
                {isMobile ? (
                    <div className="image-selection-mobile-wrapper">
                        <div className="image-selection-navigator">
                            <button className="image-selection-nav-button prev" onClick={handlePrev}>
                                ‹
                            </button>
                            <div className="image-selection-counter">
                                {currentIndex + 1} / {images.length}
                            </div>
                            <button className="image-selection-nav-button next" onClick={handleNext}>
                                ›
                            </button>
                        </div>
                        <div className="image-selection-mobile-content">
                            <div className="image-selection-item">
                                <img
                                    src={images[currentIndex]}
                                    alt={`결과 이미지 ${currentIndex + 1}`}
                                    className="image-selection-preview"
                                />
                                <button
                                    className="image-selection-select-button"
                                    onClick={() => handleSelect(images[currentIndex])}
                                >
                                    이 이미지 선택하기
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="image-selection-modal-images">
                        {images.map((image, index) => (
                            <div
                                key={index}
                                className="image-selection-item"
                                onClick={() => handleSelect(image)}
                            >
                                <img
                                    src={image}
                                    alt={`결과 이미지 ${index + 1}`}
                                    className="image-selection-preview"
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default ImageSelectionModal

