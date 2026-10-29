# MLB Lab Website

React + Vite + JavaScript(JSX) 기반 MLB Lab 연구실 홈페이지입니다. 인물·연구 분야·논문·소식·연락처는 JSON에서 관리하며, 백엔드와 데이터베이스 없이 빌드에 포함합니다.

## 로컬 실행

Node.js 24.x와 npm을 사용합니다 (`.nvmrc`, `package-lock.json` 참고).

```sh
npm ci
npm run dev
```

표시된 Local URL을 엽니다. 기본 주소는 `http://localhost:5173/`입니다. 기존 서버가 실행 중이면 저장 후 자동 갱신됩니다. Windows에서 npm을 찾지 못하면 Node.js 설치 경로를 PATH에 추가한 뒤 터미널을 다시 열어 주세요.

```sh
npm run validate
npm test
npm run build
npm run check:pages
npm run preview
```

`build`는 콘텐츠 검증, Vite 클라이언트·서버 빌드, 경로별 본문 HTML 생성을 실행합니다. 콘텐츠 검증 실패 시 중단합니다. 서버 빌드는 HTML 생성을 위한 임시 작업이며 배포 후 서버는 필요 없습니다. 임시 산출물은 정리하고 `dist/`만 배포합니다. `check:pages`는 루트 사이트의 산출물을 정적 HTTP 서버로 검사한 뒤 `/lab-preview/` 기준으로 별도 임시 빌드·검사합니다. `preview`는 빌드 결과 확인용이며 운영 서버가 아닙니다. 새 패키지가 필요한 경우에만 `npm install`을 사용하고 lockfile을 함께 갱신합니다.

Home Hero는 최종 데모 `reference/song_lab_genomic_hero_v3.html`을 React로 옮긴 Genomic 장면입니다. Three.js **0.162.0** 한 패키지를 사용하며 DNA 4개·네트워크·파티클·마우스 반응을 기준 수치대로 유지합니다. 사용자 요청으로 하단 키워드·모션 버튼과 제목 아래 tagline은 제거했습니다. 문구는 `src/data/home.json`의 hero, 배치는 `src/components/hero.css`, 장면은 `src/lib/genomic-scene.js`에서 관리합니다. 기존 Header와 About 이하 콘텐츠는 유지합니다. 기존 건물 사진은 파일을 보존하고 Hero에서만 제외했습니다. `prefers-reduced-motion`에서는 정지하며 설정 해제 시 자동 재개합니다. WebGL 실패 시 원본의 정적 DNA SVG를 표시합니다. 렌더러는 클라이언트에서만 지연 로딩하므로 정적 HTML 생성과 GitHub Pages 배포 방식을 유지합니다.

개발 서버를 실행한 상태에서 `npm run check:hero`로 설치된 Chrome의 headless 검사를 실행할 수 있습니다. 기본 Windows Chrome 경로가 다르면 CHROME_PATH를 설정하세요. 기준 HTML은 외부 추적 스크립트를 제거하고 같은 로컬 Three.js로 비교하며 원본 파일은 수정하지 않습니다. 화면 크기별 비교 스크린샷과 보고서는 OS 임시 폴더에 저장됩니다. `npm run check:hero -- http://127.0.0.1:4173/`처럼 production preview 주소도 지정할 수 있습니다. Node 테스트와 CI에는 Chrome이 필요하지 않습니다.

## 구조와 페이지

| 위치 | 역할 |
| --- | --- |
| `src/app`, `src/pages` | 라우팅과 페이지 |
| `src/app/routes.js` | 라우터·내비게이션·HTML 생성이 공유하는 경로와 제목 |
| `src/entry-server.jsx`, `scripts/build-pages.mjs` | 빌드 시 React 본문 렌더링과 경로별 HTML 생성 |
| `scripts/check-pages.mjs` | SPA fallback 없는 정적 HTTP 검사 |
| `src/components` | 공통 레이아웃, 프로필 카드, 이미지 대체 표시 |
| `src/data` | 페이지별 JSON 콘텐츠 |
| `src/styles/global.css` | CSS 변수, 전체 페이지 및 반응형 스타일 |
| `src/lib/content.js` | 정렬, 날짜, base 대응 파일 경로 |
| `scripts/validate-content.mjs` | 콘텐츠 계약 및 로컬 파일 검증 |
| `tests` | 데이터 검증 및 정렬 회귀 테스트 |
| `public/images`, `public/files` | 직접 추가할 사진과 PDF (필요할 때 폴더 생성) |

