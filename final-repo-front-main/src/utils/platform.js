/**
 * 플랫폼 감지 유틸리티
 */

/**
 * iOS 기기인지 확인
 * @returns {boolean} iOS 기기 여부
 */
export const isIOS = () => {
    if (typeof window === 'undefined') return false

    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent)
    const isIOSWebView = /iphone|ipad|ipod/.test(userAgent) && !window.MSStream

    // iOS Safari 또는 iOS Chrome 등
    return isIOSDevice || isIOSWebView
}

/**
 * Android 기기인지 확인
 * @returns {boolean} Android 기기 여부
 */
export const isAndroid = () => {
    if (typeof window === 'undefined') return false

    const userAgent = window.navigator.userAgent.toLowerCase()
    return /android/.test(userAgent)
}

/**
 * 모바일 기기인지 확인
 * @returns {boolean} 모바일 기기 여부
 */
export const isMobile = () => {
    if (typeof window === 'undefined') return false
    return isIOS() || isAndroid() || window.innerWidth <= 768
}

/**
 * 플랫폼 정보 객체 반환
 * @returns {Object} 플랫폼 정보
 */
export const getPlatformInfo = () => {
    return {
        isIOS: isIOS(),
        isAndroid: isAndroid(),
        isMobile: isMobile(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
    }
}

/**
 * body에 플랫폼 클래스 추가
 */
export const addPlatformClasses = () => {
    if (typeof document === 'undefined') return

    const platformInfo = getPlatformInfo()

    // 기존 플랫폼 클래스 제거
    document.body.classList.remove('ios', 'android', 'mobile')

    // 플랫폼별 클래스 추가
    if (platformInfo.isIOS) {
        document.body.classList.add('ios', 'mobile')
    } else if (platformInfo.isAndroid) {
        document.body.classList.add('android', 'mobile')
    } else if (platformInfo.isMobile) {
        document.body.classList.add('mobile')
    }

    return platformInfo
}

