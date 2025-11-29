import React, { useState } from 'react'
import { FiMenu, FiX } from 'react-icons/fi'
import '../styles/Header.css'

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
        if (onMenuClick) {
            onMenuClick(menuType)
        }
        setIsMobileMenuOpen(false)
    }

    const menuItems = [
        { label: '일반피팅', key: 'general' },
        { label: '커스텀피팅', key: 'custom' },
        { label: '체형 분석', key: 'analysis' },
    ]

    return (
        <header className={`header ${currentPage !== 'main' ? 'header-in-menu' : ''}`}>
            <div className="header-content">
                <div className="logo-container">
                    <h1 className="logo-text" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
                        Marryday
                    </h1>
                </div>
                <nav className="header-menu">
                    {menuItems.map((item) => (
                        <button
                            key={item.key}
                            className="menu-item"
                            onClick={() => onMenuClick && onMenuClick(item.key)}
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>
                <button
                    className={`mobile-menu-toggle ${isMobileMenuOpen ? 'open' : ''}`}
                    onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                    aria-label="모바일 메뉴 열기"
                >
                    {isMobileMenuOpen ? <FiX /> : <FiMenu />}
                </button>
            </div>
            <div className={`mobile-menu-panel ${isMobileMenuOpen ? 'open' : ''}`}>
                {menuItems.map((item) => (
                    <button
                        key={item.key}
                        className="mobile-menu-item"
                        onClick={() => handleMenuSelect(item.key)}
                    >
                        {item.label}
                    </button>
                ))}
            </div>
        </header>
    )
}

export default Header