Home `/`, Professor `/people/professor/`, Members `/people/members/`, Alumni `/people/alumni/`, Research `/research/`, Publications `/publications/`, News `/news/`, Contact `/contact/`를 제공합니다. `/people/`은 Professor로 이동합니다. 내부 내비게이션은 디렉터리 URL인 마지막 `/`를 포함하며, 마지막 `/` 없이 직접 접속하면 GitHub Pages에서 디렉터리 주소로 이동할 수 있습니다.

공통 Header/Footer와 People 드롭다운을 사용합니다. 메뉴 버튼은 클릭·터치·Enter/Space로 열고 Tab으로 링크를 이동하며 Escape로 닫습니다. 포커스가 People 영역을 떠나거나 외부를 클릭해도 닫힙니다. 960px 이하에서는 모바일 내비게이션, 600px 이하에서는 한 열 배치를 사용합니다.

Home 대표 사진은 Header 뒤까지 이어져 좌우 전체 폭과 첫 화면 높이(`100svh`)를 채웁니다. Home에서만 Header를 투명하게 사진 위에 겹치고 로고·메뉴를 흰색으로 표시합니다. 상단 그라데이션으로 메뉴 가독성을 확보하며, 모바일 메뉴를 펼치면 어두운 배경과 내부 스크롤을 제공합니다. 짧은 화면에서는 제목이 Header와 겹치지 않도록 기본 Header 높이(데스크톱 101px·모바일 85px)에 240px을 더한 최소 Hero 높이를 적용합니다. 제목·환영 문구는 사진 왼쪽 아래에 표시하며 소개와 하단 링크는 스크롤하면 보입니다. 사진은 `object-fit: cover`로 일부 잘릴 수 있고 기본 중앙, 600px 이하에서는 가로 60%를 기준으로 표시합니다. 이 설정은 `src/styles/global.css`의 Home 및 overlay Header 영역에서 조정합니다. Home의 예시 안내는 사진 아래에, 다른 페이지는 기존처럼 흰색 Header 아래에 표시됩니다.

Members와 Alumni는 `:is(.members-grid, .alumni-grid)` 아래의 같은 회색 카드 스타일을 사용합니다. 페이지 최대 폭은 1360px이고, 기본 3열·1050px 이하 2열·600px 이하 1열이며 카드 간격은 24~28px입니다. 이름은 28px, 직책·학력은 20px로 통일합니다. 사진은 4:5 비율과 기본 `50% 20%` 구도를 사용하고, Members는 `photo.objectPosition`으로 개별 조정할 수 있습니다. 카드 높이는 가장 긴 내용에 맞춰 균일하게 늘어나며 본문을 잘라내지 않습니다. Hover 효과는 마우스 환경에서만 적용하고 모션 줄이기 설정에서는 이동을 생략합니다. 인물 데이터와 페이지 제목은 유지하며 Professor는 별도의 스타일을 사용합니다. Members와 Alumni는 bs/ms/phd별 통합 문자열 학력을 사용하며 Professor는 기존 객체 형식을 유지합니다.

## 데이터 수정

입력 방법과 전체 필드는 [콘텐츠 가이드](docs/content-guide.md)에 있습니다. JSON 수정 후 `npm run validate`를 실행하세요. JSX 수정 없이 목록에 데이터를 추가할 수 있습니다.

