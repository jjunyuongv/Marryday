import { useState, useEffect, useRef } from 'react'
import '../../styles/Main/DressSlider.css'

const DressSlider = () => {
    const [offset, setOffset] = useState(0)
    const [titleVisible, setTitleVisible] = useState(false)
    const sliderRef = useRef(null)
    const titleRef = useRef(null)
    const isTransitioning = useRef(false)

    const dresses = [
        '/Image/n1.png',
        '/Image/n2.png',
        '/Image/n3.png',
        '/Image/n4.png',
        '/Image/n5.png',
        '/Image/n6.png',
        '/Image/n7.png',
        '/Image/n8.png',
        '/Image/n9.png',
        '/Image/n10.png',
        '/Image/n11.png',

    ]

    // 무한 슬라이드를 위해 이미지를 3번 반복 (총 18개)
    const infiniteDresses = [...dresses, ...dresses, ...dresses]

    useEffect(() => {
        const intervalId = setInterval(() => {
            if (!isTransitioning.current) {
                isTransitioning.current = true
                setOffset((prev) => prev + 1)
            }
        }, 3000) // 3초마다 한 개씩 이동

        return () => clearInterval(intervalId)
    }, [])

    // 제목 스크롤 애니메이션
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setTitleVisible(true)
                }
            },
            { threshold: 0.1 }
        )

        if (titleRef.current) {
            observer.observe(titleRef.current)
        }

        return () => {
            if (titleRef.current) {
                observer.unobserve(titleRef.current)
            }
        }
    }, [])

    useEffect(() => {
        if (offset > 0) {
            const timer = setTimeout(() => {
                // 첫 번째 세트(6개)를 지나면 위치를 리셋
                if (offset >= dresses.length) {
                    sliderRef.current.style.transition = 'none'
                    setOffset(0)
                    setTimeout(() => {
                        sliderRef.current.style.transition = 'transform 0.5s ease-in-out'
                        isTransitioning.current = false
                    }, 50)
                } else {
                    isTransitioning.current = false
                }
            }, 500) // 애니메이션 시간과 동기화

            return () => clearTimeout(timer)
        } else {
            isTransitioning.current = false
        }
    }, [offset, dresses.length])

    return (
        <div className="dress-slider-container">
            <div style={{ textAlign: 'center' }}>
                <h2
                    ref={titleRef}
                    className={`dress-slider-title ${titleVisible ? 'visible' : ''}`}
                >

                    다양한 드레스를 피팅해보세요

                </h2>
            </div>
            <div className="dress-slider-wrapper">
                <div
                    ref={sliderRef}
                    className="dress-slider"
                    style={{
                        transform: `translateX(calc(-1 * ${offset} * (20% + 50px)))`,
                        transition: 'transform 0.5s ease-in-out'
                    }}
                >
                    {infiniteDresses.map((dress, index) => (
                        <div key={`${dress}-${index}`} className="dress-slider-card">
                            <img src={dress} alt={`Dress ${(index % dresses.length) + 1}`} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default DressSlider

