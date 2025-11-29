import axios from 'axios'

// 환경변수에서 API URL 가져오기 (끝의 슬래시 제거)
export const getApiBaseUrl = () => {
    // 환경변수로 상대 경로 사용 강제 설정 가능
    if (import.meta.env.VITE_USE_RELATIVE_API === 'true') {
        return ''
    }

    // 런타임에 동적으로 결정 (빌드 타임이 아닌 실행 시점)
    if (typeof window !== 'undefined') {
        // marryday.co.kr 도메인에서는 상대 경로 사용 (rewrites를 통해 프록시)
        const hostname = window.location.hostname
        if (hostname.includes('marryday.co.kr')) {
            return '' // 상대 경로 사용
        }
    }

    // 로컬 개발 환경 또는 다른 환경
    let url = import.meta.env.VITE_API_URL || 'http://marryday.kro.kr'
    // URL 끝의 슬래시 제거
    url = url.replace(/\/+$/, '')
    return url
}

// 런타임에 baseURL을 결정하기 위해 함수로 생성
const createApiInstance = () => {
    const API_BASE_URL = getApiBaseUrl()

    return axios.create({
        baseURL: API_BASE_URL,
        timeout: 300000, // 5분 타임아웃 (AI 처리 시간이 길 수 있음)
        // multipart/form-data는 FormData를 보낼 때 axios가 자동으로 boundary를 포함한 Content-Type을 설정하므로
        // 기본 헤더에 설정하지 않음 (필요한 경우 개별 요청에서만 설정)
    })
}

const api = createApiInstance()

// 요청 인터셉터
api.interceptors.request.use(
    (config) => {
        return config
    },
    (error) => {
        console.error('API Request Error:', error)
        return Promise.reject(error)
    }
)

// 응답 인터셉터 (에러 처리)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Response Error:', {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            url: error.config?.url,
            baseURL: error.config?.baseURL,
        })
        return Promise.reject(error)
    }
)

/**
 * URL에서 이미지를 다운로드하여 File 객체로 변환 (CORS 문제 해결을 위해 프록시 사용)
 * @param {string} url - 이미지 URL (S3 URL인 경우 프록시를 통해 가져옴)
 * @param {string} filename - 파일명
 * @returns {Promise<File>} File 객체
 */
const urlToFile = async (url, filename = 'dress.jpg') => {
    // S3 URL이거나 외부 URL인 경우 백엔드 프록시를 통해 가져오기
    const isExternalUrl = url.startsWith('http://') || url.startsWith('https://')
    const apiBaseUrl = getApiBaseUrl()
    const proxyUrl = isExternalUrl
        ? `${apiBaseUrl}/api/proxy-image?url=${encodeURIComponent(url)}`
        : url

    const response = await fetch(proxyUrl)
    if (!response.ok) {
        throw new Error(`이미지를 가져올 수 없습니다: ${response.statusText}`)
    }
    const blob = await response.blob()
    return new File([blob], filename, { type: blob.type })
}

/**
 * 자동 매칭 API 호출 V4 (일반 탭: 사람 + 드레스 + 배경) - Gemini 3 Flash
 * @param {File} personImage - 사용자 사진
 * @param {Object|File} dressData - 드레스 데이터 (id, name, image, originalUrl) 또는 File 객체
 * @param {File} backgroundImage - 배경 이미지 파일
 * @returns {Promise} 매칭된 이미지 결과
 */
export const autoMatchImageV4 = async (personImage, dressData, backgroundImage) => {
    try {
        const formData = new FormData()
        formData.append('person_image', personImage)

        // 드레스 이미지 처리
        if (dressData instanceof File) {
            formData.append('garment_image', dressData)
        } else if (dressData.originalUrl || dressData.image) {
            // 드레스 URL이 있는 경우 File 객체로 변환
            const dressUrl = dressData.originalUrl || dressData.image
            const dressFile = await urlToFile(dressUrl, 'dress.jpg')
            formData.append('garment_image', dressFile)
        } else {
            throw new Error('드레스 이미지가 필요합니다.')
        }

        // 배경 이미지 추가
        if (!backgroundImage) {
            throw new Error('배경 이미지가 필요합니다.')
        }
        formData.append('background_image', backgroundImage)

        const response = await api.post('/fit/v4/compose', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })

        return response.data
    } catch (error) {
        console.error('자동 매칭 V4 오류:', error)
        throw error
    }
}

/**
 * CustomV4 매칭 API 호출 (의상 누끼 자동 처리 포함, Gemini 3 Flash)
 * @param {File} fullBodyImage - 전신 사진
 * @param {File} dressImage - 드레스 이미지
 * @param {File} backgroundImage - 배경 이미지
 * @returns {Promise} 매칭된 결과 이미지
 */
