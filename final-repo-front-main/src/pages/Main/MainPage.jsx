import { useEffect } from 'react'
import VideoBackground from './components/VideoBackground/VideoBackground'
import AboutUs from './components/AboutUs/AboutUs'
import DomeGallery from './components/DomeGallery/DomeGallery'
import DressCollection from './components/DressCollection/DressCollection'
import UsageGuideSection from './components/UsageGuideSection/UsageGuideSection'
import FAQSection from './components/FAQSection/FAQSection'
import NextSection from './components/NextSection/NextSection'
import ScrollToTop from './components/ScrollToTop/ScrollToTop'
import { countVisitor } from '../../utils/api'

const MainPage = ({ onNavigateToFitting, onNavigateToGeneral, onNavigateToCustom, onNavigateToAnalysis }) => {
    useEffect(() => {
        // 새로고침 시 스크롤을 맨 위로 리셋
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
        document.documentElement.scrollTop = 0
        document.body.scrollTop = 0

        // 약간의 지연 후 다시 한 번 확인 (배포 환경 대응)
        const scrollResetTimer = setTimeout(() => {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
            document.documentElement.scrollTop = 0
            document.body.scrollTop = 0
        }, 100)

        // sessionStorage에서 이미 조회수를 카운팅했는지 확인 (세션당 한 번만)
        const hasCountedVisitor = sessionStorage.getItem('hasCountedVisitor')

        if (!hasCountedVisitor) {
            // 페이지 로드 시 방문자 카운트 (새 세션 시작 시에만)
            countVisitor().catch(() => {
                // 에러는 조용히 처리
            })
            // 세션당 한 번만 카운팅하도록 표시 저장 (탭을 닫으면 사라짐)
            sessionStorage.setItem('hasCountedVisitor', 'true')
        }

        return () => {
            clearTimeout(scrollResetTimer)
        }
    }, [])

    return (
        <>
            <VideoBackground onNavigateToFitting={onNavigateToFitting} />
            <AboutUs
                onNavigateToGeneral={onNavigateToGeneral}
                onNavigateToCustom={onNavigateToCustom}
                onNavigateToAnalysis={onNavigateToAnalysis}
            />
            <section className="dome-gallery-section">
                <div className="dome-gallery-header">
                    <h2 className="dome-gallery-title">다양한 드레스를 피팅해보세요</h2>
                </div>
                <DomeGallery />
            </section>
            <DressCollection />
            <UsageGuideSection />
            <FAQSection />
            <NextSection />
            <ScrollToTop />
        </>
    )
}

export default MainPage

