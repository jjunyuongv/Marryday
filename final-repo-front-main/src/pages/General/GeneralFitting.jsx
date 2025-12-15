import { useState, useRef, useEffect, useCallback } from 'react'
import Lottie from 'lottie-react'
import { MdOutlineDownload } from 'react-icons/md'
import Modal from '../../components/Modal/Modal'
import ReviewModal from '../../components/ReviewModal/ReviewModal'
import ImageSelectionModal from '../../components/ImageSelectionModal/ImageSelectionModal'
import { autoMatchImageV5V5, getDresses, applyImageFilter, validatePerson } from '../../utils/api'
import { isReviewCompleted } from '../../utils/cookies'
import '../../styles/App.css'
import './ImageUpload.css'
import './DressSelection.css'

// trace_id 생성 함수
const generateTraceId = () => {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

const GeneralFitting = ({ onBackToMain, initialCategory, onCategorySet }) => {
    // General Fitting 상태
    const [uploadedImage, setUploadedImage] = useState(null)
    const [selectedDress, setSelectedDress] = useState(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [generalResultImage, setGeneralResultImage] = useState(null)
    const [originalResultImage, setOriginalResultImage] = useState(null) // 원본 결과 이미지 저장
    const [selectedFilter, setSelectedFilter] = useState('none')
    const [isApplyingFilter, setIsApplyingFilter] = useState(false)
    const [imageUploadModalOpen, setImageUploadModalOpen] = useState(false)
    const [pendingDress, setPendingDress] = useState(null)
    const [loadingAnimation, setLoadingAnimation] = useState(null)
    const [currentStep, setCurrentStep] = useState(1)
    const filterButtonsRef = useRef(null)
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [isImageModalOpen, setIsImageModalOpen] = useState(false)
    const [validationModalOpen, setValidationModalOpen] = useState(false)
    const [validationMessage, setValidationMessage] = useState('')
    const [isValidatingPerson, setIsValidatingPerson] = useState(false)
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)
    const [progress, setProgress] = useState(0)
    const [reviewModalOpen, setReviewModalOpen] = useState(false)
    const [imageSelectionModalOpen, setImageSelectionModalOpen] = useState(false)
    const [resultImages, setResultImages] = useState([]) // 두 개의 결과 이미지 저장
    
    // 프로파일링 관련 상태
    const [traceId, setTraceId] = useState(null)
    const profileTimingsRef = useRef({
        bg_select_ms: null,
        person_upload_ms: null,
        person_validate_ms: null,
        dress_drop_ms: null,
        compose_click_to_response_ms: null,
        result_image_load_ms: null
    })

    // 로딩 메시지 목록 (순차적으로 표시, 마지막은 고정)
    const loadingMessages = [
        '이미지를 분석하고 있습니다...',
        '의상을 자연스럽게 합성하고 있습니다...',
        '배경을 입히는 중입니다...',
        '곧 완성됩니다. 잠시만 기다려주세요'
    ]

    // 로딩 메시지 전환 및 프로그레스 업데이트
    useEffect(() => {
        if (!isProcessing) {
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
    }, [isProcessing, loadingMessages.length])

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

    // 배경 선택 상태
    const [selectedBackgroundIndex, setSelectedBackgroundIndex] = useState(null)
    const backgroundImages = [
        '/Image/general/background4.png',
        '/Image/general/background1.jpg',
        '/Image/general/background2 (2).png',
        '/Image/general/background3.jpg'
    ]

    // ImageUpload 상태
    const [preview, setPreview] = useState(null)
    const [isDragging, setIsDragging] = useState(false)
    const [showCheckmark, setShowCheckmark] = useState(false)
    const fileInputRef = useRef(null)
    const modalFileInputRef = useRef(null)  // 모달용 별도 ref
    const prevProcessingRef = useRef(isProcessing)

    // DressSelection 상태
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [scrollPosition, setScrollPosition] = useState(0)
    const [sliderHandleTop, setSliderHandleTop] = useState(0)
    const [displayCount, setDisplayCount] = useState(6)
    const [categoryStartIndex, setCategoryStartIndex] = useState(0)
    const [dresses, setDresses] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const isDraggingRef = useRef(false)
    const isScrollingFromSlider = useRef(false)
    const loadingMoreRef = useRef(false)
    const containerRef = useRef(null)
    const contentRef = useRef(null)
    const sliderTrackRef = useRef(null)
    const sliderHandleRef = useRef(null)
    const categoryButtonsRef = useRef(null)

    // 카테고리 정의
    const categories = [
        { id: 'all', name: '전체' },
        { id: 'ballgown', name: '벨라인' },
        { id: 'mermaid', name: '머메이드' },
        { id: 'princess', name: '프린세스' },
        { id: 'aline', name: 'A라인' },
        { id: 'slim', name: '슬림' },
        { id: 'trumpet', name: '트럼펫' },
        { id: 'mini', name: '미니드레스' },
        { id: 'squareneck', name: '스퀘어넥' },
        { id: 'hanbok', name: '한복' }
    ]

    // 한 번에 보여질 카테고리 수
    const categoriesPerView = 5
    const maxStartIndex = Math.max(0, categories.length - categoriesPerView)
    const visibleCategories = isMobile
        ? categories
        : categories.slice(categoryStartIndex, categoryStartIndex + categoriesPerView)

    // 스타일을 카테고리로 변환하는 함수
    const styleToCategory = (style) => {
        const styleMap = {
            'A라인': 'aline',
            '미니드레스': 'mini',
            '벨라인': 'ballgown',
            '프린세스': 'princess',
            '슬림': 'slim',
            '한복': 'hanbok',
            '머메이드': 'mermaid',
            '트럼펫': 'trumpet',
            '스퀘어넥': 'squareneck'
        }
        return styleMap[style] || 'all'
    }

    // initialCategory가 전달되면 카테고리 설정
    useEffect(() => {
        if (initialCategory) {
            setSelectedCategory(initialCategory)
            // 카테고리 인덱스 찾기
            const categoryIndex = categories.findIndex(cat => cat.id === initialCategory)
            if (categoryIndex !== -1) {
                // 카테고리가 보이는 위치로 스크롤
                const currentMaxStartIndex = Math.max(0, categories.length - categoriesPerView)
                const newStartIndex = Math.max(0, Math.min(categoryIndex, currentMaxStartIndex))
                setCategoryStartIndex(newStartIndex)
            }
            // 카테고리 설정 완료 후 초기화
            if (onCategorySet) {
                onCategorySet()
            }
        }
    }, [initialCategory, categories, categoriesPerView, onCategorySet])

    // 드레스 목록 로드
    useEffect(() => {
        const loadDresses = async () => {
            try {
                setLoading(true)
                setError(null)
                const response = await getDresses()

                if (response.success && response.data) {
                    // DB에서 받은 URL을 백엔드 프록시를 통해 제공
                    // Vercel 프로덕션 환경에서는 상대 경로 사용
                    let apiBaseUrl = ''
                    if (typeof window !== 'undefined' && window.location.hostname.includes('marryday.co.kr')) {
                        apiBaseUrl = '' // 상대 경로 사용
                    } else {
                        apiBaseUrl = import.meta.env.VITE_API_URL || 'http://marryday.kro.kr'
                        // URL 끝의 슬래시 제거
                        apiBaseUrl = apiBaseUrl.replace(/\/+$/, '')
                    }
                    const transformedDresses = response.data.map((dress) => ({
                        id: dress.id,
                        name: dress.image_name.replace(/\.[^/.]+$/, ''),
                        // 썸네일은 백엔드 프록시 사용, 실제 합성에는 원본 S3 URL 사용
                        image: `${apiBaseUrl}/api/proxy-image?url=${encodeURIComponent(dress.url)}`,
                        originalUrl: dress.url,  // 합성용 원본 URL 보관
                        description: `${dress.style} 스타일의 드레스`,
                        category: styleToCategory(dress.style),
                        fitting_count: dress.fitting_count || 0  // 피팅 횟수 (백엔드에서 제공)
                    }))
                    
                    // 카테고리별로 그룹화하고 각 카테고리 내에서 피팅 횟수로 내림차순 정렬
                    const groupedByCategory = transformedDresses.reduce((acc, dress) => {
                        const category = dress.category
                        if (!acc[category]) {
                            acc[category] = []
                        }
                        acc[category].push(dress)
                        return acc
                    }, {})
                    
                    // 각 카테고리 내에서 피팅 횟수로 내림차순 정렬
                    Object.keys(groupedByCategory).forEach(category => {
                        groupedByCategory[category].sort((a, b) => 
                            (b.fitting_count || 0) - (a.fitting_count || 0)
                        )
                    })
                    
                    // 카테고리 순서대로 평탄화
                    const sortedDresses = []
                    categories.forEach(cat => {
                        if (groupedByCategory[cat.id]) {
                            sortedDresses.push(...groupedByCategory[cat.id])
                        }
                    })
                    
                    setDresses(sortedDresses.length > 0 ? sortedDresses : transformedDresses)
                } else {
                    setError('드레스 목록을 불러올 수 없습니다.')
                    setDresses([])
                }
            } catch (err) {
                console.error('드레스 목록 로드 오류:', err)
                setError('드레스 목록을 불러오는 중 오류가 발생했습니다.')
                setDresses([])
            } finally {
                setLoading(false)
            }
        }

        loadDresses()
    }, [])

    useEffect(() => {
        // Lottie 애니메이션 로드
        fetch('/Image/lottie/One line dress.json')
            .then(response => response.json())
            .then(data => setLoadingAnimation(data))
            .catch(error => console.error('Lottie 로드 실패:', error))
    }, [])

    // 이미지 선택 모달이 열릴 때 body에 클래스 추가하여 헤더 숨기기
    useEffect(() => {
        if (imageSelectionModalOpen) {
            document.body.classList.add('image-selection-modal-open')
        } else {
            document.body.classList.remove('image-selection-modal-open')
        }

        return () => {
            document.body.classList.remove('image-selection-modal-open')
        }
    }, [imageSelectionModalOpen])

    // 매칭 완료 감지
    useEffect(() => {
        // 필터 적용 중일 때는 완료 아이콘 표시하지 않음
        if (prevProcessingRef.current && !isProcessing && generalResultImage && !isApplyingFilter) {
            setShowCheckmark(true)
            const timer = setTimeout(() => {
                setShowCheckmark(false)
            }, 1500)
            return () => clearTimeout(timer)
        }
        prevProcessingRef.current = isProcessing
    }, [isProcessing, generalResultImage, isApplyingFilter])

    // General Fitting 핸들러
    const handleImageUpload = (image) => {
        setUploadedImage(image)
        setGeneralResultImage(null)
        if (image) {
            setCurrentStep(3)
        } else if (currentStep > 1) {
            setCurrentStep(2)
        }
    }

    const handleDressSelect = (dress) => {
        setSelectedDress(dress)
    }

    // 배경 이미지 URL을 File 객체로 변환하는 함수 (CORS 문제 해결을 위해 프록시 사용)
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
            // 로컬 이미지 경로인 경우 그대로 사용, 외부 URL인 경우 프록시 사용
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
        // trace_id 생성 (피팅 1회 시작)
        if (!traceId) {
            const newTraceId = generateTraceId()
            setTraceId(newTraceId)
        }
        
        // 배경 선택 시간 측정 시작
        if (profileTimingsRef.current.bg_select_ms === null) {
            profileTimingsRef.current.bg_select_start = Date.now()
        }
        
        setSelectedBackgroundIndex(index)
        if (currentStep < 2) {
            setCurrentStep(2)
        }
        
        // 배경 선택 완료 시간 측정
        if (profileTimingsRef.current.bg_select_start) {
            profileTimingsRef.current.bg_select_ms = Date.now() - profileTimingsRef.current.bg_select_start
        }
    }

    const handleDressDropped = async (dress) => {
        if (!uploadedImage || !dress) return

        if (selectedBackgroundIndex === null) {
            alert('배경을 먼저 선택해주세요.')
            return
        }

        // trace_id 생성 (피팅 1회 시작)
        if (!traceId) {
            const newTraceId = generateTraceId()
            setTraceId(newTraceId)
        }
        
        // 드레스 드롭 시간 측정 시작
        const dressDropStart = Date.now()

        setIsProcessing(true)
        setProgress(0)
        setLoadingMessageIndex(0)

        try {
            // 선택된 배경 이미지를 File 객체로 변환
            const backgroundImageUrl = backgroundImages[selectedBackgroundIndex]
            const backgroundFile = await urlToFile(backgroundImageUrl, `background${selectedBackgroundIndex + 1}.jpg`)

            // 드레스 드롭 시간 측정 완료 (드레스 업로드 완료)
            profileTimingsRef.current.dress_drop_ms = Date.now() - dressDropStart
            
            // 합성 클릭 시간 측정 시작
            const composeClickStart = Date.now()

            const result = await autoMatchImageV5V5(
                uploadedImage, 
                dress, 
                backgroundFile,
                traceId,
                profileTimingsRef.current
            )
            
            // 합성 클릭~응답 수신 시간 측정 완료
            profileTimingsRef.current.compose_click_to_response_ms = Date.now() - composeClickStart

            setProgress(100)
            setSelectedDress(dress)
            setSelectedFilter('none') // 필터 초기화

            // /tryon/compare 엔드포인트는 V4V5CompareResponse를 반환 (v4_result와 v5_result 포함)
            const images = []

            // v4_result에서 이미지 추출
            if (result.v4_result) {
                const v4Result = result.v4_result
                const v4Image = v4Result.result_image
                if (v4Image && typeof v4Image === 'string' && v4Image.trim().length > 0) {
                    images.push(v4Image)
                }
            }

            // v5_result에서 이미지 추출
            if (result.v5_result) {
                const v5Result = result.v5_result
                const v5Image = v5Result.result_image
                if (v5Image && typeof v5Image === 'string' && v5Image.trim().length > 0) {
                    images.push(v5Image)
                }
            }

            // 결과 이미지 로딩 시간 측정 시작
            const resultImageLoadStart = Date.now()
            
            // 두 개의 이미지가 있는 경우 모달 표시
            if (images.length >= 2) {
                setResultImages(images)
                setImageSelectionModalOpen(true)
                // 결과 이미지 로딩 시간 측정 완료 (화면 표시 완료)
                setTimeout(() => {
                    profileTimingsRef.current.result_image_load_ms = Date.now() - resultImageLoadStart
                }, 100)
            } else if (images.length === 1) {
                // 하나의 이미지만 있는 경우
                setGeneralResultImage(images[0])
                setOriginalResultImage(images[0])
                
                // 결과 이미지 로딩 시간 측정 완료 (화면 표시 완료)
                setTimeout(() => {
                    profileTimingsRef.current.result_image_load_ms = Date.now() - resultImageLoadStart
                }, 100)

                // 리뷰 모달 표시 (1번만, 쿠키 확인)
                if (!isReviewCompleted('general')) {
                    setTimeout(() => {
                        setReviewModalOpen(true)
                    }, 3000)
                }
            } else if (result.success && result.result_image) {
                // 단일 이미지 응답인 경우 (기존 동작 유지, 호환성)
                setGeneralResultImage(result.result_image)
                setOriginalResultImage(result.result_image)
                
                // 결과 이미지 로딩 시간 측정 완료 (화면 표시 완료)
                setTimeout(() => {
                    profileTimingsRef.current.result_image_load_ms = Date.now() - resultImageLoadStart
                }, 100)

                // 리뷰 모달 표시 (1번만, 쿠키 확인)
                if (!isReviewCompleted('general')) {
                    setTimeout(() => {
                        setReviewModalOpen(true)
                    }, 3000)
                }
            } else {
                // 이미지가 없는 경우 에러 메시지 확인
                const errorMsg = result.message || result.v4_result?.message || result.v5_result?.message || '결과 이미지를 찾을 수 없습니다.'
                throw new Error(errorMsg)
            }

            setIsProcessing(false)
        } catch (error) {
            console.error('매칭 중 오류 발생:', error)
            setIsProcessing(false)
            setProgress(0)
            const serverMessage = error?.response?.data?.message || error?.response?.data?.error
            const friendly = serverMessage
                || (error?.code === 'ERR_NETWORK' ? '백엔드 서버에 연결할 수 없습니다.' : null)
                || error.message
            alert(`매칭 중 오류가 발생했습니다: ${friendly}`)
        }
    }

    const openImageUploadModal = (dress) => {
        setPendingDress(dress)
        setImageUploadModalOpen(true)
    }

    const closeImageUploadModal = () => {
        setImageUploadModalOpen(false)
        setPendingDress(null)
        // 모달이 닫힐 때 모달 input 초기화
        if (modalFileInputRef.current) {
            modalFileInputRef.current.value = ''
        }
    }

    const handleImageUploadedForDress = (image) => {
        if (image) {
            handleFile(image)
        }
        closeImageUploadModal()

        if (pendingDress) {
            setTimeout(() => {
                handleDressDropped(pendingDress)
            }, 100)
        }
    }

    const handleImageUploadRequired = (dress) => {
        openImageUploadModal(dress)
    }

    // ImageUpload 핸들러
    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file && file.type.startsWith('image/')) {
            handleFile(file)
        }
    }

    const handleFile = async (file) => {
        // trace_id 생성 (피팅 1회 시작)
        if (!traceId) {
            const newTraceId = generateTraceId()
            setTraceId(newTraceId)
        }
        
        // 인물 업로드 시간 측정 시작
        const personUploadStart = Date.now()
        
        // 사람 감지 검증
        try {
            setIsValidatingPerson(true)
            
            // 인물 검증 시간 측정 시작
            const personValidateStart = Date.now()
            
            const validationResult = await validatePerson(file)
            
            // 인물 검증 시간 측정 완료
            profileTimingsRef.current.person_validate_ms = Date.now() - personValidateStart

            // 동물이 감지된 경우
            if (validationResult.is_animal) {
                setValidationMessage(validationResult.message || '동물이 감지되었습니다. 사람이 포함된 이미지를 업로드해주세요.')
                setValidationModalOpen(true)
                setIsValidatingPerson(false)
                return
            }

            if (!validationResult.success || !validationResult.is_person) {
                setValidationMessage(validationResult.message || '이미지에서 사람을 감지할 수 없습니다. 사람이 포함된 이미지를 업로드해주세요.')
                setValidationModalOpen(true)
                setIsValidatingPerson(false)
                return
            }

            // 사람이 감지되면 이미지 업로드 진행
            setIsValidatingPerson(false)
            const reader = new FileReader()
            reader.onloadend = () => {
                setPreview(reader.result)
                handleImageUpload(file)
                
                // 인물 업로드 시간 측정 완료
                profileTimingsRef.current.person_upload_ms = Date.now() - personUploadStart
            }
            reader.readAsDataURL(file)
        } catch (error) {
            console.error('사람 감지 오류:', error)
            setValidationMessage('이미지 검증 중 오류가 발생했습니다. 다시 시도해주세요.')
            setValidationModalOpen(true)
            setIsValidatingPerson(false)
        }
    }

    const handleDragOver = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }

    const handleDragLeave = (e) => {
        e.preventDefault()
        e.stopPropagation()

        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX
        const y = e.clientY

        if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
            setIsDragging(false)
        }
    }

    const handleDrop = (e) => {
        e.preventDefault()
        setIsDragging(false)

        const dressData = e.dataTransfer.getData('application/json')
        if (dressData) {
            try {
                const dress = JSON.parse(dressData)

                if (!preview && handleImageUploadRequired) {
                    handleImageUploadRequired(dress)
                    return
                }

                if (handleDressDropped) {
                    handleDressDropped(dress)
                }
                return
            } catch (error) {
                console.error('드레스 데이터 파싱 오류:', error)
            }
        }

        const file = e.dataTransfer.files[0]
        if (file && file.type.startsWith('image/')) {
            handleFile(file)
        }
    }

    const handleClick = () => {
        fileInputRef.current?.click()
    }

    const handleRemove = () => {
        setPreview(null)
        handleImageUpload(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    // DressSelection 핸들러
    const filteredDresses = selectedCategory === 'all'
        ? dresses
        : dresses.filter(dress => dress.category === selectedCategory)
    
    // 선택된 카테고리 내에서도 피팅 횟수로 정렬 (이미 정렬되어 있지만 확실하게)
    const sortedFilteredDresses = [...filteredDresses].sort((a, b) => {
        // fitting_count가 있으면 그것으로 정렬, 없으면 기존 순서 유지
        if (a.fitting_count !== undefined && b.fitting_count !== undefined) {
            return (b.fitting_count || 0) - (a.fitting_count || 0)
        }
        return 0
    })

    const dressesToRender = isMobile ? sortedFilteredDresses : sortedFilteredDresses.slice(0, displayCount)

    const handleDressClick = (dress) => {
        if (isProcessing) return

        // 모바일에서는 클릭 시 바로 매칭
        if (isMobile) {
            if (!uploadedImage) {
                // 이미지가 없으면 업로드 모달 열기
                handleImageUploadRequired(dress)
            } else {
                // 이미지가 있으면 바로 매칭
                handleDressDropped(dress)
            }
        } else {
            // 웹 버전은 기존대로 선택만
            handleDressSelect(dress)
        }
    }

    const handleCategoryClick = (categoryId) => {
        // 같은 카테고리를 다시 선택해도 스크롤 초기화를 보장하기 위해 먼저 스크롤 초기화
        if (contentRef.current) {
            contentRef.current.scrollTop = 0
            // 모바일에서 드레스 그리드 가로 스크롤 초기화
            if (isMobile) {
                contentRef.current.scrollLeft = 0
            }
        }
        // 모바일에서 카테고리 버튼 가로 스크롤 초기화
        if (isMobile && categoryButtonsRef.current) {
            categoryButtonsRef.current.scrollLeft = 0
        }

        setSelectedCategory(categoryId)
        setDisplayCount(6)
        setScrollPosition(0)

        // DOM 업데이트 후에도 다시 한 번 스크롤 초기화 (확실하게)
        requestAnimationFrame(() => {
            if (contentRef.current) {
                contentRef.current.scrollTop = 0
                if (isMobile) {
                    contentRef.current.scrollLeft = 0
                }
            }
            if (isMobile && categoryButtonsRef.current) {
                categoryButtonsRef.current.scrollLeft = 0
            }
        })
    }

    const handleDragStart = (e, dress) => {
        e.dataTransfer.effectAllowed = 'copy'
        try { e.dataTransfer.dropEffect = 'copy' } catch { }
        e.dataTransfer.setData('application/json', JSON.stringify(dress))
        setSelectedDress(dress) // 드래그 시작 시 드레스 선택
        try {
            document.body.classList.add('dragging-dress')
        } catch { }
        const forceCopyCursor = (ev) => {
            ev.preventDefault()
            try { ev.dataTransfer.dropEffect = 'copy' } catch { }
        }
        const resetCursor = () => {
            try {
                document.body.classList.remove('dragging-dress')
            } catch { }
            window.removeEventListener('dragover', forceCopyCursor)
            window.removeEventListener('dragend', resetCursor)
            window.removeEventListener('drop', resetCursor)
            window.removeEventListener('mouseup', resetCursor)
        }
        window.addEventListener('dragover', forceCopyCursor)
        window.addEventListener('dragend', resetCursor)
        window.addEventListener('drop', resetCursor)
        window.addEventListener('mouseup', resetCursor)
    }

    // 슬라이더 위치 업데이트
    useEffect(() => {
        if (isDraggingRef.current && containerRef.current && contentRef.current) {
            isScrollingFromSlider.current = true
            const maxScroll = contentRef.current.scrollHeight - containerRef.current.clientHeight
            if (maxScroll > 0) {
                contentRef.current.scrollTop = (scrollPosition / 100) * maxScroll
            }
            setTimeout(() => {
                isScrollingFromSlider.current = false
            }, 50)
        }
    }, [scrollPosition])

    // 스크롤 이벤트로 슬라이더 위치 동기화
    useEffect(() => {
        const container = contentRef.current
        if (!container) return

        const handleScroll = () => {
            if (isScrollingFromSlider.current) return

            const maxScroll = container.scrollHeight - container.clientHeight
            if (maxScroll > 0) {
                const currentScroll = container.scrollTop
                const percentage = (currentScroll / maxScroll) * 100
                setScrollPosition(percentage)

                const nearBottom = maxScroll - currentScroll <= container.clientHeight * 0.2
                if (nearBottom && displayCount < filteredDresses.length && !loadingMoreRef.current) {
                    loadingMoreRef.current = true
                    setDisplayCount(prev => Math.min(prev + 6, filteredDresses.length))
                } else if (!nearBottom) {
                    loadingMoreRef.current = false
                }
            } else {
                setScrollPosition(0)
            }
        }

        container.addEventListener('scroll', handleScroll)
        return () => {
            container.removeEventListener('scroll', handleScroll)
        }
    }, [displayCount, filteredDresses.length])

    const updateSliderHandleTop = useCallback((percentage) => {
        const track = sliderTrackRef.current
        const handle = sliderHandleRef.current
        if (!track || !handle) return
        const trackHeight = track.clientHeight
        const handleHeight = handle.clientHeight
        if (trackHeight <= handleHeight) {
            setSliderHandleTop(0)
            return
        }
        const maxTop = trackHeight - handleHeight
        const newTop = (percentage / 100) * maxTop
        setSliderHandleTop(newTop)
    }, [])

    const updateSliderPosition = useCallback((clientY) => {
        const track = sliderTrackRef.current
        const handle = sliderHandleRef.current
        if (!track || !handle) return
        const rect = track.getBoundingClientRect()
        const trackHeight = rect.height
        const handleHeight = handle.clientHeight
        const maxTop = trackHeight - handleHeight
        if (maxTop <= 0) {
            setScrollPosition(0)
            return
        }
        const offsetY = clientY - rect.top - handleHeight / 2
        const clamped = Math.max(0, Math.min(maxTop, offsetY))
        const percentage = (clamped / maxTop) * 100
        setScrollPosition(percentage)
    }, [])

    useEffect(() => {
        updateSliderHandleTop(scrollPosition)
    }, [scrollPosition, updateSliderHandleTop])

    // 카테고리 변경 시 스크롤 초기화
    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollTop = 0
            // 모바일에서 드레스 그리드 가로 스크롤 초기화
            if (isMobile) {
                contentRef.current.scrollLeft = 0
            }
        }
        // 모바일에서 카테고리 버튼 가로 스크롤 초기화
        if (isMobile && categoryButtonsRef.current) {
            categoryButtonsRef.current.scrollLeft = 0
        }
    }, [selectedCategory, isMobile])

    useEffect(() => {
        const container = contentRef.current
        if (!container) return
        const maxScroll = container.scrollHeight - container.clientHeight
        if (maxScroll > 0) {
            const percentage = (container.scrollTop / maxScroll) * 100
            setScrollPosition(percentage)
        } else {
            setScrollPosition(0)
        }
        loadingMoreRef.current = false
    }, [displayCount, filteredDresses.length])

    const handleSliderMouseMove = useCallback((e) => {
        if (isDraggingRef.current) {
            e.preventDefault()
            updateSliderPosition(e.clientY)
        }
    }, [updateSliderPosition])

    const handleSliderMouseUp = useCallback(() => {
        isDraggingRef.current = false
        document.removeEventListener('mousemove', handleSliderMouseMove)
        document.removeEventListener('mouseup', handleSliderMouseUp)
    }, [handleSliderMouseMove])

    const handleSliderMouseDown = (e) => {
        e.preventDefault()
        isDraggingRef.current = true
        updateSliderPosition(e.clientY)
        document.addEventListener('mousemove', handleSliderMouseMove)
        document.addEventListener('mouseup', handleSliderMouseUp)
    }

    const handleArrowClick = (direction) => {
        isDraggingRef.current = true
        const step = 10
        if (direction === 'up') {
            setScrollPosition(Math.max(0, scrollPosition - step))
        } else {
            setScrollPosition(Math.min(100, scrollPosition + step))
        }
        setTimeout(() => {
            isDraggingRef.current = false
        }, 100)
    }

    const handleCategoryNavigation = (direction) => {
        if (direction === 'prev' && categoryStartIndex > 0) {
            setCategoryStartIndex(categoryStartIndex - 1)
        } else if (direction === 'next' && categoryStartIndex < maxStartIndex) {
            setCategoryStartIndex(categoryStartIndex + 1)
        }
    }

    const imageSrc = generalResultImage || preview
    const canDownload = !isProcessing && !!generalResultImage
    const steps = [
        { id: 1, label: '배경 선택' },
        { id: 2, label: '이미지 업로드' },
        { id: 3, label: '드레스 드래그' }
    ]

    const backgroundLabels = ['피팅 룸', '야외 홀', '회색 스튜디오', '정원']

    const renderBackgroundButtons = () => (
        <div className="background-selector step-background-selector">
            {backgroundImages.map((bgImage, index) => (
                <button
                    key={index}
                    className={`background-button ${selectedBackgroundIndex === index ? 'active' : ''}`}
                    onClick={() => handleBackgroundSelect(index)}
                    disabled={isProcessing}
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

    const renderUploadArea = () => (
        <div className="image-upload-wrapper">
            {!preview ? (
                <div
                    className={`upload-area ${isDragging ? 'dragging' : ''} ${isValidatingPerson ? 'processing' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={handleClick}
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
                            <p className="upload-text">전신 이미지를 업로드 해주세요</p>
                            <p className="upload-subtext">JPG, PNG, JPEG 형식 지원</p>
                        </>
                    )}
                </div>
            ) : (
                <div
                    className={`preview-container ${isDragging ? 'dragging' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <img
                        src={imageSrc}
                        alt="Preview"
                        draggable="false"
                        className={`preview-image ${generalResultImage ? 'clickable' : ''}`}
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            // 결과 이미지가 있을 때만 모달 열기
                            if (generalResultImage && !isProcessing) {
                                setIsImageModalOpen(true)
                            }
                        }}
                        onMouseDown={(e) => {
                            if (generalResultImage && !isProcessing) {
                                e.stopPropagation()
                            }
                        }}
                        style={{ cursor: generalResultImage && !isProcessing ? 'pointer' : 'default', pointerEvents: isProcessing ? 'none' : 'auto', userSelect: 'none' }}
                    />
                    {isProcessing && (
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
                    )}
                    {showCheckmark && (
                        <div className="processing-overlay">
                            <div className="completion-icon">✓</div>
                            <p>매칭완료</p>
                        </div>
                    )}
                    {isDragging && (
                        <div className="drop-overlay">
                            <p>드레스를 여기에 드롭하세요</p>
                        </div>
                    )}
                    {!isProcessing && generalResultImage && (
                        <button className="remove-button" onClick={handleRemove}>
                            ✕
                        </button>
                    )}
                </div>
            )}
        </div>
    )

    // 필터 적용 핸들러
    const handleFilterChange = async (filterPreset) => {
        if (!originalResultImage) return

        setSelectedFilter(filterPreset)

        if (filterPreset === 'none') {
            // 원본 이미지로 복원
            setGeneralResultImage(originalResultImage)
            return
        }

        setIsApplyingFilter(true)
        try {
            const result = await applyImageFilter(originalResultImage, filterPreset)
            if (result.success) {
                setGeneralResultImage(result.resultImage)
            } else {
                throw new Error(result.message || '필터 적용에 실패했습니다.')
            }
        } catch (error) {
            console.error('필터 적용 중 오류 발생:', error)
            setSelectedFilter('none')
            setGeneralResultImage(originalResultImage)
        } finally {
            setIsApplyingFilter(false)
        }
    }

    const renderResultActions = () => {
        if (!canDownload || !imageSrc || isProcessing) return null

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
                        {isMobile ? (
                            <button
                                className="filter-label filter-toggle-button"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setIsFilterOpen(!isFilterOpen)
                                }}
                            >
                                <i className="ri-filter-3-line"></i> 필터
                            </button>
                        ) : (
                            <span className="filter-label">
                                <i className="ri-filter-3-line"></i> 필터
                            </span>
                        )}
                        {(!isMobile || isFilterOpen) && (
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
                        )}
                    </div>
                )}
                <button
                    className="download-button"
                    onClick={(e) => {
                        e.stopPropagation()
                        try {
                            const link = document.createElement('a')
                            link.href = imageSrc
                            link.download = 'match_result.png'
                            document.body.appendChild(link)
                            link.click()
                            document.body.removeChild(link)
                        } catch (err) {
                            console.error('다운로드 실패:', err)
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
                <div className={`step-guide-panel ${isValidatingPerson ? 'validating' : ''}`}>
                    {isValidatingPerson && (
                        <>
                            <div className="step-guide-panel-overlay"></div>
                            <div className="step-guide-panel-loader-wrapper">
                                <div className="loader"><span></span></div>
                                <p className="upload-text">이미지를 확인하고 있어요<br />잠시만 기다려주세요</p>
                            </div>
                        </>
                    )}
                    <div className="step-badge">STEP 1</div>
                    <h3 className="step-title">피팅 배경을 먼저 선택해보세요</h3>
                    <p className="step-description">
                        아래 배경 버튼을 눌러 웨딩 피팅 공간의 배경을 선택하면{isMobile && <br />} STEP 2로 이동합니다.
                    </p>
                    {renderBackgroundButtons()}
                    <p className="step-tip">배경을 선택하면 자동으로 다음 단계가 열려요.</p>
                </div>
            )
        }

        if (currentStep === 2) {
            return (
                <div className={`step-guide-panel step-guide-panel-step2 ${isValidatingPerson ? 'validating' : ''}`}>
                    {isValidatingPerson && (
                        <>
                            <div className="step-guide-panel-overlay"></div>
                            <div className="step-guide-panel-loader-wrapper">
                                <div className="loader"><span></span></div>
                                <p className="upload-text">이미지를 확인하고 있어요<br />잠시만 기다려주세요</p>
                            </div>
                        </>
                    )}
                    <div className="step-2-header">
                        <div className="step-badge">STEP 2</div>
                        <div className="step-2-text">
                            <h3 className="step-title">전신 이미지를 업로드해주세요</h3>
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
            <div className={`step-guide-panel step-guide-panel-step3 ${isValidatingPerson ? 'validating' : ''}`}>
                {isValidatingPerson && (
                    <>
                        <div className="step-guide-panel-overlay"></div>
                        <div className="step-guide-panel-loader-wrapper">
                            <div className="loader"></div>
                            <p className="upload-text">이미지를 확인하고 있어요<br />잠시만 기다려주세요</p>
                        </div>
                    </>
                )}
                {!(isProcessing || generalResultImage) && (
                    <div className="step-3-header">
                        <div className="step-badge">STEP 3</div>
                        <p className="step-3-message">
                            {isMobile ? '원하는 드레스를 선택해주세요' : '오른쪽 드레스에서 원하는 스타일을 드래그하세요'}
                        </p>
                    </div>
                )}
                {renderUploadArea()}
                {!isProcessing && !generalResultImage && (uploadedImage || preview) && (
                    <button
                        type="button"
                        className={`step-link-button step-3-back-button ${isMobile ? 'mobile-step-3-back-button' : ''}`}
                        onClick={() => {
                            setUploadedImage(null)
                            setPreview(null)
                            setGeneralResultImage(null)
                            setOriginalResultImage(null)
                            setSelectedFilter('none')
                            setIsValidatingPerson(false)
                            if (fileInputRef.current) {
                                fileInputRef.current.value = ''
                            }
                            setCurrentStep(2)
                        }}
                    >
                        STEP 2 · 이미지 다시 업로드
                    </button>
                )}
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
                <div className="content-wrapper">
                    <div className="left-container">
                        <div className="general-fitting-header">
                            <h2 className="general-fitting-title">일반피팅</h2>
                            <div className="tab-guide-text-wrapper">
                                <div className="tab-guide-text">
                                    드래그 한 번으로 웨딩드레스를 자동 피팅해보세요
                                </div>
                            </div>
                        </div>
                        {/* ImageUpload 컴포넌트 */}
                        <div className="image-upload">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />

                            {renderStepContent()}
                        </div>
                    </div>

                    {(!isMobile || currentStep > 1) && (
                        <div className="right-container">
                            {/* DressSelection 컴포넌트 */}
                            <div className={`dress-selection ${isProcessing ? 'processing' : ''}`}>
                                {isProcessing && (
                                    <div className="dress-selection-overlay">
                                        <p className="dress-selection-overlay-text">
                                            드레스 매칭 중입니다.<br />잠시만 기다려주세요.
                                        </p>
                                    </div>
                                )}
                                <div className="category-buttons-wrapper">
                                    <button
                                        className="category-nav-button prev"
                                        onClick={() => handleCategoryNavigation('prev')}
                                        disabled={categoryStartIndex === 0 || isProcessing}
                                    >
                                        ‹
                                    </button>
                                    <div className="category-buttons" ref={categoryButtonsRef}>
                                        {visibleCategories.map((category) => (
                                            <button
                                                key={category.id}
                                                className={`category-button ${selectedCategory === category.id ? 'active' : ''}`}
                                                onClick={() => handleCategoryClick(category.id)}
                                                disabled={isProcessing}
                                            >
                                                {category.name}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        className="category-nav-button next"
                                        onClick={() => handleCategoryNavigation('next')}
                                        disabled={categoryStartIndex === maxStartIndex || isProcessing}
                                    >
                                        ›
                                    </button>
                                </div>

                                <div className="dress-content-wrapper" ref={containerRef}>
                                    <div className="dress-grid-container" ref={contentRef}>
                                        {loading && (
                                            <div className="dress-grid">
                                                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                                                    드레스 목록을 불러오는 중...
                                                </div>
                                            </div>
                                        )}
                                        {error && (
                                            <div className="dress-grid">
                                                <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>
                                                    {error}
                                                </div>
                                            </div>
                                        )}
                                        {!loading && !error && (
                                            <div className="dress-grid">
                                                {filteredDresses.length === 0 ? (
                                                    <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                                                        등록된 드레스가 없습니다.
                                                    </div>
                                                ) : (
                                                    dressesToRender.map((dress) => (
                                                        <div
                                                            key={dress.id}
                                                            data-dress-id={dress.id}
                                                            className={`dress-card draggable ${selectedDress?.id === dress.id ? 'selected' : ''}`}
                                                            onClick={() => handleDressClick(dress)}
                                                            draggable={!isMobile && !isProcessing}
                                                            onMouseDown={(e) => {
                                                                // 모바일이 아닐 때만 커서 변경
                                                                if (!isMobile) {
                                                                    e.currentTarget.style.cursor = 'grabbing'
                                                                }
                                                            }}
                                                            onMouseUp={(e) => {
                                                                // 모바일이 아닐 때만 커서 복구
                                                                if (!isMobile) {
                                                                    e.currentTarget.style.cursor = 'grab'
                                                                }
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                // 모바일이 아닐 때만 커서 복구
                                                                if (!isMobile) {
                                                                    e.currentTarget.style.cursor = 'grab'
                                                                }
                                                            }}
                                                            onDragStart={(e) => {
                                                                // 모바일이 아닐 때만 드래그 허용
                                                                if (!isMobile) {
                                                                    handleDragStart(e, dress)
                                                                } else {
                                                                    e.preventDefault()
                                                                }
                                                            }}
                                                            onDragEnd={(e) => {
                                                                if (!isMobile) {
                                                                    e.currentTarget.style.cursor = 'grab'
                                                                }
                                                            }}
                                                        >
                                                            <div className="dress-category-badge">
                                                                {categories.find(cat => cat.id === dress.category)?.name || '기타'}
                                                            </div>
                                                            <img src={dress.image} alt={dress.name} className="dress-image" draggable={false} />
                                                            {selectedDress?.id === dress.id && (
                                                                <div className="selected-badge">✓</div>
                                                            )}
                                                            {!isMobile && <div className="drag-hint">드래그 가능</div>}
                                                            {isMobile && <div className="drag-hint">탭하여 선택</div>}
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {filteredDresses.length > 0 && (
                                        <div className="vertical-slider">
                                            <button
                                                className="slider-arrow slider-arrow-up"
                                                onClick={() => handleArrowClick('up')}
                                                disabled={isProcessing}
                                            >
                                                ▲
                                            </button>
                                            <div className="slider-track" ref={sliderTrackRef}>
                                                <div
                                                    className="slider-handle"
                                                    ref={sliderHandleRef}
                                                    style={{ top: `${sliderHandleTop}px` }}
                                                    onMouseDown={isProcessing ? undefined : handleSliderMouseDown}
                                                />
                                            </div>
                                            <button
                                                className="slider-arrow slider-arrow-down"
                                                onClick={() => handleArrowClick('down')}
                                                disabled={isProcessing}
                                            >
                                                ▼
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 이미지 업로드 모달 */}
            <Modal
                isOpen={imageUploadModalOpen}
                onClose={closeImageUploadModal}
                message="먼저 전신 사진을 업로드해주세요."
                center
            >
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                        const file = e.target.files[0]
                        if (file && file.type.startsWith('image/')) {
                            handleImageUploadedForDress(file)
                        }
                    }}
                    style={{ display: 'none' }}
                    id="modal-image-input"
                    ref={modalFileInputRef}
                />
            </Modal>

            {/* 검증 모달 (동물 감지 등) */}
            <Modal
                isOpen={validationModalOpen}
                onClose={() => setValidationModalOpen(false)}
                message={validationMessage}
                center
            />

            {/* 이미지 확대 모달 - 결과 이미지만 표시 */}
            {isImageModalOpen && generalResultImage && (
                <div className="image-modal-overlay" onClick={() => setIsImageModalOpen(false)}>
                    <div className="image-modal-container" onClick={(e) => e.stopPropagation()}>
                        <button className="image-modal-close" onClick={() => setIsImageModalOpen(false)}>
                            ✕
                        </button>
                        <img
                            src={generalResultImage}
                            alt="확대된 결과 이미지"
                            className="image-modal-image"
                        />
                    </div>
                </div>
            )}

            {/* 이미지 선택 모달 */}
            <ImageSelectionModal
                isOpen={imageSelectionModalOpen}
                onClose={() => setImageSelectionModalOpen(false)}
                images={resultImages}
                onSelect={(selectedImage) => {
                    setGeneralResultImage(selectedImage)
                    setOriginalResultImage(selectedImage)
                    setImageSelectionModalOpen(false)

                    // 리뷰 모달 표시 (1번만, 쿠키 확인)
                    if (!isReviewCompleted('general')) {
                        setTimeout(() => {
                            setReviewModalOpen(true)
                        }, 3000)
                    }
                }}
            />

            {/* 리뷰 모달 */}
            <ReviewModal
                isOpen={reviewModalOpen}
                onClose={() => setReviewModalOpen(false)}
                pageType="general"
            />
        </main>
    )
}

export default GeneralFitting
