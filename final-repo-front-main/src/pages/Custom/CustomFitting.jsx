import { useState, useRef, useEffect } from 'react'
import Lottie from 'lottie-react'
import { MdOutlineDownload } from 'react-icons/md'
import Modal from '../../components/Modal'
import ReviewModal from '../../components/ReviewModal'
import { customV4MatchImage, applyImageFilter, validatePerson } from '../../utils/api'
import { isReviewCompleted } from '../../utils/cookies'
import '../../styles/App.css'
import '../../styles/General/ImageUpload.css'
import '../../styles/Custom/CustomUpload.css'
import '../../styles/Custom/CustomResult.css'

const CustomFitting = ({ onBackToMain }) => {
    // Custom Fitting 상태
    const [fullBodyImage, setFullBodyImage] = useState(null)
    const [customDressImage, setCustomDressImage] = useState(null)
    const [customResultImage, setCustomResultImage] = useState(null)
    const [originalResultImage, setOriginalResultImage] = useState(null) // 원본 결과 이미지 저장
    const [selectedFilter, setSelectedFilter] = useState('none')
    const [isApplyingFilter, setIsApplyingFilter] = useState(false)
    const [isMatching, setIsMatching] = useState(false)
    const [isValidatingPerson, setIsValidatingPerson] = useState(false)
    const [loadingAnimation, setLoadingAnimation] = useState(null)
    const [errorModalOpen, setErrorModalOpen] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [currentStep, setCurrentStep] = useState(1)
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)
    const [progress, setProgress] = useState(0)

    // 로딩 메시지 목록 (순차적으로 표시, 마지막은 고정)
    const loadingMessages = [
        '이미지를 분석하고 있습니다...',
        '의상을 자연스럽게 합성하고 있습니다...',
        '배경을 입히는 중입니다...',
        '곧 완성됩니다. 잠시만 기다려주세요'
    ]

    // 로딩 메시지 전환 및 프로그레스 업데이트
    useEffect(() => {
        if (!isMatching) {
            setLoadingMessageIndex(0)
            setProgress(0)
            return
        }

        const startTime = Date.now()
        const estimatedDuration = 60000 // 예상 소요 시간 60초
        const maxProgressBeforeComplete = 99
        const timeouts = []

        // 각 메시지마다 타이머 설정 (완성 3초 전에 마지막 메시지 표시)
        // 첫 번째: 0초, 두 번째: 15초, 세 번째: 35초, 네 번째: 57초 (완성 3초 전)
        const messageTimings = [0, 15000, 35000, 57000]

        for (let i = 0; i < loadingMessages.length - 1; i++) {
            const timeout = setTimeout(() => {
                setLoadingMessageIndex(i + 1)
            }, messageTimings[i + 1])
            timeouts.push(timeout)
        }

        const progressInterval = setInterval(() => {
            const elapsed = Date.now() - startTime
            const progressPercent = Math.min(
                maxProgressBeforeComplete,
                (elapsed / estimatedDuration) * maxProgressBeforeComplete
            )

            setProgress(progressPercent)
        }, 200) // 0.2초마다 프로그레스 업데이트

        return () => {
            timeouts.forEach(timeout => clearTimeout(timeout))
            clearInterval(progressInterval)
        }
    }, [isMatching, loadingMessages.length])

    // 배경 선택 상태
    const [selectedBackgroundIndex, setSelectedBackgroundIndex] = useState(null)
    const backgroundImages = [
        '/Image/general/background4.png',
        '/Image/general/background1.jpg',
        '/Image/general/background2 (2).png',
        '/Image/general/background3.jpg'
    ]
    const backgroundLabels = ['피팅 룸', '야외 홀', '회색 스튜디오', '정원']

    // CustomUpload 상태
    const [fullBodyPreview, setFullBodyPreview] = useState(null)
    const [dressPreview, setDressPreview] = useState(null)
    const [isDraggingFullBody, setIsDraggingFullBody] = useState(false)
    const [isDraggingDress, setIsDraggingDress] = useState(false)
    const fullBodyInputRef = useRef(null)
    const dressInputRef = useRef(null)

    // CustomResult 상태
    const [showCheckmark, setShowCheckmark] = useState(false)
    const prevProcessingRef = useRef(isMatching)
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [isImageModalOpen, setIsImageModalOpen] = useState(false)
    const filterButtonsRef = useRef(null)
    const [reviewModalOpen, setReviewModalOpen] = useState(false)

    // 모바일 여부 확인
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // 모달이 열려있을 때 body에 클래스 추가
    useEffect(() => {
        if (isImageModalOpen) {
            document.body.classList.add('image-modal-open')
        } else {
            document.body.classList.remove('image-modal-open')
        }
        return () => {
            document.body.classList.remove('image-modal-open')
        }
    }, [isImageModalOpen])

    useEffect(() => {
        // Lottie 애니메이션 로드
        fetch('/Image/lottie/One line dress.json')
            .then(response => response.json())
            .then(data => setLoadingAnimation(data))
            .catch(error => console.error('Lottie 로드 실패:', error))
    }, [])

    // 배경 이미지 URL을 File 객체로 변환하는 함수
    const urlToFile = async (url, filename = 'background.jpg') => {
        try {
            // Vercel 프로덕션 환경에서는 상대 경로 사용
            let apiBaseUrl = ''
            if (typeof window !== 'undefined' && window.location.hostname.includes('marryday.co.kr')) {
                apiBaseUrl = '' // 상대 경로 사용
            } else {
                apiBaseUrl = import.meta.env.VITE_API_URL || 'http://marryday.kro.kr'
                // URL 끝의 슬래시 제거
                apiBaseUrl = apiBaseUrl.replace(/\/+$/, '')
            }
            const isExternalUrl = url.startsWith('http://') || url.startsWith('https://')
            const proxyUrl = isExternalUrl
                ? `${apiBaseUrl}/api/proxy-image?url=${encodeURIComponent(url)}`
                : url

            const response = await fetch(proxyUrl)
            if (!response.ok) {
                throw new Error(`배경 이미지를 가져올 수 없습니다: ${response.statusText}`)
            }
            const blob = await response.blob()
            return new File([blob], filename, { type: blob.type })
        } catch (error) {
            console.error('배경 이미지 변환 오류:', error)
            throw error
        }
    }

    // 배경 선택 핸들러
    const handleBackgroundSelect = (index) => {
        setSelectedBackgroundIndex(index)
        if (currentStep < 2) {
            setCurrentStep(2)
        }
    }

    // Custom Fitting 핸들러
    const handleFullBodyUpload = (image) => {
        setFullBodyImage(image)
        // 이미지가 변경되면 기존 매칭 결과 초기화 및 STEP 2로 이동
        if (image && customResultImage) {
            setCustomResultImage(null)
            setCurrentStep(2)
        }
    }

    const handleCustomDressUpload = (image) => {
        setCustomDressImage(image)
        // 이미지가 변경되면 기존 매칭 결과 초기화 및 STEP 2로 이동
        if (image && customResultImage) {
            setCustomResultImage(null)
            setCurrentStep(2)
        }
    }

    const handleManualMatch = async () => {
        if (!fullBodyImage) {
            setErrorMessage('전신사진을 업로드해주세요')
            setErrorModalOpen(true)
            return
        }

        if (!customDressImage) {
            setErrorMessage('드레스 이미지를 업로드해주세요')
            setErrorModalOpen(true)
            return
        }

        if (selectedBackgroundIndex === null) {
            setErrorMessage('배경을 먼저 선택해주세요')
            setErrorModalOpen(true)
            return
        }

        // STEP 3로 이동
        setCurrentStep(3)

        // 원본 드레스 이미지를 직접 사용하여 매칭 진행
        handleCustomMatch(fullBodyImage, customDressImage)
    }

    const handleCustomMatch = async (fullBody, dress) => {
        setIsMatching(true)
        setProgress(0)
        setLoadingMessageIndex(0)

        try {
            // 선택된 배경 이미지를 File 객체로 변환
            const backgroundImageUrl = backgroundImages[selectedBackgroundIndex]
            const backgroundFile = await urlToFile(backgroundImageUrl, `background${selectedBackgroundIndex + 1}.jpg`)

            const result = await customV4MatchImage(fullBody, dress, backgroundFile)

            if (result.success && result.result_image) {
                setProgress(100)
                setCustomResultImage(result.result_image)
                setOriginalResultImage(result.result_image) // 원본 이미지 저장
                setSelectedFilter('none') // 필터 초기화
                setIsMatching(false)
                setCurrentStep(3)

                // 리뷰 모달 표시 (1번만, 쿠키 확인)
                if (!isReviewCompleted('custom')) {
                    // 결과 이미지가 화면에 표시된 후 2~3초 후 모달 표시
                    setTimeout(() => {
                        setReviewModalOpen(true)
                    }, 3000)
                }
            } else {
                throw new Error(result.message || '매칭에 실패했습니다.')
            }
        } catch (error) {
            console.error('커스텀 매칭 중 오류 발생:', error)
            setIsMatching(false)
            setProgress(0)
            setErrorMessage(`매칭 중 오류가 발생했습니다: ${error.message}`)
            setErrorModalOpen(true)
        }
    }

    // CustomUpload 핸들러
    const handleFullBodyFileChange = (e) => {
        const file = e.target.files[0]
        if (file && file.type.startsWith('image/')) {
            handleFullBodyFile(file)
        }
    }

    const handleFullBodyFile = async (file) => {
        // 사람 감지 검증
        try {
            setIsValidatingPerson(true)
            const validationResult = await validatePerson(file)

            // 동물이 감지된 경우
            if (validationResult.is_animal) {
                setErrorMessage(validationResult.message || '동물이 감지되었습니다. 사람이 포함된 이미지를 업로드해주세요.')
                setErrorModalOpen(true)
                setIsValidatingPerson(false)
                return
            }

            if (!validationResult.success || !validationResult.is_person) {
                setErrorMessage(validationResult.message || '이미지에서 사람을 감지할 수 없습니다. 사람이 포함된 이미지를 업로드해주세요.')
                setErrorModalOpen(true)
                setIsValidatingPerson(false)
                return
            }

            // 사람이 감지되면 이미지 업로드 진행
            const reader = new FileReader()
            reader.onloadend = () => {
                setFullBodyPreview(reader.result)
                handleFullBodyUpload(file)
                setIsValidatingPerson(false)
            }
            reader.readAsDataURL(file)
        } catch (error) {
            console.error('사람 감지 오류:', error)
            setErrorMessage('이미지 검증 중 오류가 발생했습니다. 다시 시도해주세요.')
            setErrorModalOpen(true)
            setIsValidatingPerson(false)
        }
    }

    useEffect(() => {
        if (fullBodyImage instanceof File) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setFullBodyPreview(reader.result)
            }
            reader.readAsDataURL(fullBodyImage)
        } else if (!fullBodyImage) {
            setFullBodyPreview(null)
        }
    }, [fullBodyImage])

    const handleFullBodyDragOver = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDraggingFullBody(true)
    }

    const handleFullBodyDragLeave = (e) => {
        e.preventDefault()
        e.stopPropagation()

        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX
        const y = e.clientY

        if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
            setIsDraggingFullBody(false)
        }
    }

    const handleFullBodyDrop = (e) => {
        e.preventDefault()
        setIsDraggingFullBody(false)

        const file = e.dataTransfer.files[0]
        if (file && file.type.startsWith('image/')) {
            handleFullBodyFile(file)
        }
    }

    const handleFullBodyClick = () => {
        fullBodyInputRef.current?.click()
    }

    const handleFullBodyRemove = () => {
        setFullBodyPreview(null)
        handleFullBodyUpload(null)
        // 이미지 삭제 시 매칭 결과 초기화 및 STEP 2로 이동
        if (customResultImage) {
            setCustomResultImage(null)
            setCurrentStep(2)
        }
        if (fullBodyInputRef.current) {
            fullBodyInputRef.current.value = ''
        }
    }

    const handleDressFileChange = (e) => {
        const file = e.target.files[0]
        if (file && file.type.startsWith('image/')) {
            handleDressFile(file)
        }
    }

    const handleDressFile = (file) => {
        const reader = new FileReader()
        reader.onloadend = () => {
            setDressPreview(reader.result)
            handleCustomDressUpload(file)
        }
        reader.readAsDataURL(file)
    }

    useEffect(() => {
        if (customDressImage instanceof File) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setDressPreview(reader.result)
            }
            reader.readAsDataURL(customDressImage)
        } else if (!customDressImage) {
            setDressPreview(null)
        }
    }, [customDressImage])

    const handleDressDragOver = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDraggingDress(true)
    }

    const handleDressDragLeave = (e) => {
        e.preventDefault()
        e.stopPropagation()

        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX
        const y = e.clientY

        if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
            setIsDraggingDress(false)
        }
    }

    const handleDressDrop = (e) => {
        e.preventDefault()
        setIsDraggingDress(false)

        const file = e.dataTransfer.files[0]
        if (file && file.type.startsWith('image/')) {
            handleDressFile(file)
        }
    }

    const handleDressClick = () => {
        dressInputRef.current?.click()
    }

    const handleDressRemove = () => {
        setDressPreview(null)
        handleCustomDressUpload(null)
        // 이미지 삭제 시 매칭 결과 초기화 및 STEP 2로 이동
        if (customResultImage) {
            setCustomResultImage(null)
            setCurrentStep(2)
        }
        if (dressInputRef.current) {
            dressInputRef.current.value = ''
        }
    }

    // CustomResult 매칭 완료 감지
    useEffect(() => {
        // 필터 적용 중일 때는 완료 아이콘 표시하지 않음
        if (prevProcessingRef.current && !isMatching && customResultImage && !isApplyingFilter) {
            setShowCheckmark(true)
            const timer = setTimeout(() => {
                setShowCheckmark(false)
            }, 1500)
            return () => clearTimeout(timer)
        }
        prevProcessingRef.current = isMatching
    }, [isMatching, customResultImage, isApplyingFilter])

    const renderBackgroundButtons = () => (
        <div className="background-selector step-background-selector">
            {backgroundImages.map((bgImage, index) => (
                <button
                    key={index}
                    className={`background-button ${selectedBackgroundIndex === index ? 'active' : ''}`}
                    onClick={() => handleBackgroundSelect(index)}
                    disabled={isMatching}
                    title={`배경 ${index + 1} 선택`}
                >
                    {bgImage ? (
                        <img src={bgImage} alt={`배경 ${index + 1}`} />
                    ) : (
                        <span className="background-dot"></span>
                    )}
                    {backgroundLabels[index] && (
                        <span className="background-hover-label">{backgroundLabels[index]}</span>
                    )}
                </button>
            ))}
        </div>
    )

    const renderUploadArea = () => {
        // STEP 3에서 결과 이미지 표시
        if (currentStep === 3) {
            if (isMatching) {
                return (
                    <div className="image-upload-wrapper">
                        <div className="preview-container">
                            <div className="processing-overlay">
                                {loadingAnimation && (
                                    <Lottie animationData={loadingAnimation} loop={true} className="spinner-lottie" />
                                )}
                                <p className="loading-message">{loadingMessages[loadingMessageIndex]}</p>
                                <div className="progress-bar-container">
                                    <div className="progress-bar">
                                        <div
                                            className="progress-bar-fill"
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                    <span className="progress-text">{Math.round(progress)}%</span>
                                </div>
                                <p className="loading-notice">이미지의 해상도에따라 로딩 시간이 길어질 수 있습니다.</p>
                            </div>
                        </div>
                    </div>
                )
            }

            if (showCheckmark) {
                return (
                    <div className="image-upload-wrapper">
                        <div className="preview-container">
                            <div className="processing-overlay">
                                <div className="completion-icon">✓</div>
                                <p>매칭완료</p>
                            </div>
                        </div>
                    </div>
                )
            }

            if (customResultImage) {
                return (
                    <div className="image-upload-wrapper">
                        <div className="preview-container">
                            <img
                                src={customResultImage}
                                alt="Matching Result"
                                draggable="false"
                                className={`preview-image ${customResultImage ? 'clickable' : ''}`}
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    if (customResultImage && !isMatching) {
                                        setIsImageModalOpen(true)
                                    }
                                }}
                                onMouseDown={(e) => {
                                    if (customResultImage && !isMatching) {
                                        e.stopPropagation()
                                    }
                                }}
                                style={{ cursor: customResultImage && !isMatching ? 'pointer' : 'default', pointerEvents: isMatching ? 'none' : 'auto', userSelect: 'none' }}
                            />
                        </div>
                    </div>
                )
            }

            // STEP 3이지만 결과가 없을 때는 아무것도 표시하지 않음
            return null
        }

        // STEP 2에서는 빈 wrapper 반환 (CSS 적용을 위해)
        if (currentStep === 2) {
            return <div className="image-upload-wrapper"></div>
        }

        // STEP 1에서는 이미지 업로드 영역 없음
        return null
    }

    // 필터 적용 핸들러
    const handleFilterChange = async (filterPreset) => {
        if (!originalResultImage) return

        setSelectedFilter(filterPreset)

        if (filterPreset === 'none') {
            // 원본 이미지로 복원
            setCustomResultImage(originalResultImage)
            return
        }

        setIsApplyingFilter(true)
        try {
            const result = await applyImageFilter(originalResultImage, filterPreset)
            if (result.success) {
                setCustomResultImage(result.resultImage)
            } else {
                throw new Error(result.message || '필터 적용에 실패했습니다.')
            }
        } catch (error) {
            console.error('필터 적용 중 오류 발생:', error)
            setSelectedFilter('none')
            setCustomResultImage(originalResultImage)
            setErrorMessage('필터 적용에 실패했습니다. 다시 시도해주세요.')
            setErrorModalOpen(true)
        } finally {
            setIsApplyingFilter(false)
        }
    }

    const renderResultActions = () => {
        if (!customResultImage || isMatching) return null

        const filterPresets = [
            { value: 'none', label: '원본' },
            { value: 'grayscale', label: '흑백' },
            { value: 'vintage', label: '빈티지' },
            { value: 'warm', label: '따뜻한 톤' },
            { value: 'cool', label: '차가운 톤' },
            { value: 'high_contrast', label: '고대비' },
        ]

        return (
            <div className="step-result-actions">
                {originalResultImage && (
                    <div className="filter-buttons-container">
                        <span className="filter-label">
                            <i className="ri-filter-3-line"></i> 필터
                        </span>
                        <div className="filter-buttons-wrapper">
                            <div className="filter-buttons" ref={isMobile ? filterButtonsRef : null}>
                                {filterPresets.map((preset) => (
                                    <button
                                        key={preset.value}
                                        className={`filter-button ${selectedFilter === preset.value ? 'active' : ''}`}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleFilterChange(preset.value)
                                        }}
                                        disabled={isApplyingFilter}
                                        title={preset.label}
                                    >
                                        {preset.label}
                                        <div className="star-1">
                                            <svg
                                                xmlnsXlink="http://www.w3.org/1999/xlink"
                                                viewBox="0 0 784.11 815.53"
                                                style={{ shapeRendering: 'geometricPrecision', textRendering: 'geometricPrecision', imageRendering: 'optimizeQuality', fillRule: 'evenodd', clipRule: 'evenodd' }}
                                                version="1.1"
                                                xmlSpace="preserve"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <defs></defs>
                                                <g id="Layer_x0020_1">
                                                    <metadata id="CorelCorpID_0Corel-Layer"></metadata>
                                                    <path
                                                        d="M392.05 0c-20.9,210.08 -184.06,378.41 -392.05,407.78 207.96,29.37 371.12,197.68 392.05,407.74 20.93,-210.06 184.09,-378.37 392.05,-407.74 -207.98,-29.38 -371.16,-197.69 -392.06,-407.78z"
                                                        className="fil0"
                                                    ></path>
                                                </g>
                                            </svg>
                                        </div>
                                        <div className="star-2">
                                            <svg
                                                xmlnsXlink="http://www.w3.org/1999/xlink"
                                                viewBox="0 0 784.11 815.53"
                                                style={{ shapeRendering: 'geometricPrecision', textRendering: 'geometricPrecision', imageRendering: 'optimizeQuality', fillRule: 'evenodd', clipRule: 'evenodd' }}
                                                version="1.1"
                                                xmlSpace="preserve"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <defs></defs>
                                                <g id="Layer_x0020_1">
                                                    <metadata id="CorelCorpID_0Corel-Layer"></metadata>
                                                    <path
                                                        d="M392.05 0c-20.9,210.08 -184.06,378.41 -392.05,407.78 207.96,29.37 371.12,197.68 392.05,407.74 20.93,-210.06 184.09,-378.37 392.05,-407.74 -207.98,-29.38 -371.16,-197.69 -392.06,-407.78z"
                                                        className="fil0"
                                                    ></path>
                                                </g>
                                            </svg>
                                        </div>
                                        <div className="star-3">
                                            <svg
                                                xmlnsXlink="http://www.w3.org/1999/xlink"
                                                viewBox="0 0 784.11 815.53"
                                                style={{ shapeRendering: 'geometricPrecision', textRendering: 'geometricPrecision', imageRendering: 'optimizeQuality', fillRule: 'evenodd', clipRule: 'evenodd' }}
                                                version="1.1"
                                                xmlSpace="preserve"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <defs></defs>
                                                <g id="Layer_x0020_1">
                                                    <metadata id="CorelCorpID_0Corel-Layer"></metadata>
                                                    <path
                                                        d="M392.05 0c-20.9,210.08 -184.06,378.41 -392.05,407.78 207.96,29.37 371.12,197.68 392.05,407.74 20.93,-210.06 184.09,-378.37 392.05,-407.74 -207.98,-29.38 -371.16,-197.69 -392.06,-407.78z"
                                                        className="fil0"
                                                    ></path>
                                                </g>
                                            </svg>
                                        </div>
                                        <div className="star-4">
                                            <svg
                                                xmlnsXlink="http://www.w3.org/1999/xlink"
                                                viewBox="0 0 784.11 815.53"
                                                style={{ shapeRendering: 'geometricPrecision', textRendering: 'geometricPrecision', imageRendering: 'optimizeQuality', fillRule: 'evenodd', clipRule: 'evenodd' }}
                                                version="1.1"
                                                xmlSpace="preserve"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <defs></defs>
                                                <g id="Layer_x0020_1">
                                                    <metadata id="CorelCorpID_0Corel-Layer"></metadata>
                                                    <path
                                                        d="M392.05 0c-20.9,210.08 -184.06,378.41 -392.05,407.78 207.96,29.37 371.12,197.68 392.05,407.74 20.93,-210.06 184.09,-378.37 392.05,-407.74 -207.98,-29.38 -371.16,-197.69 -392.06,-407.78z"
                                                        className="fil0"
                                                    ></path>
                                                </g>
                                            </svg>
                                        </div>
                                        <div className="star-5">
                                            <svg
                                                xmlnsXlink="http://www.w3.org/1999/xlink"
                                                viewBox="0 0 784.11 815.53"
                                                style={{ shapeRendering: 'geometricPrecision', textRendering: 'geometricPrecision', imageRendering: 'optimizeQuality', fillRule: 'evenodd', clipRule: 'evenodd' }}
                                                version="1.1"
                                                xmlSpace="preserve"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <defs></defs>
                                                <g id="Layer_x0020_1">
                                                    <metadata id="CorelCorpID_0Corel-Layer"></metadata>
                                                    <path
                                                        d="M392.05 0c-20.9,210.08 -184.06,378.41 -392.05,407.78 207.96,29.37 371.12,197.68 392.05,407.74 20.93,-210.06 184.09,-378.37 392.05,-407.74 -207.98,-29.38 -371.16,-197.69 -392.06,-407.78z"
                                                        className="fil0"
                                                    ></path>
                                                </g>
                                            </svg>
                                        </div>
                                        <div className="star-6">
                                            <svg
                                                xmlnsXlink="http://www.w3.org/1999/xlink"
                                                viewBox="0 0 784.11 815.53"
                                                style={{ shapeRendering: 'geometricPrecision', textRendering: 'geometricPrecision', imageRendering: 'optimizeQuality', fillRule: 'evenodd', clipRule: 'evenodd' }}
                                                version="1.1"
                                                xmlSpace="preserve"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <defs></defs>
                                                <g id="Layer_x0020_1">
                                                    <metadata id="CorelCorpID_0Corel-Layer"></metadata>
                                                    <path
                                                        d="M392.05 0c-20.9,210.08 -184.06,378.41 -392.05,407.78 207.96,29.37 371.12,197.68 392.05,407.74 20.93,-210.06 184.09,-378.37 392.05,-407.74 -207.98,-29.38 -371.16,-197.69 -392.06,-407.78z"
                                                        className="fil0"
                                                    ></path>
                                                </g>
                                            </svg>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                <button
                    className="download-button"
                    onClick={async (e) => {
                        e.stopPropagation()
                        try {
                            if (customResultImage.startsWith('data:')) {
                                const link = document.createElement('a')
                                link.href = customResultImage
                                link.download = 'custom_match_result.png'
                                document.body.appendChild(link)
                                link.click()
                                document.body.removeChild(link)
                            } else {
                                const response = await fetch(customResultImage)
                                const blob = await response.blob()
                                const url = window.URL.createObjectURL(blob)
                                const link = document.createElement('a')
                                link.href = url
                                link.download = 'custom_match_result.png'
                                document.body.appendChild(link)
                                link.click()
                                document.body.removeChild(link)
                                window.URL.revokeObjectURL(url)
                            }
                        } catch (err) {
                            console.error('다운로드 실패:', err)
                            setErrorMessage('다운로드에 실패했습니다. 다시 시도해주세요.')
                            setErrorModalOpen(true)
                        }
                    }}
                    title="결과 이미지를 다운로드"
                >
                    <MdOutlineDownload /> 다운로드
                </button>
            </div>
        )
    }

    const renderStepContent = () => {
        if (currentStep === 1) {
            return (
                <div className="step-guide-panel">
                    <div className="step-badge">STEP 1</div>
                    <h3 className="step-title">피팅 배경을 먼저 선택해보세요</h3>
                    <p className="step-description">
                        아래 배경 버튼을 눌러 웨딩 피팅 공간의 무드를 선택하면{isMobile && <br />} STEP 2로 이동합니다.
                    </p>
                    {renderBackgroundButtons()}
                    <p className="step-tip">배경을 선택하면 자동으로 다음 단계가 열려요.</p>
                </div>
            )
        }

        if (currentStep === 2) {
            return (
                <div className="step-guide-panel step-guide-panel-step2">
                    <div className="step-2-header">
                        <div className="step-badge">STEP 2</div>
                        <div className="step-2-text">
                            <h3 className="step-title">
                                전신사진과 드레스 사진을 업로드하고{isMobile && <br />} 매칭하기를 선택해주세요
                            </h3>
                        </div>
                    </div>
                    <div className="step-panel-content">
                        <button type="button" className="step-link-button" onClick={() => setCurrentStep(1)}>
                            STEP 1 · 배경 다시 선택
                        </button>
                        {renderUploadArea()}
                    </div>
                </div>
            )
        }

        return (
            <div className="step-guide-panel step-guide-panel-step3">
                <div className="step-3-header">
                    <div className="step-badge">STEP 3</div>
                    <p className="step-3-message">매칭 결과가 표시됩니다</p>
                </div>
                {renderUploadArea()}
                {renderResultActions()}
                <div className="step-actions">
                    <button type="button" onClick={() => setCurrentStep(1)}>
                        STEP 1
                    </button>
                    <button type="button" onClick={() => setCurrentStep(2)}>
                        STEP 2
                    </button>
                </div>
            </div>
        )
    }

    return (
        <main className="main-content">
            <div className="fitting-container">
                <div className="content-wrapper custom-wrapper">
                    <div className="general-fitting-header">
                        <h2 className="general-fitting-title">커스텀피팅</h2>
                        <div className="tab-guide-text-wrapper">
                            <div className="tab-guide-text">
                                배경 제거부터 피팅까지, AI가 모두 자동으로 도와드립니다
                            </div>
                        </div>
                    </div>

                    <div className="custom-content-row">
                        <div className="right-container custom-right">
                            {/* 결과 이미지 영역 - STEP 구조 */}
                            <div className="image-upload">
                                {renderStepContent()}
                            </div>
                        </div>

                        <div className={`left-container custom-left ${currentStep === 1 ? 'disabled' : ''}`}>
                            {/* 사용자 이미지 업로드 영역 */}
                            <div className="custom-upload-card">
                                <input
                                    ref={fullBodyInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFullBodyFileChange}
                                    style={{ display: 'none' }}
                                />

                                {!fullBodyPreview ? (
                                    <div
                                        className={`custom-upload-area ${isDraggingFullBody ? 'dragging' : ''} ${isValidatingPerson ? 'processing' : ''}`}
                                        onDragOver={handleFullBodyDragOver}
                                        onDragLeave={handleFullBodyDragLeave}
                                        onDrop={handleFullBodyDrop}
                                        onClick={handleFullBodyClick}
                                    >
                                        {isValidatingPerson ? (
                                            <>
                                                <div className="validation-overlay"></div>
                                                <div className="validation-loader-wrapper">
                                                    <div className="loader"><span></span></div>
                                                    <p className="upload-text">이미지를 확인하고 있어요<br />잠시만 기다려주세요</p>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="upload-icon">
                                                    <img src="/Image/general/body_icon.png" alt="전신사진 아이콘" />
                                                </div>
                                                <p className="upload-text">전신 이미지를 <br /> 업로드 해주세요</p>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div
                                        className={`custom-preview-container ${isDraggingFullBody ? 'dragging' : ''}`}
                                        onDragOver={handleFullBodyDragOver}
                                        onDragLeave={handleFullBodyDragLeave}
                                        onDrop={handleFullBodyDrop}
                                    >
                                        <img src={fullBodyPreview} alt="Full Body" className="custom-preview-image" />
                                        {!isMatching && (
                                            <button className="custom-remove-button" onClick={handleFullBodyRemove}>
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* 드레스 이미지 업로드 영역 */}
                            <div className="custom-upload-card">
                                <input
                                    ref={dressInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleDressFileChange}
                                    style={{ display: 'none' }}
                                />

                                {!dressPreview ? (
                                    <div
                                        className={`custom-upload-area ${isDraggingDress ? 'dragging' : ''}`}
                                        onDragOver={handleDressDragOver}
                                        onDragLeave={handleDressDragLeave}
                                        onDrop={handleDressDrop}
                                        onClick={handleDressClick}
                                    >
                                        <div className="upload-icon">
                                            <img src="/Image/custom/dress_icon.png" alt="드레스 아이콘" />
                                        </div>
                                        <p className="upload-text">드레스 사진을 업로드 해주세요</p>
                                    </div>
                                ) : (
                                    <div
                                        className={`custom-preview-container ${isDraggingDress ? 'dragging' : ''}`}
                                        onDragOver={handleDressDragOver}
                                        onDragLeave={handleDressDragLeave}
                                        onDrop={handleDressDrop}
                                    >
                                        <img src={dressPreview} alt="Dress" className="custom-preview-image" />
                                        {!isMatching && (
                                            <button className="custom-remove-button" onClick={handleDressRemove}>
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* 매칭하기 버튼 */}
                            <button
                                className="analyze-button"
                                onClick={handleManualMatch}
                                disabled={isMatching || !fullBodyImage || !customDressImage || !!customResultImage}
                            >
                                {isMatching
                                    ? '매칭 중...'
                                    : customResultImage
                                        ? '매칭완료'
                                        : '매칭하기'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 에러 모달 */}
            <Modal
                isOpen={errorModalOpen}
                onClose={() => setErrorModalOpen(false)}
                message={errorMessage}
                center
            />

            {/* 이미지 확대 모달 */}
            {isImageModalOpen && (
                <div className="image-modal-overlay" onClick={() => setIsImageModalOpen(false)}>
                    <div className="image-modal-container" onClick={(e) => e.stopPropagation()}>
                        <button className="image-modal-close" onClick={() => setIsImageModalOpen(false)}>
                            ✕
                        </button>
                        <img
                            src={customResultImage}
                            alt="확대된 결과 이미지"
                            className="image-modal-image"
                        />
                    </div>
                </div>
            )}

            {/* 리뷰 모달 */}
            <ReviewModal
                isOpen={reviewModalOpen}
                onClose={() => setReviewModalOpen(false)}
                pageType="custom"
            />
        </main>
    )
}

export default CustomFitting
