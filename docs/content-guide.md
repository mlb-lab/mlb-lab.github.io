# 콘텐츠 데이터 계약

`src/data`의 각 JSON 파일이 페이지 콘텐츠입니다. 아래 필수 필드 외 선택값은 생략하거나 null로 둡니다. 배열 자체는 null 대신 []를 사용합니다. 예시 객체를 복사해 고유 ID로 바꾸고 확인된 자료를 입력한 뒤 `npm run validate`와 `npm run build`를 실행하세요.

## 공통 값

- **ID:** 소문자·숫자·하이픈, 같은 목록에서 고유해야 합니다.
- **displayOrder:** 선택 0 이상의 정수. 생략하면 0이며, 같으면 ID순입니다. 연구원·연구 분야는 오름차순, 논문은 같은 연도 안에서 내림차순으로 표시합니다.
- **Image:** `null` 또는 `{ "src": "images/people/photo.webp", "alt": "사진 설명" }`. src는 null도 허용합니다. alt는 필수이며 빈 문자열은 허용하지 않습니다. 이미지는 public에 직접 추가하세요.
- **Members·Alumni 사진:** 사진 영역은 최대 너비 300px, 4:5 비율로 카드 가운데 정렬하며, 좁은 화면에서는 가용 너비에 맞춰 줄어듭니다. contain으로 원본 전체를 표시하므로 비율이 다른 사진에는 여백이 생길 수 있습니다. Members의 photo 객체에는 선택적으로 `"objectPosition": "50% 10%"`을 추가할 수 있습니다. 첫 값은 가로, 둘째 값은 세로 기준점입니다. 기본은 `50% 20%`이며 `center top`이나 0~100% 범위의 백분율 두 개를 지원합니다. contain에서는 사진이 잘리는 대신 영역 안에서 정렬 위치가 바뀝니다. 이 선택 필드는 Members 전용이며 Professor·Alumni의 데이터 형식은 유지합니다.
- **Members/Alumni education:** 선택 객체이며 bs, ms, phd는 각각 통합 문자열 또는 null입니다. 예: `{ "bs": "Computer Science and Engineering at PNU", "ms": null, "phd": null }`. 키를 생략해도 됩니다. 입력한 문자열이 그대로 표시되며 빈 문자열·숫자·기존 institution/department/year 객체는 허용하지 않습니다. 미입력 학위는 숨깁니다. 연도 등 추가 정보도 문자열 안에 입력합니다.
- **Professor education:** 기존 객체 형식을 유지합니다. bs, ms, phd를 각각 생략·null 또는 `{ "institution": "확인된 기관명", "department": null, "year": null, "advisor": null }`로 입력합니다. 기관명은 필수, 학과·네 자리 졸업 연도·지도교수(advisor)는 선택입니다. Professor는 Ph.D. → M.S. → B.S. 순서로 표시합니다. 모든 페이지에서 진행 중인 학위를 취득한 것으로 표현하지 마세요.
- **Paragraphs:** 문자열 배열. 각 항목이 한 문단입니다. HTML 태그·Markdown은 해석하지 않고 글자로 표시합니다.
- **외부 URL:** http(s) 절대 주소. 이메일·전화는 각각 별도 필드에 입력합니다. 외부 링크는 새 탭으로 열립니다.
- **Members 이메일:** 실제 주소(`name@example.org`)와 `name at example dot org` 표기를 모두 지원합니다. 입력한 문구를 하이퍼링크 없이 일반 텍스트로 표시합니다. 검증할 때만 at/dot을 @/점으로 해석합니다. 값이 있으면 카드 왼쪽에 Email 라벨을 표시하며, null이면 줄 전체를 숨깁니다.

## 파일별 필드

