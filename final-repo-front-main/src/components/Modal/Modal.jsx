import { useEffect, useRef } from 'react'
import './Modal.css'

const Modal = ({ isOpen, onClose, message, children, center = false, hideFooter = false, onConfirm }) => {
    const modalRef = useRef(null)
    const previousActiveElement = useRef(null)

    // ESC 키로 모달 닫기 및 body 스크롤 방지
    useEffect(() => {
        if (!isOpen) return

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose()
            }
        }

        // 현재 포커스된 요소 저장
        previousActiveElement.current = document.activeElement

        document.addEventListener('keydown', handleEscape)

        // 모달이 열릴 때 body 스크롤 방지
        document.body.style.overflow = 'hidden'

        return () => {
            document.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = ''

            // 모달이 닫힐 때 이전 포커스로 복원
            if (previousActiveElement.current) {
                previousActiveElement.current.focus()
            }
        }
    }, [isOpen, onClose])

    // 모달이 열릴 때 첫 번째 포커스 가능한 요소에 포커스
    useEffect(() => {
        if (isOpen && modalRef.current) {
            const focusableElement = modalRef.current.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
            if (focusableElement) {
                // 약간의 지연을 두어 애니메이션과 함께 포커스
                setTimeout(() => {
                    focusableElement.focus()
                }, 100)
            }
        }
    }, [isOpen])

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose()
        }
    }

    const handleConfirm = () => {
        if (onConfirm) {
            onConfirm()
        } else {
            onClose()
        }
    }

    if (!isOpen) return null

    return (
        <div
            className="modal-overlay"
            onClick={handleOverlayClick}
        >
            <div
                className="modal-container"
                onClick={(e) => e.stopPropagation()}
                ref={modalRef}
            >
                <div className={`modal-body${center ? ' center' : ''}`}>
                    {message && (
                        <p className="modal-message">
                            {message}
                        </p>
                    )}
                    {children}
                </div>
                {!hideFooter && (
                    <div className="modal-footer">
                        <button
                            className="modal-button"
                            onClick={handleConfirm}
                        >
                            확인
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Modal

