# 웨딩드레스 AI 매칭 시스템

사진을 업로드하고 원하는 웨딩드레스를 선택하면 AI가 자동으로 매칭해주는 웹 애플리케이션입니다.

## 기능

- 📸 전신사진 또는 얼굴사진 업로드
- 👗 다양한 웨딩드레스 스타일 선택
- 🎨 AI 기반 이미지 투 이미지 매칭
- ⬇️ 결과 이미지 다운로드

## 시작하기

### 설치

```bash
npm install
```

### 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 백엔드 API URL을 설정하세요:

```env
VITE_API_URL=https://marryday.kro.kr
```

**참고:** Vercel은 HTTPS로 배포되므로 백엔드도 HTTPS를 사용해야 Mixed Content 오류를 방지할 수 있습니다. 코드는 자동으로 HTTPS 환경에서 HTTP를 HTTPS로 변환합니다.

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

### 빌드

```bash
npm run build
```

## 배포 (Vercel)

### Vercel에 배포하기

1. **Vercel 계정 생성 및 프로젝트 연결**
   - [Vercel](https://vercel.com)에 로그인
   - "Add New Project" 클릭
   - GitHub/GitLab/Bitbucket 저장소 연결

2. **환경 변수 설정**
   - Vercel 대시보드에서 프로젝트 설정 → Environment Variables
   - 다음 환경 변수 추가:
     ```
     VITE_API_URL=https://marryday.kro.kr
     ```
     
     **중요:** HTTPS를 사용해야 Mixed Content 오류를 방지할 수 있습니다.

3. **배포 설정**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **배포**
   - "Deploy" 버튼 클릭
   - 자동으로 빌드 및 배포 진행

### 배포 후 확인사항

- 환경 변수가 올바르게 설정되었는지 확인
- API 연결이 정상적으로 작동하는지 테스트
- CORS 설정이 백엔드에서 올바르게 되어 있는지 확인

## 기술 스택

- React 18
- Vite
- Axios
- Modern CSS