export const customV4MatchImage = async (fullBodyImage, dressImage, backgroundImage) => {
    try {
        const formData = new FormData()
        formData.append('person_image', fullBodyImage)
        formData.append('garment_image', dressImage)
        formData.append('background_image', backgroundImage)

        const response = await api.post('/fit/custom-v4/compose', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })

        // response.data 형식:
        // {
        //   success: true,
        //   result_image: "data:image/png;base64,..." (Base64 문자열)
        //   prompt: "생성된 프롬프트"
        //   message: "CustomV4 파이프라인이 성공적으로 완료되었습니다."
        // }
        return response.data
    } catch (error) {
        console.error('CustomV4 매칭 오류:', error)
        throw error
    }
}

/**
 * 사람 감지 API 호출 (MediaPipe 기반)
 * @param {File} image - 이미지 파일
 * @returns {Promise} 사람 감지 결과 { success: boolean, is_person: boolean, message: string }
 */
export const validatePerson = async (image) => {
    try {
        const formData = new FormData()
        formData.append('file', image)

        const response = await api.post('/api/validate-person', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })

        return response.data
    } catch (error) {
        console.error('사람 감지 오류:', error)
        // 에러 응답도 처리
        if (error.response?.data) {
            return error.response.data
        }
        throw error
    }
}

/**
 * 체형 분석 API 호출 (MediaPipe 기반 체형 분석)
 * @param {File} image - 전신 이미지 파일
 * @param {number} height - 키 (cm)
 * @param {number} weight - 몸무게 (kg)
 * @returns {Promise} 체형 분석 결과
 */
export const analyzeBody = async (image, height, weight) => {
    try {
        const formData = new FormData()
        formData.append('file', image)
        formData.append('height', height || 0)
        formData.append('weight', weight || 0)

        // axios는 FormData를 감지하면 자동으로 multipart/form-data Content-Type을 설정
        const response = await api.post('/api/analyze-body', formData)

        return response.data
    } catch (error) {
        console.error('체형 분석 오류:', error)
        throw error
    }
}

/**
 * 이미지에 필터 적용
 * @param {File|string} image - 이미지 파일 또는 이미지 URL/Data URL
 * @param {string} filterPreset - 필터 프리셋 (none, grayscale, vintage, warm, cool, high_contrast)
 * @returns {Promise} 필터가 적용된 이미지 결과
 */
export const applyImageFilter = async (image, filterPreset = 'none') => {
    try {
        const formData = new FormData()

        // 이미지가 File 객체인지 URL/Data URL인지 확인
        if (image instanceof File) {
            formData.append('file', image)
        } else if (typeof image === 'string') {
            // Data URL 또는 URL인 경우 File 객체로 변환
            let imageFile
            if (image.startsWith('data:')) {
                // Data URL인 경우
                const response = await fetch(image)
                const blob = await response.blob()
                imageFile = new File([blob], 'image.png', { type: blob.type })
            } else {
                // URL인 경우
                imageFile = await urlToFile(image, 'image.png')
            }
            formData.append('file', imageFile)
        } else {
            throw new Error('이미지 형식이 올바르지 않습니다.')
        }

        formData.append('filter_preset', filterPreset)

        const response = await api.post('/api/apply-image-filters', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })

        if (response.data.success) {
            return {
                success: true,
                resultImage: response.data.result_image,
                filterPreset: response.data.filter_preset,
                message: response.data.message,
            }
        } else {
            throw new Error(response.data.message || '필터 적용에 실패했습니다.')
        }
    } catch (error) {
        console.error('필터 적용 중 오류 발생:', error)
        throw error
    }
}

export const getDresses = async () => {
    try {
        // limit를 크게 설정하여 모든 드레스 가져오기
        const response = await api.get('/api/admin/dresses?limit=1000', {
            headers: {
                'Content-Type': 'application/json',
            },
        })
        return response.data
    } catch (error) {
        console.error('드레스 목록 조회 오류:', error)
        throw error
    }
}

/**
 * 리뷰 제출 API 호출
 * @param {Object} reviewData - 리뷰 데이터
 * @param {string} reviewData.category - 카테고리 ('general', 'custom', 'analysis')
 * @param {number} reviewData.rating - 별점 (1-5)
 * @param {string|null} reviewData.content - 리뷰 내용 (선택사항)
 * @returns {Promise} 리뷰 제출 결과
 */
export const submitReview = async (reviewData) => {
    try {
        const response = await api.post('/api/reviews', reviewData, {
            headers: {
                'Content-Type': 'application/json',
            },
        })
        return response.data
    } catch (error) {
        console.error('리뷰 제출 오류:', error)
        throw error
    }
}

/**
 * 접속자 수 카운팅 API 호출
 * @returns {Promise} 접속자 카운팅 결과
 */
export const countVisitor = async () => {
    try {
        const response = await api.post('/visitor/visit', {}, {
            headers: {
                'Content-Type': 'application/json',
            },
        })
        return response.data
    } catch (error) {
        // 접속자 카운팅 실패는 조용히 처리 (사용자 경험에 영향 없도록)
        return { success: false }
    }
}

export default api

