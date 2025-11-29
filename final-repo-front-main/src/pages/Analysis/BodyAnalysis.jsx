import { useState, useRef } from 'react'
import { HiQuestionMarkCircle } from 'react-icons/hi'
import Modal from '../../components/Modal'
import ReviewModal from '../../components/ReviewModal'
import '../../styles/Analysis/BodyTypeFitting.css'
import { analyzeBody, validatePerson } from '../../utils/api'
import { isReviewCompleted } from '../../utils/cookies'

const DRESS_CATEGORY_LABELS = {
    ballgown: '벨라인',
    mermaid: '머메이드',
    princess: '프린세스',
    aline: 'A라인',
    slim: '슬림',
    trumpet: '트럼펫',
    mini: '미니드레스',
    squareneck: '스퀘어넥',
    hanbok: '한복'
}

const DRESS_CATEGORY_KEYWORDS = {
    ballgown: ['벨라인', '벨트', '하이웨이스트', '벨티드', 'belt', 'bell line'],
    mermaid: ['머메이드', 'mermaid', '물고기', '피쉬', 'fish'],
    princess: ['프린세스', 'princess', '프린세스라인', 'princess line'],
    aline: ['a라인', 'aline', '에이라인', '에이 라인', '에이-라인', 'a-line'],
    slim: ['슬림', '스트레이트', 'straight', 'h라인', 'h-line', '슬림핏', '슬림 핏'],
    trumpet: ['트럼펫', 'trumpet', '플레어', 'flare'],
    mini: ['미니드레스', '미니 드레스', '미니', 'mini'],
    squareneck: ['스퀘어넥', 'square neck'],
    hanbok: ['한복']
}

const SOFT_FEATURE_MAP = {
    '키가 작은 체형': '키가 작으신 체형',
    '키가 큰 체형': '키가 크신 체형',
    '허리가 짧은 체형': '허리 비율이 짧으신 체형',
    '어깨가 넓은 체형': '균형잡힌 상체 체형',
    '어깨가 좁은 체형': '어깨라인이 슬림한 체형',
    '마른 체형': '슬림한 체형',
    '글래머러스한 체형': '곡선미가 돋보이는 체형',
    '팔 라인이 신경 쓰이는 체형': '팔라인이 신경 쓰이는 체형',
    '복부가 신경 쓰이는 체형': ''
}

const extractDressCategories = (text = '') => {
    if (!text) return []

    const lowerText = text.toLowerCase()
    const matches = []

    Object.entries(DRESS_CATEGORY_KEYWORDS).forEach(([categoryId, keywords]) => {
        let firstIndex = -1
        keywords.forEach((keyword) => {
            const index = lowerText.indexOf(keyword.toLowerCase())
            if (index !== -1 && (firstIndex === -1 || index < firstIndex)) {
                firstIndex = index
            }
        })

        if (firstIndex !== -1) {
            matches.push({ categoryId, index: firstIndex })
        }
    })

    matches.sort((a, b) => a.index - b.index)
    return matches.map((match) => match.categoryId)
}

const formatAnalysisText = (text = '') => {
    if (!text) return []

    const lines = text
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)

    return lines.map((line) => {
        const bulletNormalized = line.replace(/\*\s+/g, '• ')
        const segments = []
        const boldRegex = /\*\*(.*?)\*\*/g
        let lastIndex = 0
        let match

        while ((match = boldRegex.exec(bulletNormalized)) !== null) {
            if (match.index > lastIndex) {
                segments.push({
                    text: bulletNormalized.slice(lastIndex, match.index),
                    bold: false
                })
            }
            segments.push({
                text: match[1],
                bold: true
            })
            lastIndex = match.index + match[0].length
        }

        if (lastIndex < bulletNormalized.length) {
            segments.push({
                text: bulletNormalized.slice(lastIndex),
                bold: false
            })
        }

        return segments
    })
}