| 파일 | 필수 필드 | 선택 필드 |
| --- | --- | --- |
| site.json (객체) | name, subtitle | footer |
| home.json (객체) | title, hero, introduction (1문단 이상), aboutLabel, aboutHeadline, researchLinkLabel, researchKeywords, quickLinks | — |
| professor.json (객체 또는 null) | id, name | position, affiliation, photo, education, biography (문단 배열), researchInterests (문자열 배열), experience, email, emailDisplay, contact, links |
| members.json (배열) | 각 항목 id, name | position, photo, education, email, displayOrder |
| alumni.json (배열) | 각 항목 id, name | position, photo, education, displayOrder |
| research.json (배열) | 각 항목 id, title, description (1문단 이상) | image, displayOrder |
| publications.json (배열) | 각 항목 id, title/ authors/ venue (서식 조각 배열), year | displayOrder, url |
| publications-note.json (배열) | text를 가진 서식 조각 (안내를 숨기려면 []) | bold, underline, italic |
| news.json (배열) | 각 항목 id, date, title, body (문단 배열, 본문이 없으면 []), images | ? |
| contact.json (객체) | addressLines (문자열 배열) | email, emailDisplay, phone, mapUrl, mapQuery |

Contact의 email에는 실제 이메일 주소를 입력하며, emailDisplay에는 `gsong at pusan dot ac dot kr`처럼 화면에 표시할 문구를 선택적으로 지정합니다. emailDisplay를 생략하면 email을 표시합니다. addressLines의 각 문자열은 한 줄씩 표시됩니다.

Contact 지도는 선택값 mapQuery가 있으면 그 값을 검색어로 사용하고, 생략하거나 null이면 addressLines를 합친 주소를 사용합니다. 현재 mapQuery는 `부산대학교 IT관`이며, 화면의 영문 주소와 별도로 관리합니다. mapUrl은 지도 아래 외부 링크를 직접 지정하는 선택값이며, null이면 지도와 같은 검색어로 링크를 생성합니다. 검색어와 주소가 모두 비어 있으면 iframe을 생성하지 않습니다. 별도 API 키나 패키지는 사용하지 않으며, 외부 인터넷 연결이 필요합니다. 주소 검색 결과는 Google에 따라 달라지므로 실제 건물 위치를 확인하세요. 현재 키 없는 `maps.google.com/maps?q=...&output=embed` 형식은 공식 Maps Embed API와 별개로, 향후 서비스 변경 시 Google Maps의 공유 → 지도 퍼가기 주소로 전환이 필요할 수 있습니다.

교수 links는 `[{ "label": "링크 표시 이름", "href": "https://..." }]` 형식입니다. biography, researchInterests, links는 사용하지 않으면 생략하거나 []를 사용합니다.

Professor의 추가 필드:

- `experience`: 입력 순서로 표시하는 경력 배열입니다. 항목마다 position과 organization은 필수이며 department, startDate, endDate, mentor는 선택입니다. 날짜는 일자를 임의로 만들지 않고 ISO 연월 `YYYY-MM`로 저장합니다. 종료 연월은 시작 연월보다 빠를 수 없습니다. 기간이 확인되지 않으면 생략합니다.
- `email`: `name@example.org` 형식의 실제 주소입니다. `emailDisplay`는 화면 표시용 문자열이며 없으면 실제 주소가 표시됩니다. Professor 하단 Contact의 이메일은 하이퍼링크 없이 일반 텍스트로 표시합니다.
- `contact`: `{ "addressLines": ["주소 첫 줄", "주소 다음 줄"], "phone": "+82-51-000-0000" }` 형식입니다. 두 필드는 선택이며 공개 가능한 교수 연락처만 입력합니다. 별도 Contact 페이지 데이터에는 영향을 주지 않습니다.
- Professor의 사진도 문자열이 아니라 `{ "src": "images/professor/파일명.jpg", "alt": "사진 설명" }` 객체로 입력하며 src에 public/을 포함하지 않습니다.

현재 Professor 경력·학력·연락처는 사용자가 제공한 이미지에서 옮겼습니다. 이미지에 없는 석사·학사 졸업 연도와 Instructor 재직 기간은 추가하지 않았습니다. 이메일은 이미지 상단의 dot 표기를 기준으로 통일했습니다.

