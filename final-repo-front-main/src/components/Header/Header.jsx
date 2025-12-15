import { useState, useMemo } from 'react'
import { FiMenu, FiX } from 'react-icons/fi'
import './Header.css'

// 메뉴 아이템을 컴포넌트 외부로 이동하여 재생성 방지
const MENU_ITEMS = [
    { label: '일반피팅', key: 'general' },
    { label: '커스텀피팅', key: 'custom' },
    { label: '체형 분석', key: 'analysis' },
    { label: 'Our Future', key: 'future' },
]

const Header = ({ onBackToMain, onMenuClick, onLogoClick, currentPage }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const handleLogoClick = () => {
        if (onLogoClick) {
            onLogoClick()
        } else if (onBackToMain) {
            onBackToMain()
        } else {
            // 메인 페이지로 스크롤
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            })
        }
    }

    const handleMenuSelect = (menuType) => {
        onMenuClick?.(menuType)
        setIsMobileMenuOpen(false)
    }

    const handleMenuClick = (menuType) => {
        onMenuClick?.(menuType)
    }

    // ESC 키로 모바일 메뉴 닫기
    const handleKeyDown = (e) => {
        if (e.key === 'Escape' && isMobileMenuOpen) {
            setIsMobileMenuOpen(false)
        }
    }

    const headerClassName = useMemo(() => {
        const classes = ['header']
        if (currentPage !== 'main') classes.push('header-in-menu')
        if (currentPage === 'future') classes.push('header-in-future')
        return classes.join(' ')
    }, [currentPage])

    return (
        <header
            className={headerClassName}
            onKeyDown={handleKeyDown}
        >
            <div className="header-content">
                <div className="logo-container">
                    <h1
                        className="logo-text"
                        onClick={handleLogoClick}
                        role="button"
                        tabIndex={0}
                        aria-label="메인 페이지로 이동"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                handleLogoClick()
                            }
                        }}
                    >
                        Marryday
                    </h1>
                </div>
                <nav className="header-menu" aria-label="주요 메뉴">
                    {MENU_ITEMS.map((item) => (
                        <button
                            key={item.key}
                            className={`menu-item ${currentPage === item.key ? 'active' : ''}`}
                            onClick={() => handleMenuClick(item.key)}
                            aria-label={`${item.label} 페이지로 이동`}
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>
                <button
                    className={`mobile-menu-toggle ${isMobileMenuOpen ? 'open' : ''}`}
                    onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                    aria-label={isMobileMenuOpen ? '모바일 메뉴 닫기' : '모바일 메뉴 열기'}
                    aria-expanded={isMobileMenuOpen}
                >
                    {isMobileMenuOpen ? <FiX /> : <FiMenu />}
                </button>
            </div>
            <nav
                className={`mobile-menu-panel ${isMobileMenuOpen ? 'open' : ''}`}
                aria-label="모바일 메뉴"
                aria-hidden={!isMobileMenuOpen}
            >
                {MENU_ITEMS.map((item) => (
                    <button
                        key={item.key}
                        className={`mobile-menu-item ${currentPage === item.key ? 'active' : ''}`}
                        onClick={() => handleMenuSelect(item.key)}
                        aria-label={`${item.label} 페이지로 이동`}
                    >
                        {item.label}
                    </button>
                ))}
            </nav>
        </header>
    )
}

export default Header

