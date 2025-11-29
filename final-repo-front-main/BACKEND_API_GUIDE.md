# 백엔드 API 연동 가이드

## 환경 설정

`.env` 파일에 백엔드 API URL을 설정하세요:

```env
VITE_API_URL=http://your-backend-url:port
```

기본값은 `http://localhost:8000` 입니다.

---

## API 엔드포인트

### 1. 배경 제거 API

**Endpoint:** `POST /api/remove-background`

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `dress_image`: File (드레스 이미지 파일)

**Response:**
```json
{
  "success": true,
  "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "message": "배경 제거 완료"
}
```

**설명:**
- 드레스 이미지의 배경을 제거하는 AI 기능
- 응답으로 Base64 인코딩된 PNG 이미지를 반환
- 투명 배경의 PNG 형식 권장

---

### 2. 커스텀 매칭 API

**Endpoint:** `POST /api/custom-match`

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `full_body_image`: File (전신 사진)
  - `dress_image`: File (드레스 이미지)

**Response:**
```json
{
  "success": true,
  "result_image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "message": "매칭 완료"
}
```

**설명:**
- 전신 사진과 드레스 이미지를 매칭하는 AI 기능
- 응답으로 Base64 인코딩된 매칭 결과 이미지 반환

---

### 3. 자동 매칭 API (일반 메뉴)

**Endpoint:** `POST /api/auto-match`

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `person_image`: File (사용자 사진)
  - `dress_id`: String (드레스 ID) 또는
  - `dress_url`: String (드레스 이미지 URL) 또는
  - `dress_image`: File (드레스 이미지 파일)

**Response:**
```json
{
  "success": true,
  "result_image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "message": "매칭 완료"
}
```

---

## 사용 흐름

### 커스텀 메뉴 사용 흐름

1. **전신사진 업로드**
   - 사용자가 전신사진을 업로드

2. **드레스 이미지 업로드**
   - 사용자가 드레스 이미지를 업로드

3. **배경 제거 (필수)**
   - 사용자가 "배경지우기" 버튼 클릭
   - `removeBackground` API 호출
   - 배경이 제거된 이미지(누끼)로 업데이트
   - 버튼이 "✓ 배경 제거 완료"로 변경

4. **매칭 실행**
   - 사용자가 "매칭하기" 버튼 클릭
   - 배경 제거를 안 한 경우: "배경지우기 버튼을 먼저 눌러주세요!" 알림
   - 배경 제거를 한 경우: `customMatchImage` API 호출

5. **결과 표시**
   - 우측 영역에 매칭 결과 이미지 표시

---

## 에러 처리

API 호출 실패 시 사용자에게 알림 메시지 표시:

```javascript
try {
  const result = await removeBackground(dressImage)
  // 성공 처리
} catch (error) {
  console.error('배경 제거 중 오류 발생:', error)
  alert(`배경 제거 중 오류가 발생했습니다: ${error.message}`)
}
```

---

## 이미지 형식

### 입력 이미지
- 지원 형식: JPEG, PNG, WEBP
- 권장 크기: 최대 10MB
- 권장 해상도: 1024x1024 이하

### 출력 이미지
- 형식: Base64 인코딩된 Data URL
- 예: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...`
- 배경 제거 시: PNG (투명 배경)
- 매칭 결과: PNG 또는 JPEG

---

## 개발 시 주의사항

1. **CORS 설정**: 백엔드에서 CORS를 허용해야 합니다.
2. **타임아웃**: AI 처리 시간이 길 수 있으므로 적절한 타임아웃 설정 필요
3. **파일 크기**: 업로드 파일 크기 제한 확인
4. **로딩 상태**: 처리 중 스피너 표시로 사용자 경험 개선

---

## 테스트

로컬 개발 시:
```bash
npm run dev
```

백엔드 서버가 `http://localhost:8000`에서 실행 중이어야 합니다.