News images는 Image 객체의 배열입니다. 배열 안에 null을 넣지 말고 사진이 없는 게시물은 []로 둡니다. 사진 자리만 미리 표시하려면 `[{ "src": null, "alt": "사진 등록 예정" }]`을 사용합니다. date는 `YYYY-MM-DD`만 허용하며 시간·시간대는 사용하지 않습니다.

## Publications 서식

논문의 title, venue는 **텍스트 조각 배열**이고 authors는 **저자 한 명당 한 항목인 목록**입니다. 각 항목에 필수 문자열 text와 선택 boolean인 bold, underline, italic을 지정합니다. 여러 서식을 동시에 지정할 수도 있습니다. title/venue의 구두점은 직접 입력합니다. authors의 저자 사이 쉼표와 마지막 마침표는 화면 코드가 자동으로 표시하므로 입력하지 않습니다. 이름 안의 이니셜 마침표와 교신저자 별표(*)는 그대로 입력합니다. 마지막 이름이 이미 마침표로 끝나면 중복해서 붙이지 않습니다.

아래는 입력 형식 예시입니다.

```json
{
  "id": "example-formatted-publication",
  "title": [
    { "text": "Example study of " },
    { "text": "de novo", "italic": true },
    { "text": " methods" }
  ],
  "authors": [
    { "text": "Student A†", "underline": true },
    { "text": "Student B†", "underline": true },
    { "text": "Professor Name*", "bold": true }
  ],
  "venue": [
    { "text": "Example Journal", "italic": true },
    { "text": ", 1(2): 3–10. 2026." }
  ],
  "year": 2026,
  "displayOrder": 1,
  "url": null
}
```

- authors는 원문의 저자 순서, 표기, 교신저자 별표(*)를 유지합니다. 밑줄·굵게는 사람 이름을 보고 자동 추정하지 않습니다.
- 공동 1저자는 해당 저자 이름 뒤에 `†`를 직접 입력합니다. 예: `{ "text": "Author Name†", "underline": true }`. 공동 1저자 모두에게 표시하며, 교신저자를 겸하면 `Author Name*†`처럼 입력할 수 있습니다. `†`를 별도의 저자 항목으로 추가하지 않습니다. 밑줄·굵게와 자동 쉼표·마침표는 그대로 적용됩니다. 실제 논문의 공동 1저자 여부를 확인한 뒤 입력하세요. 상단의 `† co-first authors` 안내는 publications-note.json에서 관리합니다.
- Publications의 저자 이름과 상단 안내에 있는 `†`는 자동으로 위첨자로 표시합니다. 크기·높이는 global.css의 `.publication-authors sup, .publication-note sup`에서 조정합니다. 기본 크기는 주변 글씨의 70%이며 JSON 형식은 변경하지 않습니다.
- 논문은 연도 내림차순이며, 같은 연도에서는 displayOrder가 큰 값부터 표시합니다. 예를 들어 1~5인 경우 화면 순서는 5 → 4 → 3 → 2 → 1입니다. JSON 배열 자체의 원문 순서는 변경하지 않습니다.
- venue에는 학술지명·권호·페이지·연도·발표/초청 설명까지 입력합니다. year는 연도별 분류에만 사용하므로 화면에서 연도를 추가로 붙이지 않습니다. 제목 → 저자 → 학술지 순서는 유지합니다.
- 링크는 url에 http(s) 절대 주소로 입력합니다. 원문 링크가 DOI URL인 경우에도 url에 그대로 넣으며 별도 doi/pdfPath 필드는 사용하지 않습니다. url이 없으면 링크 버튼은 숨깁니다.
- 목록 위의 서식 안내는 publications-note.json에서 같은 배열 형식으로 관리합니다. []로 두면 숨깁니다.
- HTML과 Markdown 문자열을 실행하거나 해석하지 않습니다. HTML처럼 생긴 text도 일반 글자로 표시합니다. 허용되지 않은 서식 키, 문자열 형태의 boolean, 공백만 있는 필드는 검증에서 거부합니다.

### 원문 HTML 변환 및 보존 검사

