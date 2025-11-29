import { useState } from 'react'
import '../../styles/Main/FAQSection.css'

const faqs = [
    {
        question: '목록에 없는 드레스도 내 사진에 맞춰 입어볼 수 있나요?',
        answer: '네, 가능합니다. 커스텀 피팅기능에서는 사용자가 직접 촬영하거나 저장한 드레스 이미지를 업로드하면, AI가 고객님의 체형과 실루엣에 맞게 자연스럽게 피팅해 드립니다.'
    },
    {
        question: '분석 후 추천된 카테고리는 어디서 확인하나요?',
        answer: '체형 분석 완료 후 나타나는 카테고리 배지를 클릭하면 일반피팅 화면으로 이동하여 바로 드레스를 가상 피팅할 수 있습니다.'
    },
    {
        question: '서비스 이용은 무료인가요?',
        answer: '네, 모든 피팅 기능을 무료로 자유롭게 이용하실 수 있습니다. 사진 업로드, 드레스 피팅, 비교 기능까지 제한 없이 사용 가능합니다.'
    },
    {
        question: 'AI 분석은 얼마나 걸리나요?',
        answer: '이미지와 네트워크 상태에 따라 다르지만 보통 20초 이내에 분석이 완료되며, 분석 중에는 전용 로딩 애니메이션이 표시됩니다.'
    }
]

const FAQSection = () => {
    const [activeIndex, setActiveIndex] = useState(0)

    const handleToggle = (index) => {
        setActiveIndex((prev) => (prev === index ? -1 : index))
    }

    return (
        <section className="faq-section">
            <div className="faq-container">
                <div className="faq-header">
                    <p className="faq-badge">FAQ</p>
                    <h2>자주 묻는 질문</h2>
                    <p>피팅을 시작하기 전, 많이 궁금해 하신 내용을 모았습니다</p>
                </div>
                <div className="faq-grid">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className={`faq-item ${activeIndex === index ? 'active' : ''}`}
                            onClick={() => handleToggle(index)}
                        >
                            <div className="faq-question">
                                <span>{faq.question}</span>
                            </div>
                            <span className="faq-toggle-icon">{activeIndex === index ? '−' : '+'}</span>
                            <div className="faq-answer" style={{ maxHeight: activeIndex === index ? '200px' : '0px' }}>
                                <p>{faq.answer}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default FAQSection