- 모든 파일은 UTF-8 JSON으로 저장합니다. JSON에는 주석이나 마지막 쉼표를 사용하지 않습니다.
- `id`는 목록 안에서 고유한 소문자·숫자·하이픈 문자열입니다. 기존 항목 ID는 가급적 유지합니다.
- 연구원·연구 분야는 `displayOrder` 오름차순, 논문은 연도 내림차순과 같은 연도 내 `displayOrder` 오름차순입니다.
- News 날짜는 **실제 날짜인 `YYYY-MM-DD`**로 저장합니다. 날짜 내림차순으로 전문과 모든 사진을 표시합니다. 같은 날짜는 ID 순서로 고정됩니다.
- 입력하지 않은 선택 필드는 생략하거나 `null`로 둡니다. 빈 문자열 대신 `null`을 사용하세요. Members/Alumni의 Position·학위·Email은 값이 있을 때만 표시됩니다.
- Members와 Alumni의 education은 `"bs": "대학명, 학과명, 졸업 연도"`처럼 bs/ms/phd마다 통합 문자열을 입력합니다. 값이 없으면 null로 두세요. Professor는 기존 학위 객체 형식을 유지합니다.
- 이미지가 없으면 `null`, 사진 슬롯만 보이려면 `{ "src": null, "alt": "사진 설명" }`을 사용합니다. 로딩 실패 시에도 기본 대체 영역이 표시됩니다.
- 사진은 `public/images/` 아래에 넣고 JSON에는 `images/people/name.webp`처럼 **public을 제외한 상대 경로**를 씁니다. PDF는 `public/files/`와 `files/paper.pdf`를 사용합니다. 한글·단어 사이 공백도 지원하며 JSON에는 URL 인코딩하지 않은 원래 파일명을 입력합니다. 영문·숫자·하이픈·밑줄을 권장하고 대소문자를 정확히 맞춥니다. 예약문자·역슬래시·상위 경로는 허용하지 않습니다.
- 외부 링크는 http(s) URL로 입력합니다. Publications의 논문 링크는 url 하나로 관리합니다. 이미지 파일의 실제 존재와 대소문자는 검증하지만 외부 서버 응답·논문 진위는 자동 검증하지 않습니다.
- Publications의 title/venue는 서식 조각 배열이고, authors는 저자 한 명당 `{ "text": "이름", "bold": true, "underline": true, "italic": true }` 한 항목인 목록입니다. 필요한 서식만 지정합니다. 저자 사이 쉼표와 마지막 마침표는 자동으로 표시하므로 별도 항목으로 입력하지 않습니다. year는 연도별 분류용이고 venue에는 표시할 연도와 추가 설명까지 입력합니다. 목록 위 서식 안내는 `publications-note.json`에서 관리합니다. HTML을 직접 삽입하지 않습니다.
- 예시 배지와 초기 버전 안내는 제거했습니다. 콘텐츠에는 확인된 자료만 입력하며 별도 샘플 여부 필드는 사용하지 않습니다.
- 뉴스는 `NewsFeed`와 `NewsPost`로 분리되어 있습니다. 향후 정렬된 게시물의 일부를 Feed에 전달하고 더 보기 버튼을 추가할 수 있습니다.

## 콘텐츠 수정 위치

- `site.json`: 연구실 명칭, 부제, Footer 이름·로고·소속 문구
- `home.json`: Genomic Hero 문구·태그, About 소개·키워드·하단 메뉴
- `professor.json`: 교수 이름·직위·소속·소개·관심 분야·학력·사진·이메일·외부 링크
- `members.json`, `alumni.json`: 구성원·졸업생 프로필. Alumni Position이 현재 직위인지 재직 당시 직위인지 문구로 명확히 표시
- `research.json`: 연구 분야 제목·설명
- `publications.json`: 첨부 원문의 실제 논문 43개를 반영함. 신규 논문은 같은 서식 조각 구조로 추가
- `news.json`: 연구실 소식 전문·날짜·사진·본문 서식
- `contact.json`: 공개 가능한 주소·이메일·전화·지도 URL
- `index.html`: 공식 명칭과 소개에 맞게 기본 title·description 수정

확인할 자료가 없으면 목록은 `[]`, 교수는 `null`로 둘 수 있습니다. 연락처의 ‘등록 예정’ 안내는 데이터 입력 시 실제 정보로 대체됩니다. 사진·논문 PDF는 공개 권한이 있는 자료만 사용하세요.

Professor에는 현재 사용자가 제공한 이미지의 경력(Experience), 학력(Education), 연락처(Contact)를 반영했습니다. 이름·소속은 기존 입력을 유지했고 프로필 ID는 `professor`입니다. 경력의 기간은 `YYYY-MM`, 이메일 표시 문구는 `emailDisplay`, 교수 연락처는 `contact`에서 관리합니다. 별도 Contact 페이지의 데이터는 그대로입니다. 이미지에 없는 학위 연도나 재직 기간은 추가하지 않았습니다. 필드 상세는 콘텐츠 가이드를 참고하세요.