현재 43개 논문은 사용자가 제공한 HTML에서 변환했습니다. 원문은 `tests/fixtures/publications-source.html`에 보관되어 있습니다. HTML 공백을 정리하고 제목 뒤 문장 구분용 마침표 하나를 제외하며, 저자 구분 쉼표·마지막 마침표는 자동 출력하고 마지막 저자 앞의 and는 쉼표로 통일합니다. 저자 이름·서식·별표·링크·순서·추가 설명은 유지합니다. 출판사 사이트에 접속해 내용을 추가하거나 변경하지 않습니다.

Python 표준 라이브러리만으로 원문을 다시 변환할 수 있습니다. 빌드와 운영 사이트에는 Python이 필요하지 않습니다.

```sh
python scripts/import-publications.py --input tests/fixtures/publications-source.html --output src/data/publications.json --note-output src/data/publications-note.json --expected-count 43
python -m unittest discover -s tests -p test_import_publications.py -v
```

첫 명령은 두 JSON 파일을 덮어쓰므로 수동 편집 후 재실행할 때 주의하세요. 두 번째 명령은 원문 보존 감사용 테스트이며, 화면 정렬용 displayOrder 변경과 원문 안내 뒤에 새 안내를 추가하는 것은 허용합니다. 제공된 43개 항목의 저자·서지 내용을 의도적으로 정정한다면 원문 참조와 함께 검토해야 하며, 별도의 신규 논문 추가는 허용합니다. 평소에는 JSON에 새 항목을 추가하고 `npm run validate`, `npm test`, `npm run build`로 확인하면 됩니다.

## 입력 예시

아래는 실존 인물이나 실제 활동이 아닌 **스키마 예시**입니다. 실제 이름과 이메일을 추측해 넣지 마세요.

```json
{
  "id": "example-member-02",
  "name": "이름 입력",
  "position": null,
  "photo": null,
  "education": { "bs": null, "ms": null, "phd": null },
  "email": null,
  "displayOrder": 2
}
```

```json
{
  "id": "example-news-03",
  "date": "2026-01-03",
  "title": "게시물 제목 입력 — 예시",
  "body": ["첫 번째 문단 입력", "두 번째 문단 입력"],
  "images": []
}
```

뉴스 사진은 `public/images/news/`에 보관하며, 현재 파일명의 마지막 `yyyy.mm.dd`를 ISO 날짜로, 그 앞 문구를 제목으로 옮겼습니다. 날짜를 감싼 괄호는 제목에서 제외합니다. 같은 제목·날짜 뒤의 숫자는 사진 순서이며 한 게시물의 images 배열에 숫자순으로 넣습니다. 현재 사진 28장으로 게시물 24개를 구성했고 Group Photos는 5장을 묶었습니다. 실제 본문은 제공되지 않아 body를 []로 두었으며, 이후 문단 문자열을 추가하면 피드에 전문이 표시됩니다. 제목의 기존 철자나 제목 안의 연도는 수정하지 않았습니다. 폴더에 사진만 추가해도 게시물이 자동 생성되지는 않으며 news.json도 갱신해야 합니다.

이미지 파일명의 쉼표, 괄호, 작은따옴표, 앰퍼샌드(&)도 허용합니다. 파일명을 바꾸지 않고 원래 경로를 JSON에 입력하세요.

### News 본문 서식 및 공지 가져오기

body의 각 항목은 일반 문자열 문단 또는 서식 조각 배열입니다. 기존 문자열과 빈 body는 그대로 지원합니다. 서식 조각에는 text와 선택 boolean인 italic(em/i), underline(u), bold(strong/b), superscript(sup), 선택 http(s) 링크인 href를 넣습니다. 한 조각에 여러 서식을 지정할 수 있습니다. 줄바꿈은 text의 `\n`으로 저장합니다. HTML 문자열은 실행하지 않고 일반 텍스트로 표시하며, sourceUrl은 저장하거나 표시하지 않습니다.

```json
"body": [
  "일반 문단",
  [
    { "text": "저자", "underline": true },
    { "text": "*", "superscript": true },
    { "text": " — " },
    { "text": "논문 제목", "italic": true, "href": "https://example.org/paper" }
  ]
]
```

