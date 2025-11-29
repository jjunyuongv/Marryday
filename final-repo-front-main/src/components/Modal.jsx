import '../styles/Modal.css'

const Modal = ({ isOpen, onClose, message, children, center = false, hideFooter = false, onConfirm }) => {
    if (!isOpen) return null

    const handleConfirm = () => {
        if (onConfirm) {
            onConfirm()
        } else {
            onClose()
        }
    }

    return (
        <div className="modal-overlay">
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                <div className={`modal-body${center ? ' center' : ''}`}>
                    {message && <p className="modal-message">{message}</p>}
                    {children}
                </div>
                {!hideFooter && (
                    <div className="modal-footer">
                        <button className="modal-button" onClick={handleConfirm}>
                            확인
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Modal

