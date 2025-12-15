# 💍 Marryday

> **AI 맞춤 웨딩드레스 피팅 플랫폼**  
> **개발기간: 2025.11 ~ 2025.12**

## 👩‍💻 개발자
**천서영** - 디자인 구축 + 프론트엔드 개발 + 메인 영상 기획 + 홍보

## 🔗 배포
**웹사이트** : https://www.marryday.co.kr/ 

## 📚 목차
- [🏛️ 프로젝트 소개](#-프로젝트-소개)
- [🚀 시작 가이드](#-시작-가이드)
- [🧱 기술 스택](#-기술-스택)
- [🛠️ 시스템/구성 특징](#-시스템-구성)
- [✨ 주요 기능](#-주요-기능)
- [📂 주요 구성 파일](#-주요-구성-파일)

## 🏛️ 프로젝트 소개
Marryday는 사용자가 자신의 전신 사진과 드레스 이미지를 업로드하면 AI가 자동으로 피팅하여  
체형에 맞는 드레스를 시각화해주는 웹 플랫폼입니다.

- **복잡한 피팅 과정 제거:** 온라인으로 다양한 드레스와 커스텀 옵션 체험 가능  
- **사용자 친화적 인터페이스:** 메인 화면 영상으로 핵심 기능과 체험 과정 직관적 전달  
- **AI 기반 자동 합성:** 실제 피팅 느낌과 가까운 결과 제공  

## 🚀 시작 가이드

### 1️⃣ 요구 사항
- Node.js v20+  
- npm 최신 버전  

### 2️⃣ 설치 및 실행
```bash
npm install
npm run dev
```

## 🧱 기술 스택

### Development
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Tailwind CSS](https://img.shields.io/badge/tailwindcss-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white)

### Tooling
![Visual Studio Code](https://img.shields.io/badge/Visual%20Studio%20Code-007ACC?style=for-the-badge&logo=Visual%20Studio%20Code&logoColor=white)
![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=Git&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=GitHub&logoColor=white)
![Postman](https://img.shields.io/badge/Postman-FF6C37?style=for-the-badge&logo=postman&logoColor=white)

### Package Manager
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=Node.js&logoColor=white)
![npm](https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white)




### 🛠️ 시스템/구성 특징

- AI 이미지 합성 모듈: 사용자 전신 이미지와 드레스 이미지를 조합하여 체형 맞춤 피팅 결과 제공

- 3D 드레스 시각화: Three.js 기반 회전, 확대, 포즈 변경

- 반응형 디자인: Tailwind CSS 적용, PC/모바일 UX 최적화

- 사용자 경험 개선: 로딩 스피너, 자동 스크롤, 모달 인터페이스

- 모듈화 구조: 각 기능(UI, 3D, AI 합성, 마이페이지)을 독립 모듈로 설계

## ✨ 주요 기능

### 1️⃣ 일반 피팅 기능  
* **드래그&드롭 피팅**: 드레스 리스트에서 원하는 드레스를 선택하고 본인 사진 위로 드래그하여 실제 착용한 것처럼 확인할 수 있습니다.  
* **실시간 시각화**: 드레스 착용 결과를 실시간으로 확인하며, 확대/회전 등 기본 조작이 가능합니다.  

### 2️⃣ 커스텀 피팅 기능  
* **본인 선택 드레스 적용**: 사용자가 직접 업로드한 드레스 이미지를 AI가 본인 사진에 맞춰 자동 피팅합니다.  
* **옵션 반영 가능**: 색상, 길이 등 커스텀 옵션을 적용해 다양한 스타일을 체험할 수 있습니다.  

### 3️⃣ 체형 분석 기능  
* **체형 기반 추천**: 사용자의 체형을 분석하여 가장 어울리는 드레스 카테고리를 추천합니다.  
* **맞춤형 스타일 가이드**: 체형에 맞는 드레스 스타일과 착용 팁을 함께 제공하여 선택을 돕습니다.  

## 📄 구성 파일

| 기능                   | 설명                                       | 주요 파일/디렉토리                          |
|------------------------|--------------------------------------------|---------------------------------------------|
| 페이지 라우팅            | 전체 서비스의 라우팅을 관리                 | `App.jsx`, `main.jsx`                        |
| 화면 구성 컴포넌트       | 메인, 일반피팅, 커스텀피팅, 체형분석 등 주요 UI 모듈 구성     | `components/*`, `pages/*`                              |
| 메인 화면 구성            | 비디오 배경, 드레스 컬렉션, FAQ, 사용 가이드 등 메인 요소 관리        | `pages/Main/*`                                    |
| 정적 리소스 관리         | 이미지, 영상, Lottie 애니메이션 등 정적 파일 관리         | `public/Image/*`                                  |
| 유틸리티 함수            | API 통신, 쿠키 관리, 플랫폼 감지 등 유틸리티 함수         | `utils/*`                              |
| 스타일 및 설정           | Vite 설정, 전역 스타일, 페이지별 CSS         | `vite.config.js`, `styles/*` |
| 정적 웹페이지 리소스     | HTML 템플릿, 파비콘, robots.txt 등              | `public/*`                                   |




## 🗂️ 시스템 구성

### 디렉토리 구조

```
Fi_marryday_front/          # 프론트엔드 프로젝트 루트
│
├── public/                # 정적 파일 및 HTML 템플릿
│   ├── Image/             # 이미지, 동영상 등 정적 리소스
│   │   ├── analysis/      # 체형분석 관련 이미지
│   │   ├── common/        # 공통 아이콘 및 이미지
│   │   ├── custom/        # 커스텀피팅 관련 이미지
│   │   ├── general/       # 일반피팅 관련 이미지
│   │   ├── lottie/        # Lottie 애니메이션 JSON 파일
│   │   └── main/          # 메인 페이지 이미지 및 동영상
│   ├── favicon.ico        # 파비콘
│   ├── index.html         # 메인 HTML
│   ├── robots.txt         # 검색 엔진 크롤러 설정
│   └── google*.html       # Google 검증 파일
│
├── src/                   # 소스 코드 루트
│   ├── components/        # 공통 UI 컴포넌트 모음 (컴포넌트 + 스타일 함께)
│   │   ├── Header/
│   │   │   ├── Header.jsx
│   │   │   └── Header.css
│   │   ├── Modal/
│   │   │   ├── Modal.jsx
│   │   │   └── Modal.css
│   │   └── ReviewModal/
│   │       ├── ReviewModal.jsx
│   │       └── ReviewModal.css
│   │
│   ├── pages/             # 페이지별 컴포넌트
│   │   ├── Main/          # 메인 페이지
│   │   │   ├── MainPage.jsx
│   │   │   └── components/     # Main 페이지 전용 컴포넌트들
│   │   │       ├── VideoBackground/
│   │   │       │   ├── VideoBackground.jsx
│   │   │       │   └── VideoBackground.css
│   │   │       ├── AboutUs/
│   │   │       │   ├── AboutUs.jsx
│   │   │       │   └── AboutUs.css
│   │   │       ├── DomeGallery/
│   │   │       │   ├── DomeGallery.jsx
│   │   │       │   └── DomeGallery.css
│   │   │       ├── DressCollection/
│   │   │       │   ├── DressCollection.jsx
│   │   │       │   └── DressCollection.css
│   │   │       ├── FAQSection/
│   │   │       │   ├── FAQSection.jsx
│   │   │       │   └── FAQSection.css
│   │   │       ├── UsageGuideSection/
│   │   │       │   ├── UsageGuideSection.jsx
│   │   │       │   └── UsageGuideSection.css
│   │   │       ├── NextSection/
│   │   │       │   ├── NextSection.jsx
│   │   │       │   └── NextSection.css
│   │   │       └── ScrollToTop/
│   │   │           ├── ScrollToTop.jsx
│   │   │           └── ScrollToTop.css
│   │   │
│   │   ├── General/       # 일반피팅 페이지
│   │   │   ├── GeneralFitting.jsx
│   │   │   ├── ImageUpload.css
│   │   │   └── DressSelection.css
│   │   │
│   │   ├── Custom/        # 커스텀피팅 페이지
│   │   │   ├── CustomFitting.jsx
│   │   │   ├── CustomUpload.css
│   │   │   └── CustomResult.css
│   │   │
│   │   └── Analysis/      # 체형분석 페이지
│   │       ├── BodyAnalysis.jsx
│   │       └── BodyTypeFitting.css
│   │
│   ├── styles/            # 전역 스타일만 (공통 스타일)
│   │   ├── App.css        # 앱 전역 스타일
│   │   └── index.css      # 전역 스타일 정의
│   │
│   ├── utils/             # 유틸리티 함수
│   │   ├── api.js         # API 통신 함수
│   │   ├── cookies.js     # 쿠키 관리 함수
│   │   └── platform.js    # 플랫폼 감지 함수
│   │
│   ├── App.jsx            # 최상위 라우터 컴포넌트
│   └── main.jsx           # React 앱 진입점
│
├── package.json           # 프로젝트 의존성 및 실행 스크립트
├── vite.config.js         # Vite 빌드 도구 설정
├── vercel.json            # Vercel 배포 설정
└── README.md              # 프로젝트 설명 문서
```