## GitHub Pages와 배포 전환

기존 운영 URL은 **https://mlb-lab.github.io/** 입니다. `mlb-lab/mlb-lab.github.io`는 Organization 루트 사이트이므로 Vite `base`와 BrowserRouter `basename`은 `/`입니다. 프로젝트 사이트로 옮기는 경우에만 빌드 환경변수 `VITE_BASE_PATH=/<repository>/`를 설정합니다. 이 값을 Vite의 `BASE_URL`을 통해 클라이언트·서버 Router와 이미지·PDF 경로에 동일하게 사용합니다. 커스텀 도메인의 루트에 게시하는 경우도 `/`입니다.

**BrowserRouter + 빌드 시 정적 HTML 생성**을 사용합니다. `/news/` 요청은 실제 `dist/news/index.html`에 대응하므로 직접 접속·새로고침에 SPA 서버 재작성 규칙이 필요 없습니다. 각 HTML에는 해당 페이지 본문과 제목이 있고, JS 실행 후 React가 hydrateRoot로 이벤트를 연결합니다. 개발 환경의 빈 루트에는 createRoot를 사용합니다. 서버 프로세스·신규 런타임 패키지 없이 현재 고정 페이지 구조에 적합한 방식입니다.

```text
dist/
├── index.html
├── people/index.html                 # Professor로 이동하는 별칭
├── people/professor/index.html
├── people/members/index.html
├── people/alumni/index.html
├── research/index.html
├── publications/index.html
├── news/index.html
├── contact/index.html
├── 404.html
└── assets/                           # 모든 페이지가 공유하는 JS·CSS
```

`404.html`은 미등록 주소용입니다. 정상 페이지를 표시하기 위한 404 fallback·홈 강제 이동은 사용하지 않으며, 잘못된 주소는 HTTP 404를 유지합니다. 개발 서버나 `vite preview`의 SPA fallback만으로 배포 호환성을 판단하지 마세요. `npm run check:pages`는 실제 파일이 없는 페이지를 404로 처리하는 별도 서버에서 검사합니다. 이 검사는 Pages 동작을 모사하며 GitHub 서버에서의 실제 검증은 배포 후 별도로 수행합니다.

기존 `/#/news` 등의 **알려진 경로**는 본문 연결 전에 `/news/`로 전체 이동합니다. 바깥 URL과 해시 안의 쿼리는 함께 보존하며, 일반 본문 앵커는 건드리지 않습니다. 기존 `/#/people`도 Professor로 이동합니다. 서버가 해시를 받지 않으므로 이전 링크 자동 전환에는 JavaScript가 필요합니다. `/people/` 별칭의 JS 이동은 쿼리·앵커를 보존하며 JS가 꺼진 경우 meta refresh로 기본 Professor 주소에 이동합니다.

새 페이지를 추가할 때는 `src/app/routes.js`에 고유 ID·정규 경로·제목을 등록하고 App의 페이지 컴포넌트 매핑과 필요한 내비게이션을 연결하세요. 이 목록에 등록된 페이지를 빌드가 자동 생성합니다. 동적 경로를 추가하면 실제 생성할 경로 목록도 제공해야 합니다. 내부 링크는 Link/NavLink와 공통 pagePath를 사용하고, CSS와 JSON 콘텐츠는 라우팅 변경을 위해 수정하지 않습니다.

`.github/workflows/ci.yml`은 PR/main/feat/fix 브랜치에서 설치·테스트·빌드·루트/프로젝트 정적 경로 검증을 실행합니다. `.github/workflows/deploy.yml`은 같은 검증 후 기존과 동일하게 `dist/`만 게시하며 **수동 실행만** 허용하고 `main`에서만 배포할 수 있습니다. PR과 작업 브랜치는 배포하지 않습니다. Pages 설정을 자동 변경하지 않습니다.

**현재 GitHub 설정은 변경하지 않았으며 push·병합·배포도 하지 않았습니다.** 실제 전환 시 저장소 관리자와 아래 순서로 진행합니다.