const parseGeminiAnalysis = (analysisText = '') => {
    if (!analysisText) {
        return {
            recommended: [],
            avoid: [],
            paragraphs: []
        }
    }

    const lowerText = analysisText.toLowerCase()
    const avoidIndex = lowerText.indexOf('피해야')

    const recommendationSection =
        avoidIndex !== -1 ? analysisText.slice(0, avoidIndex) : analysisText
    const avoidSection = avoidIndex !== -1 ? analysisText.slice(avoidIndex) : ''

    const recommended = extractDressCategories(recommendationSection)
    const avoid = extractDressCategories(avoidSection)
    const filteredRecommended = recommended.filter((cat) => !avoid.includes(cat)).slice(0, 2)

    return {
        recommended: filteredRecommended,
        avoid,
        paragraphs: formatAnalysisText(analysisText)
    }
}

const BodyAnalysis = ({ onNavigateToFittingWithCategory }) => {
    const [uploadedImage, setUploadedImage] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [analysisResult, setAnalysisResult] = useState(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [recommendedCategories, setRecommendedCategories] = useState([])
    const [analysisParagraphs, setAnalysisParagraphs] = useState([])
    const [height, setHeight] = useState('')
    const [weight, setWeight] = useState('')
    const [modalOpen, setModalOpen] = useState(false)
    const [modalMessage, setModalMessage] = useState('')
    const [reviewModalOpen, setReviewModalOpen] = useState(false)
    const [isValidatingPerson, setIsValidatingPerson] = useState(false)
    const fileInputRef = useRef(null)
    const resultAreaRef = useRef(null)

    // 카테고리명을 한글로 변환하는 함수
    const getCategoryName = (category) => DRESS_CATEGORY_LABELS[category.toLowerCase()] || category

    // 파일 선택 핸들러
    const handleFileSelect = async (e) => {
        const file = e.target.files[0]
        if (file && file.type.startsWith('image/')) {
            // 사람 감지 검증
            try {
                setIsValidatingPerson(true)
                const validationResult = await validatePerson(file)

                // 동물이 감지된 경우
                if (validationResult.is_animal) {
                    setModalMessage(validationResult.message || '인물사진을 업로드해주세요.')
                    setModalOpen(true)
                    setIsValidatingPerson(false)
                    // 파일 입력 초기화
                    if (fileInputRef.current) {
                        fileInputRef.current.value = ''
                    }
                    return
                }

                // 얼굴만 감지된 경우 (전신 랜드마크 없음)
                if (validationResult.is_face_only) {
                    setModalMessage('전신 사진을 넣어주세요.')
                    setModalOpen(true)
                    setIsValidatingPerson(false)
                    // 파일 입력 초기화
                    if (fileInputRef.current) {
                        fileInputRef.current.value = ''
                    }
                    return
                }

                if (!validationResult.success || !validationResult.is_person) {
                    setModalMessage(validationResult.message || '얼굴사진을 넣어주세요.')
                    setModalOpen(true)
                    setIsValidatingPerson(false)
                    // 파일 입력 초기화
                    if (fileInputRef.current) {
                        fileInputRef.current.value = ''
                    }
                    return
                }

                // 사람이 감지되면 이미지 업로드 진행
                setIsValidatingPerson(false)
                setUploadedImage(file)
                const reader = new FileReader()
                reader.onloadend = () => {
                    setImagePreview(reader.result)
                }
                reader.readAsDataURL(file)
                // 이전 분석 결과 초기화
                setAnalysisResult(null)
                setRecommendedCategories([])
                setAnalysisParagraphs([])
            } catch (error) {
                setModalMessage('이미지 검증 중 오류가 발생했습니다. 다시 시도해주세요.')
                setModalOpen(true)
                setIsValidatingPerson(false)
                // 파일 입력 초기화
                if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                }
            }
        }
    }

    // 업로드 박스 클릭 핸들러
    const handleUploadClick = () => {
        fileInputRef.current?.click()
    }

    // 분석하기 버튼 핸들러
    const handleAnalyze = async () => {
        if (!uploadedImage) {
            setModalMessage('먼저 이미지를 업로드해주세요!')
            setModalOpen(true)
            return
        }

        // 키와 몸무게가 입력되지 않았을 경우 모달 표시
        if (!height || !weight) {
            setModalMessage('키와 몸무게를 입력해주세요.')
            setModalOpen(true)
            return
        }

        const heightValue = parseFloat(height)
        const weightValue = parseFloat(weight)

        if (Number.isNaN(heightValue) || heightValue < 100 || heightValue > 250) {
            setModalMessage('키는 100cm 이상 250cm 이하로 입력해주세요.')
            setModalOpen(true)
            return
        }

        if (Number.isNaN(weightValue) || weightValue < 30 || weightValue > 200) {
            setModalMessage('몸무게는 30kg 이상 200kg 이하로 입력해주세요.')
            setModalOpen(true)
            return
        }

        setIsAnalyzing(true)
        try {
            const result = await analyzeBody(uploadedImage, heightValue, weightValue)

            if (!result.success) {
                throw new Error(result.message || '체형 분석에 실패했습니다.')
            }

            setAnalysisResult(result)

            const parsedGemini = parseGeminiAnalysis(result.gemini_analysis?.detailed_analysis || '')
            setRecommendedCategories(parsedGemini.recommended)
            setAnalysisParagraphs(parsedGemini.paragraphs)

            // 리뷰 모달 표시 (1번만, 쿠키 확인)
            if (!isReviewCompleted('analysis')) {
                // 약간의 지연 후 모달 표시 (결과 표시 후)
                setTimeout(() => {
                    setReviewModalOpen(true)
                }, 1500)
            }

            // 모바일에서 분석 결과 영역으로 스크롤
            setTimeout(() => {
                if (window.innerWidth <= 768 && resultAreaRef.current) {
                    const element = resultAreaRef.current
                    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
                    const offsetPosition = elementPosition - 80 // 상단에서 80px 위로 스크롤

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    })
                }
            }, 100)
        } catch (error) {
            // 백엔드에서 반환한 에러 메시지 확인
            let errorMessage = error.response?.data?.message || error.message || '이미지 분석 중 오류가 발생했습니다.'

            // 동물 감지 에러인 경우
            if (error.response?.data?.is_animal) {
                errorMessage = '인물사진을 업로드해주세요.'
            }
            // 전신 랜드마크가 없는 경우 (얼굴만 있는 경우)
            else if (error.response?.data?.error === 'No pose detected' || errorMessage.includes('전신')) {
                errorMessage = '전신 사진을 넣어주세요.'
            }

            setModalMessage(errorMessage)
            setModalOpen(true)
        } finally {
            setIsAnalyzing(false)
        }
    }

    return (
        <main className="main-content">
            <div className="fitting-container">
                <div className="content-wrapper">
                    <div className="left-container">
                        <div className="general-fitting-header">
                            <h2 className="general-fitting-title">체형 분석</h2>
                            <div className="tab-guide-text-wrapper">
                                <div className="tab-guide-text">
                                    AI가 당신의 체형을 자동으로 분석하고 최적의 드레스를 추천해드립니다
                                </div>
                                <button className="faq-button">
                                    <HiQuestionMarkCircle />
                                    <div className="tooltip">전신사진을 업로드한 후 분석하기 버튼을 눌러주세요</div>
                                </button>
                            </div>
                        </div>

                        {/* 상단 영역: 좌측 업로드, 우측 분석결과 */}
                        <div className="analysis-main-section">
                            {/* 좌측: 이미지 업로드 영역 */}
                            <div className="upload-area">
                                <div className="image-container">
                                    {imagePreview ? (
                                        <>
                                            <img src={imagePreview} alt="업로드된 이미지" className="correction-image" />
                                            <button className="remove-image-button" onClick={(e) => {
                                                e.stopPropagation()
                                                setUploadedImage(null)
                                                setImagePreview(null)
                                                setAnalysisResult(null)
                                                setRecommendedCategories([])
                                                setAnalysisParagraphs([])
                                                setHeight('')
                                                setWeight('')
                                            }}>
                                                ✕
                                            </button>
                                        </>
                                    ) : (
                                        <div
                                            className={`empty-image-placeholder ${isValidatingPerson ? 'validating' : ''}`}
                                            onClick={!isValidatingPerson ? handleUploadClick : undefined}
                                        >
                                            {isValidatingPerson ? (
                                                <>
                                                    <div className="validation-overlay"></div>
                                                    <div className="validation-loader-wrapper">
                                                        <div className="loader"><span></span></div>
                                                        <p>이미지를 확인하고 있어요<br />잠시만 기다려주세요</p>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <img src="/Image/analysis/icons8-카메라-80.png" alt="카메라" className="camera-icon" />
                                                    <p>이미지를 업로드해주세요</p>
                                                </>
                                            )}
                                        </div>
                                    )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                        style={{ display: 'none' }}
                                    />
                                </div>
                                {/* 키와 몸무게 입력 필드 */}
                                <div className="body-info-inputs">
                                    <div className="input-group">
                                        <label htmlFor="height">키 (cm) <span className="required-asterisk">*</span></label>
                                        <input
                                            id="height"
                                            type="number"
                                            placeholder="예: 165"
                                            value={height}
                                            onChange={(e) => setHeight(e.target.value)}
                                            min="0"
                                            step="0.1"
                                            required
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label htmlFor="weight">몸무게 (kg) <span className="required-asterisk">*</span></label>
                                        <input
                                            id="weight"
                                            type="number"
                                            placeholder="예: 55"
                                            value={weight}
                                            onChange={(e) => setWeight(e.target.value)}
                                            min="0"
                                            step="0.1"
                                            required
                                        />
                                    </div>
                                </div>
                                <button
                                    className="analyze-button"
                                    onClick={handleAnalyze}
                                    disabled={!uploadedImage || isAnalyzing || analysisResult}
                                >
                                    {isAnalyzing ? (
                                        '분석중'
                                    ) : analysisResult ? (
                                        '분석완료'
                                    ) : (
                                        '분석하기'
                                    )}
                                </button>
                            </div>

                            {/* 우측: 분석 결과 영역 */}
                            <div
                                ref={resultAreaRef}
                                className={`analysis-result-area ${!analysisResult ? 'mobile-hidden' : ''}`}
                            >
                                <div className="result-section-header">
                                    <h3 className="result-section-title">분석 결과</h3>
                                    {analysisResult && (
                                        <p className="result-section-description">추천 드레스 카테고리를 선택하면 일반피팅 화면으로 이동됩니다</p>
                                    )}
                                </div>
                                <div className="result-box">
                                    {isAnalyzing ? (
                                        <div className="analysis-loading-container">
                                            <div className="loader">
                                                <div></div>
                                                <div></div>
                                                <div></div>
                                                <div></div>
                                                <div></div>
                                            </div>
                                        </div>
                                    ) : analysisResult ? (
                                        <div className="result-content">
                                            {/* 1. 체형 타입 (맨 위) */}
                                            <div className="result-item body-info-item">
                                                <div className="body-info-row">
                                                    <div className="body-info-item-single">
                                                        <strong>체형 타입:</strong>
                                                        <span>{analysisResult.body_analysis?.body_type || '분석 중...'}의 체형에 가깝습니다</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 2. 체형 특징 */}
                                            {analysisResult.body_analysis?.body_features && analysisResult.body_analysis.body_features.length > 0 && (
                                                <div className="result-item body-features-item">
                                                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                                        <strong>체형 특징:</strong>
                                                        {Array.from(new Set(
                                                            analysisResult.body_analysis.body_features
                                                                .map((feature) => {
                                                                    const friendly = SOFT_FEATURE_MAP[feature]
                                                                    if (friendly === undefined) return feature
                                                                    return friendly
                                                                })
                                                                .filter((feature) => feature && feature.trim())
                                                        )).map((feature, index) => (
                                                            <span
                                                                key={index}
                                                                className="body-feature-label"
                                                            >
                                                                {feature}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* 3. 추천 드레스 스타일 (분석글 위) */}
                                            {recommendedCategories.length > 0 && (
                                                <div className="result-item recommended-categories-item">
                                                    <div className="recommended-categories-header">
                                                        <strong>추천 드레스 스타일:</strong>
                                                        <div className="recommended-categories">
                                                            {recommendedCategories.map((category, index) => (
                                                                <span
                                                                    key={index}
                                                                    className="category-badge"
                                                                    onClick={() => {
                                                                        if (onNavigateToFittingWithCategory) {
                                                                            onNavigateToFittingWithCategory(category)
                                                                        }
                                                                    }}
                                                                    style={{ cursor: 'pointer' }}
                                                                >
                                                                    {getCategoryName(category)}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {/* 4. AI 상세 분석 */}
                                            <div className="result-item analysis-item">
                                                <strong>AI 상세 분석:</strong>
                                                <div className="analysis-description">
                                                    {analysisParagraphs.length > 0 ? (
                                                        (() => {
                                                            // 전체 텍스트를 하나로 합치기
                                                            const fullText = analysisParagraphs.map(segments =>
                                                                segments.map(s => s.text).join('')
                                                            ).join(' ');

                                                            // 체형 설명 부분 찾기 (첫 문장에서 "~체형입니다" 패턴만)
                                                            const firstSentence = fullText.split(/[\.。]/)[0];
                                                            // "전체적으로 슬림하고 비율이 좋은 체형입니다" 같은 패턴 찾기
                                                            // "이미지를 직접 관찰했을 때" 같은 앞부분은 제외하고 체형 설명 부분만
                                                            // "전체적으로"로 시작하는 부분을 찾아서 하이라이트 (앞에 "이미지를 직접 관찰"이 있어도 "전체적으로"부터만 하이라이트)
                                                            let bodyTypeMatch = null;

                                                            // 패턴 1: "전체적으로"로 시작하는 부분 찾기 (가장 우선)
                                                            const bodyTypePattern1 = /전체적으로[^\.]*(?:슬림|늘씬|균형|단정|좋은|우아|세련)[^\.]*(?:체형|비율)[입니다\.]*/;
                                                            const match1 = firstSentence.match(bodyTypePattern1);
                                                            if (match1 && match1[0]) {
                                                                // "전체적으로"부터만 하이라이트 (앞에 "이미지를 직접 관찰"이 있어도 상관없음)
                                                                bodyTypeMatch = { 1: match1[0] };
                                                            }

                                                            // 패턴 2: "전체적으로"로 시작하지 않지만 체형 설명 부분 찾기
                                                            if (!bodyTypeMatch) {
                                                                const bodyTypePattern2 = /([^\.]*(?:슬림|늘씬|균형|단정|좋은|우아|세련)[^\.]*(?:체형|비율)[입니다\.]*)/;
                                                                const match2 = firstSentence.match(bodyTypePattern2);
                                                                if (match2 && match2[1] && !match2[1].includes('이미지를 직접 관찰')) {
                                                                    bodyTypeMatch = match2;
                                                                }
                                                            }

                                                            // 드레스 키워드 찾기 (전체 텍스트에서 2개만)
                                                            const styleKeywords = [
                                                                '슬림', '프린세스', 'A라인', '벨라인', '머메이드', '트럼펫', '미니드레스',
                                                                '스트레이트', 'H라인', '에이라인', '플레어', '하이웨이스트', '벨트라인'
                                                            ];

                                                            // 전체 텍스트에서 하이라이트할 키워드 위치 찾기
                                                            const highlightedKeywords = [];
                                                            let dressHighlightCount = 0;
                                                            const maxDressHighlights = 2;
                                                            const sortedKeywords = [...styleKeywords].sort((a, b) => b.length - a.length);

                                                            sortedKeywords.forEach(keyword => {
                                                                if (dressHighlightCount >= maxDressHighlights) return;

                                                                const regex = new RegExp(keyword, 'gi');
                                                                const match = regex.exec(fullText);
                                                                if (match) {
                                                                    highlightedKeywords.push({
                                                                        keyword: keyword,
                                                                        index: match.index,
                                                                        length: match[0].length
                                                                    });
                                                                    dressHighlightCount++;
                                                                }
                                                            });

                                                            return analysisParagraphs.map((segments, lineIndex) => {
                                                                const lineText = segments.map(s => s.text).join('');
                                                                let processedText = lineText;

                                                                // 현재 줄의 시작 위치 계산 (원본 텍스트 기준)
                                                                let lineStartIndex = 0;
                                                                for (let i = 0; i < lineIndex; i++) {
                                                                    lineStartIndex += analysisParagraphs[i].map(s => s.text).join('').length + 1;
                                                                }
                                                                const lineEndIndex = lineStartIndex + lineText.length;

                                                                // 먼저 드레스 키워드 하이라이트 (원본 텍스트 기준으로 정확한 위치, 역순으로 처리)
                                                                // 역순으로 처리하여 인덱스가 변경되지 않도록
                                                                const keywordsInLine = highlightedKeywords
                                                                    .filter(({ index }) => index >= lineStartIndex && index < lineEndIndex)
                                                                    .map(({ keyword, index, length }) => ({
                                                                        keyword,
                                                                        localIndex: index - lineStartIndex,
                                                                        length
                                                                    }))
                                                                    .sort((a, b) => b.localIndex - a.localIndex); // 역순 정렬

                                                                keywordsInLine.forEach(({ keyword, localIndex, length }) => {
                                                                    // 원본 텍스트에서 정확한 위치의 키워드만 하이라이트
                                                                    if (processedText.substring(localIndex, localIndex + length) === keyword) {
                                                                        const before = processedText.substring(0, localIndex);
                                                                        const after = processedText.substring(localIndex + length);
                                                                        // 이미 하이라이트되지 않은 경우만
                                                                        if (!before.includes('<span') && !processedText.substring(localIndex, localIndex + length).includes('highlight')) {
                                                                            processedText = before + `<span class="highlight">${keyword}</span>` + after;
                                                                        }
                                                                    }
                                                                });

                                                                // 체형 설명 부분 하이라이트 (첫 줄에만, 드레스 키워드 하이라이트 이후)
                                                                if (lineIndex === 0 && bodyTypeMatch && bodyTypeMatch[1]) {
                                                                    const bodyTypeText = bodyTypeMatch[1].trim();
                                                                    if (bodyTypeText && bodyTypeText.length > 5) {
                                                                        const escaped = bodyTypeText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                                                        const regex = new RegExp(`(${escaped})`, 'g');
                                                                        processedText = processedText.replace(regex, (match) => {
                                                                            if (!match.includes('highlight')) {
                                                                                return `<span class="highlight">${match}</span>`;
                                                                            }
                                                                            return match;
                                                                        });
                                                                    }
                                                                }

                                                                // 하이라이트된 텍스트 파싱
                                                                const parts = [];
                                                                let currentIndex = 0;
                                                                const highlightRegex = /<span class="highlight">(.*?)<\/span>/g;
                                                                let match;

                                                                while ((match = highlightRegex.exec(processedText)) !== null) {
                                                                    if (match.index > currentIndex) {
                                                                        parts.push({
                                                                            text: processedText.substring(currentIndex, match.index),
                                                                            highlight: false
                                                                        });
                                                                    }
                                                                    parts.push({
                                                                        text: match[1],
                                                                        highlight: true
                                                                    });
                                                                    currentIndex = match.index + match[0].length;
                                                                }

                                                                if (currentIndex < processedText.length) {
                                                                    parts.push({
                                                                        text: processedText.substring(currentIndex),
                                                                        highlight: false
                                                                    });
                                                                }

                                                                return (
                                                                    <p key={lineIndex} className="analysis-description-line">
                                                                        {parts.length > 0 ? (
                                                                            parts.map((part, partIndex) => (
                                                                                part.highlight ? (
                                                                                    <span key={partIndex} className="highlight">{part.text}</span>
                                                                                ) : (
                                                                                    <span key={partIndex}>{part.text}</span>
                                                                                )
                                                                            ))
                                                                        ) : (
                                                                            segments.map((segment, segmentIndex) => (
                                                                                segment.bold ? (
                                                                                    <strong key={segmentIndex}>{segment.text}</strong>
                                                                                ) : (
                                                                                    <span key={segmentIndex}>{segment.text}</span>
                                                                                )
                                                                            ))
                                                                        )}
                                                                    </p>
                                                                );
                                                            });
                                                        })()
                                                    ) : (
                                                        <p>{analysisResult.gemini_analysis?.detailed_analysis || analysisResult.message || '체형 분석이 완료되었습니다.'}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="result-placeholder">
                                            <p className="placeholder-text">
                                                이미지를 업로드하고<br />
                                                분석하기 버튼을 눌러주세요
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                message={modalMessage}
                center
            />

            {/* 리뷰 모달 */}
            <ReviewModal
                isOpen={reviewModalOpen}
                onClose={() => setReviewModalOpen(false)}
                pageType="analysis"
            />
        </main>
    )
}

export default BodyAnalysis