사용자가 제공한 notices.json의 공지 15개를 기존 사진 게시물 24개에 추가했습니다. 제목·ISO 날짜·문단·본문 링크·서식은 원문 기준이며, 새 게시물의 images는 []입니다. 최신순 정렬은 기존 화면 로직을 따릅니다. 별도 HTML 직접 주입이나 추가 패키지는 사용하지 않습니다.

다시 가져오려면 `python scripts/import-notices.py --input "공지 JSON 경로"`를 실행합니다. 입력은 id/title/date/content를 가진 객체 배열이며 content에서 p, br, em/i, u, strong/b, sup, http(s) a만 변환합니다. 지원하지 않는 태그·잘못된 중첩·위험한 링크는 오류로 중단합니다. 같은 ID의 동일 데이터는 중복 추가하지 않고, 기존 내용과 다르면 덮어쓰지 않고 중단합니다. Python은 변환할 때만 필요합니다. 변환 테스트는 `python -m unittest discover -s tests -p test_import_notices.py -v`로 실행합니다.

## Home About 및 하단 메뉴 수정 위치

`src/data/home.json`에서 aboutLabel은 작은 라벨, aboutHeadline은 큰 세리프 헤드라인, introduction은 오른쪽 문단 배열(현재 2문단), researchKeywords는 태그 목록, researchLinkLabel은 Research 링크 문구입니다. 기존 소개 내용은 바꾸지 않고 문단만 분리했습니다. quickLinks의 각 항목은 `{ "pageId": "professor", "title": "People", "description": "Meet our professor and research team." }` 형식이며, 기존 Professor/Publications/News 이동 경로를 유지합니다. Hero는 별도 hero 객체에서 관리합니다.

`src/styles/global.css`의 home-about-label, home-about-heading h2, home-introduction .prose, home-research-tags, home-links에서 크기·간격을 조절합니다. 본문은 산세리프 변수 --font-sans, 헤드라인은 기존 세리프 변수 --font-body를 사용합니다. 이 타이포그래피 변경은 Home About과 하단 메뉴에만 적용합니다. 하단 메뉴는 PC·태블릿 3열, 600px 이하 1열이며 작은 화면에서는 설명을 자연스럽게 줄바꿈합니다. 키보드 포커스에도 배경 효과를 표시하며, 움직임 줄이기 설정에서는 기존 공통 규칙으로 transition을 끕니다.

## Genomic Hero 수정 위치

최종 기준은 `reference/song_lab_genomic_hero_v3.html`입니다. 기준 파일은 보존하며 iframe이나 외부 CDN으로 삽입하지 않습니다. home.json의 hero.label/welcome/principalInvestigator는 상단 문구, headlineLines는 정확히 2개인 제목 줄 배열입니다. 사용자 요청으로 제목 아래 tagline, 하단 키워드 태그·모션 버튼과 오른쪽 세로 문구는 제거했습니다. HTML 서식을 입력하지 말고 문자열만 입력하세요. 기존 건물 사진 파일은 보존했지만 Hero에서는 사용하지 않습니다.

`src/components/HeroSection.jsx`는 텍스트, `src/components/hero.css`는 데모를 옮긴 위치·크기·배경·반응형 스타일입니다. Header는 기존 공통 Header를 유지하며 장면보다 위에 표시합니다. 1051px 이상 PC에서는 genomic-scene의 top을 `calc(var(--header-height) + 16px)`로 두어 장면이 Header 아래에서 시작합니다. 나머지 화면에서는 기존 전체 Hero 영역을 사용합니다. Canvas 크기·카메라는 변경된 영역에 자동으로 맞춰집니다. 텍스트 위치는 유지하며, 데모 Header가 차지하던 88px(800px 이하 75px)은 텍스트 위치 보존용 빈 공간으로 유지합니다. 장면의 모바일 카메라 기준은 데모와 동일하게 750px 미만입니다.