1. Settings → Pages의 현재 Source, 브랜치·폴더, 커스텀 도메인, 최근 성공 배포와 커밋을 기록합니다. 상세 설정은 인증된 관리자 화면에서 확인해야 합니다.
2. 기존 사이트 기준 커밋 `2c26e05`를 보존 태그 등으로 기록합니다. `.git` 재생성이나 이력 재작성은 하지 않습니다.
3. 작업 브랜치 PR에서 CI와 화면을 검토합니다. **기존 Source가 main/root라면 main 병합만으로도 원본 JSX 진입 HTML이 게시되어 기존 사이트가 깨질 수 있습니다. 병합 전에 아래 Source 전환 일정을 함께 확정해야 합니다.**
4. 전환 시 Settings → Pages → Build and deployment의 Source를 **GitHub Actions**로 바꾸고 main 병합을 조율합니다. 기존 커스텀 배포가 있다면 중복 실행되지 않도록 정리합니다. 기존 Source 변경 직후부터 첫 새 배포 성공까지는 전환 구간으로 취급합니다.
5. `github-pages` environment의 배포 허용 브랜치를 main으로 제한합니다. workflow가 기본 브랜치에 반영된 뒤 Actions → Deploy Pages (manual) → Run workflow에서 main을 선택합니다.
6. workflow는 Node 24에서 `npm ci`, 테스트, 콘텐츠 검증·빌드를 실행하고 `dist/` artifact만 업로드합니다. deploy job에만 `pages: write`, `id-token: write`를 부여합니다.
7. 운영 URL에서 `/news/`, `/people/members/` 등 전체 경로의 직접 접속·새로고침·뒤로가기, 마지막 `/` 없는 주소의 이동, 과거 해시 주소 전환, 잘못된 주소의 HTTP 404, 모바일·키보드 내비게이션, 이미지·연락처·외부 링크를 다시 확인합니다. GitHub 환경에서 workflow는 아직 실행·검증되지 않았습니다.

롤백은 Git 이력을 되돌려 쓰지 않고 변경을 revert하는 방식으로 진행합니다. 이전 정적 HTML(`2c26e05:index.html`)과 Pages Source/브랜치·폴더를 함께 복구하고, 새 수동 배포가 실수로 실행되지 않도록 조치한 뒤 운영 주소를 확인합니다. 코드 복구만 하고 게시 소스를 그대로 두면 원래 배포 방식으로 복구되지 않습니다.

설정 참고: [Vite 정적 배포](https://vite.dev/guide/static-deploy.html), [GitHub Pages 게시 소스](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Genomic Hero 검증 상태 (2026-10-29)

JSON 10개 검증, 전체 **50개 Node 테스트**, production 빌드와 `/` 및 `/lab-preview/` 정적 HTTP 검사가 통과했습니다. 정적 검사는 8개 페이지·별칭·디렉터리 리디렉션·404, 내부 링크·이미지·JS·CSS와 지연 로딩 장면 청크를 확인합니다. 별도의 headless Chrome 검사는 1440×900, 768×1024, 390×844에서 Hero 레이아웃과 WebGL을 확인합니다. 사용자 요청으로 제거한 tagline·하단 태그·모션 버튼은 브라우저 비교용 기준 화면에서도 숨기며 원본 HTML 파일은 수정하지 않습니다. 기존 Header는 유지하므로 데모의 임시 Header와는 다릅니다. 자동 애니메이션, 이동 후 Canvas 1개 유지, resize, reduced-motion 설정 변경에 따른 정지·재개, WebGL 실패·context loss 시 SVG 대체, production HTML hydration을 검사합니다. 320px 화면의 가로 넘침도 확인합니다.

- 실제 모바일 기기에서 터치·화면 회전·WebGL 성능 확인
- 전체 사이트의 Tab/Enter/Space 순서, 메뉴 밖 클릭과 포커스 표시 확인(자동 Hero 검사에서는 메뉴 클릭과 Escape 확인)
- 운영 배포 후 전체 경로의 직접 접속·새로고침·뒤로가기와 브라우저별 확인
- 기존 `/#/...` 주소가 새 주소로 이동하며 쿼리를 보존하는지 확인
- 네트워크 이미지 로딩 실패 시 기본 이미지 대체 영역으로 바뀌는지 확인
- 운영 전환 후 GitHub Actions 성공과 운영 URL의 경로·링크 재확인
