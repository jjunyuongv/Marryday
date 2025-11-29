import { useState, useEffect } from 'react'
import Header from './components/Header'
import MainPage from './pages/Main/MainPage'
import GeneralFitting from './pages/General/GeneralFitting'
import CustomFitting from './pages/Custom/CustomFitting'
import BodyAnalysis from './pages/Analysis/BodyAnalysis'
import { addPlatformClasses } from './utils/platform'
import './styles/App.css'

function App() {
    const [currentPage, setCurrentPage] = useState('main') // 'main', 'general', 'custom', 'analysis'

    // 일반피팅 페이지로 전달할 카테고리
    const [selectedCategoryForFitting, setSelectedCategoryForFitting] = useState(null)

    // 플랫폼 감지 및 클래스 추가
    useEffect(() => {
        addPlatformClasses()

        // 화면 크기 변경 시에도 플랫폼 클래스 업데이트
        const handleResize = () => {
            addPlatformClasses()
        }
        window.addEventListener('resize', handleResize)

        return () => {
            window.removeEventListener('resize', handleResize)
        }
    }, [])

    // 새로고침 시 스크롤을 최상단으로 이동
    useEffect(() => {
        window.scrollTo(0, 0)
        // 페이지 로드 시 스크롤 위치 복원 방지
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual'
        }
    }, [])


    const handleNavigateToFitting = () => {
        setCurrentPage('general')
    }

    const handleBackToMain = () => {
        setCurrentPage('main')
        // 메인 페이지로 스크롤
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        })
    }

    const handleLogoClick = () => {
        if (currentPage !== 'main') {
            handleBackToMain()
        } else {
            // 메인 페이지로 스크롤
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            })
        }
    }

    const handleMenuClick = (menuType) => {
        if (menuType === 'general') {
            setCurrentPage('general')
            setSelectedCategoryForFitting(null) // 메뉴에서 직접 이동 시 카테고리 초기화
        } else if (menuType === 'custom') {
            setCurrentPage('custom')
        } else if (menuType === 'analysis') {
            setCurrentPage('analysis')
        }
    }

    // 카테고리 선택하여 일반피팅으로 이동
    const handleNavigateToFittingWithCategory = (category) => {
        setSelectedCategoryForFitting(category)
        setCurrentPage('general')
    }

    return (
        <div className="app">
            {currentPage === 'main' && (
                <MainPage
                    onNavigateToFitting={handleNavigateToFitting}
                    onNavigateToGeneral={() => handleMenuClick('general')}
                    onNavigateToCustom={() => handleMenuClick('custom')}
                    onNavigateToAnalysis={() => handleMenuClick('analysis')}
                />
            )}
            <Header
                currentPage={currentPage}
                onBackToMain={currentPage !== 'main' ? handleBackToMain : null}
                onMenuClick={handleMenuClick}
                onLogoClick={handleLogoClick}
            />

            {currentPage === 'general' && (
                <GeneralFitting
                    onBackToMain={handleBackToMain}
                    initialCategory={selectedCategoryForFitting}
                    onCategorySet={() => setSelectedCategoryForFitting(null)}
                />
            )}
            {currentPage === 'custom' && (
                <CustomFitting
                    onBackToMain={handleBackToMain}
                />
            )}
            {currentPage === 'analysis' && (
                <BodyAnalysis
                    onBackToMain={handleBackToMain}
                    onNavigateToFittingWithCategory={handleNavigateToFittingWithCategory}
                />
            )}
        </div>
    )
}

export default App