`src/components/GenomicScene.jsx`는 클라이언트 지연 로딩·정적 SVG fallback을, `src/lib/genomic-scene.js`는 DNA 4개·네트워크·파티클·카메라·애니메이션과 자원 정리를 담당합니다. Three.js는 기준과 같은 0.162.0이며 조명·후처리를 추가하지 않습니다. DPR은 최대 1.7입니다. 기본적으로 자동 회전과 마우스 반응을 실행하고, 움직임 줄이기 설정에서는 모두 정지합니다. 설정을 해제하면 자동으로 재개합니다. 숨겨진 탭이나 화면 밖에서는 프레임 요청을 중지합니다. WebGL 실패나 context loss 시 원본 SVG를 표시합니다.

`npm run check:hero`는 별도 터미널에서 개발 서버를 실행한 상태에서 선택적으로 사용합니다. Node 24와 설치된 Chrome이 필요하며, 기본 경로는 Windows의 `C:/Program Files/Google/Chrome/Application/chrome.exe`입니다. 다른 환경에서는 CHROME_PATH를 설정하세요. `npm run check:hero -- http://127.0.0.1:4173/`처럼 검사 URL을 지정할 수 있습니다. 자동 검사 전용 임시 프로필을 사용하며 화면과 비교 보고서는 OS 임시 폴더에 저장합니다. 일반 테스트·CI에는 브라우저 설치를 요구하지 않습니다.

## Footer 수정 위치

- `src/data/contact.json`: ADDRESS의 addressLines, CONTACT의 email/emailDisplay/phone. 이메일·전화는 링크 없는 텍스트이며 값이 없으면 숨깁니다.
- `src/data/professor.json`: CONTACT의 교수 이름(name). 교수 정보가 없으면 이름 줄을 숨깁니다.
- `src/data/site.json`의 footer: name은 왼쪽 연구실 이름과 저작권 이름, logo.src는 public 기준 로고 경로, affiliationLines는 소속 문구의 줄 배열, locationText는 맨 아래 오른쪽 문구입니다. subtitle은 저작권의 대학 이름으로 재사용하고 연도는 자동 표시합니다. Header는 기존 site.name/subtitle을 계속 사용합니다.
- Footer는 로고·소개, Address, Contact로 구성하며 Links 영역은 사용하지 않습니다.
- `src/components/Footer.jsx`: 컬럼 제목(Address/Contact), Tel/Professor 접두사 및 전체 배치를 수정합니다. 실제 주소·인물 데이터는 여기에 중복 입력하지 않습니다.
- `src/styles/global.css`: footer-grid는 PC 3열, 1000px 이하 2열, 600px 이하 1열입니다. footer-logo는 PC 88px/모바일 72px, footer-name은 이름 크기, footer-column h2는 컬럼 제목, footer-column address 및 site-footer p는 본문, footer-bottom p는 저작권 글씨 크기를 조절합니다. 색상은 기존 CSS 변수를 사용합니다.

## 검증 범위

필수값·타입·알 수 없는 필드·중복 ID·달력 날짜·연도·이메일·전화·외부 URL 형식·로컬 파일 존재·경로 대소문자를 검사합니다. 이미지 경로에는 한글을 포함한 문자·숫자·단어 사이 공백·밑줄·하이픈·점·슬래시를 사용할 수 있습니다. URL 예약문자(%, ?, # 등), 역슬래시, 제어문자, 상위 경로(..), 빈 경로 조각, 각 파일·폴더 이름의 앞뒤 공백 및 끝의 점은 허용하지 않습니다. JSON에는 `images/home/IT관 사진.png`처럼 원래 파일명을 입력하고 미리 URL 인코딩하지 마세요. 파일 확장자를 바꾸는 것만으로 이미지 최적화가 되지는 않습니다. 크기를 조정하고 적절한 포맷으로 내보내 주세요.

외부 URL의 실제 응답, 사진 내용, 연구 정보의 진위, PDF 공개 권한은 별도로 검토해야 합니다. JSON을 수정하면 개발 서버는 갱신되지만 운영 사이트에는 재빌드·수동 배포 후 반영됩니다.
