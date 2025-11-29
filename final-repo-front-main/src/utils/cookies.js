/**
 * 쿠키 유틸리티 함수
 */

/**
 * 쿠키 설정
 * @param {string} name - 쿠키 이름
 * @param {string} value - 쿠키 값
 * @param {number} days - 만료일 (일 단위, 기본값: 365일)
 */
export const setCookie = (name, value, days = 365) => {
    const expires = new Date()
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`
}

/**
 * 쿠키 읽기
 * @param {string} name - 쿠키 이름
 * @returns {string|null} 쿠키 값 또는 null
 */
export const getCookie = (name) => {
    const nameEQ = name + '='
    const ca = document.cookie.split(';')
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i]
        while (c.charAt(0) === ' ') c = c.substring(1, c.length)
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
    }
    return null
}

/**
 * 쿠키 삭제
 * @param {string} name - 쿠키 이름
 */
export const deleteCookie = (name) => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`
}

/**
 * 리뷰 완료 여부 확인
 * @param {string} pageType - 페이지 타입 ('general', 'custom', 'analysis')
 * @returns {boolean} 리뷰 완료 여부
 */
export const isReviewCompleted = (pageType) => {
    return getCookie(`review_completed_${pageType}`) === 'true'
}

/**
 * 리뷰 완료 표시
 * @param {string} pageType - 페이지 타입 ('general', 'custom', 'analysis')
 * 쿠키는 24시간(1일) 후 자동으로 만료됩니다.
 */
export const setReviewCompleted = (pageType) => {
    setCookie(`review_completed_${pageType}`, 'true', 1) // 1일(24시간) 후 만료
}

