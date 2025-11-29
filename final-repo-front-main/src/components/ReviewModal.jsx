import { useState, useEffect } from 'react'
import { submitReview } from '../utils/api'
import { setReviewCompleted } from '../utils/cookies'
import '../styles/ReviewModal.css'

const ReviewModal = ({ isOpen, onClose, pageType }) => {
    const [rating, setRating] = useState(0)
    const [hoverRating, setHoverRating] = useState(0)
    const [feedback, setFeedback] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // 모달이 열려있을 때 body에 클래스 추가
    useEffect(() => {
        if (isOpen) {
            document.body.classList.add('review-modal-open')
        } else {
            document.body.classList.remove('review-modal-open')
        }
        return () => {
            document.body.classList.remove('review-modal-open')
        }
    }, [isOpen])

    if (!isOpen) return null

    const handleStarClick = (value) => {
        setRating(value)
    }

    const handleStarHover = (value) => {
        setHoverRating(value)
    }

    const handleStarLeave = () => {
        setHoverRating(0)
    }

    const handleSubmit = async () => {
        if (rating === 0) {
            alert('별점을 선택해주세요.')
            return
        }

        setIsSubmitting(true)
        try {
            await submitReview({
                category: pageType, // 'general', 'custom', 'analysis'
                rating: rating,
                content: feedback.trim() || null
            })

            // 쿠키에 완료 표시 저장
            setReviewCompleted(pageType)
            onClose()
        } catch (error) {
            console.error('리뷰 제출 오류:', error)
            const errorMessage = error.response?.data?.detail || error.message || '리뷰 제출에 실패했습니다.'
            alert(errorMessage)
        } finally {
            setIsSubmitting(false)
        }
    }

    const pageTypeNames = {
        general: '일반피팅',
        custom: '커스텀피팅',
        analysis: '체형분석'
    }

    return (
        <div className="review-modal-overlay">
            <div className="review-modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="review-modal-content">
                    <h2 className="review-modal-title">서비스 이용 후기를 남겨주세요</h2>
                    <p className="review-modal-subtitle">{pageTypeNames[pageType]} 서비스는 어떠셨나요?</p>

                    <div className="review-stars-container">
                        {[1, 2, 3, 4, 5].map((value) => (
                            <button
                                key={value}
                                type="button"
                                className={`review-star ${value <= (hoverRating || rating) ? 'active' : ''}`}
                                onClick={() => handleStarClick(value)}
                                onMouseEnter={() => handleStarHover(value)}
                                onMouseLeave={handleStarLeave}
                                disabled={isSubmitting}
                            >
                                ★
                            </button>
                        ))}
                    </div>
                    <p className="review-rating-text">
                        {rating > 0 ? `${rating}점을 선택하셨습니다` : '별점을 선택해주세요'}
                    </p>

                    <div className="review-feedback-container">
                        <label htmlFor="review-feedback" className="review-feedback-label">
                            추가 개선요청사항 (선택사항)
                        </label>
                        <textarea
                            id="review-feedback"
                            className="review-feedback-textarea"
                            placeholder="서비스 개선을 위한 의견을 남겨주세요"
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            maxLength={500}
                            disabled={isSubmitting}
                        />
                        <div className="review-feedback-counter">
                            {feedback.length}/500
                        </div>
                    </div>

                    <div className="review-modal-actions">
                        <button
                            className="review-submit-button"
                            onClick={handleSubmit}
                            disabled={isSubmitting || rating === 0}
                        >
                            {isSubmitting ? '제출 중...' : '제출하기'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ReviewModal

