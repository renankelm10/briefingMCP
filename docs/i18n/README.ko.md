<div align="center">

<img src="../images/logo.svg" width="96" alt="Briefing 로고">

# Briefing

**팀의 두 번째 뇌 — 로컬 Markdown 노트를 P2P로 공유하고, Claude가 읽을 수 있습니다.**

[![CI](https://github.com/renankelm10/briefingMCP/actions/workflows/ci.yml/badge.svg)](https://github.com/renankelm10/briefingMCP/actions/workflows/ci.yml)
[![라이선스: MIT](https://img.shields.io/badge/license-MIT-e3a43a.svg)](../../LICENSE)
![플랫폼](https://img.shields.io/badge/platforms-Windows%20%7C%20macOS%20%7C%20Linux-555)
![MCP](https://img.shields.io/badge/MCP-Claude%20ready-d97757)

<a href="https://github.com/renankelm10/briefingMCP/releases/latest"><img src="https://img.shields.io/badge/%EB%8B%A4%EC%9A%B4%EB%A1%9C%EB%93%9C-Windows%20%7C%20macOS%20%7C%20Linux-e3a43a?style=for-the-badge&logo=github&logoColor=white" alt="다운로드" height="40"></a>
<a href="https://github.com/renankelm10/briefingMCP/releases"><img src="https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Frenankelm10%2FbriefingMCP%2Fmain%2Fdocs%2Fdownloads.json&style=for-the-badge" alt="Downloads" height="40"></a>


<!-- langs -->
[English](../../README.md) · [Português](README.pt-BR.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Italiano](README.it.md) · [Nederlands](README.nl.md) · [Polski](README.pl.md) · [Русский](README.ru.md) · [Українська](README.uk.md) · [Türkçe](README.tr.md) · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [日本語](README.ja.md) · **한국어** · [Bahasa Indonesia](README.id.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md)
<!-- /langs -->

<img src="../images/01-editor.png" alt="라이브 미리보기, 탭, 백링크가 있는 Briefing 편집기" width="900">

</div>

---

## Briefing이란?

Briefing은 **중간에 클라우드 서비스 없이 하나의 공유 지식 베이스**를 원하는 팀을 위한 데스크톱 노트 앱입니다.

- 📝 컴퓨터의 평범한 폴더(여러분의 "보관함 vault")에 있는 일반 Markdown 파일로 **작성**합니다.
- 🔄 폴더를 팀과 **공유**합니다. 모든 컴퓨터가 똑같은 사본을 가지며, 변경 사항은 종단 간 암호화되어 몇 초 안에 **컴퓨터와 컴퓨터 사이를 직접** 오갑니다.
- 🧠 무엇이든 **질문**하세요. 모든 노트는 **여러분의 컴퓨터에서 실행되는** AI 모델로 색인되며, **Claude**(또는 모든 MCP 클라이언트)가 내장 MCP 서버를 통해 노트를 검색하고 읽고 쓸 수 있습니다.

그 결과, 여러분과 동료는 동시에 각자의 Claude로 같은 회사 지식을 다루며 언제나 최신 버전을 볼 수 있습니다.

> 현재 인터페이스는 **브라질 포르투갈어**로 되어 있습니다. 번역 기여를 환영합니다 — [기여하기](../../CONTRIBUTING.md)를 참고하세요.

## 작동 방식

<div align="center"><img src="../images/architecture.svg" alt="아키텍처: 두 컴퓨터가 직접 동기화하며, 각각 Claude가 MCP로 읽는 로컬 AI 색인을 가짐" width="860"></div>

1. **팀을 만들고** 폴더를 선택합니다. Briefing이 `BRF-7Q2M-…` 같은 초대 코드를 생성합니다.
2. **동료가 코드를 붙여 넣습니다.** 두 컴퓨터는 공개 [Hyperswarm](https://github.com/holepunchto/hyperswarm) DHT(발견 용도로*만* 사용)를 통해 서로를 찾고, Noise로 암호화된 직접 연결을 엽니다. 파일을 하나라도 주고받기 전에 양쪽 모두 코드를 알고 있음을 증명합니다.
3. **모든 변경은 즉시 전송됩니다.** 여러분이 썼든, 동료가 썼든, Claude가 썼든 마찬가지입니다. 동시에 일어난 편집은 줄 단위로 병합되며(Git처럼), 두 사람이 같은 줄을 바꾸면 다른 버전은 모든 컴퓨터에서 동일한 *충돌 사본*으로 저장됩니다 — 아무것도 잃지 않습니다.
4. **각 컴퓨터가 노트를 로컬에서 색인합니다**(다국어 임베딩 + 키워드 검색). Claude는 MCP로 색인에 질의해 밀리초 만에 가장 관련 있는 구절을 받습니다.

## 기능

<table>
<tr>
<td width="50%"><img src="../images/02-reading.png" alt="읽기 모드"></td>
<td width="50%"><img src="../images/08-teams.png" alt="팀 폴더"></td>
</tr>
<tr>
<td><b>작성.</b> 라이브 미리보기 편집기, 자동 완성되는 <code>[[링크]]</code>, 백링크, 태그, 콜아웃, 할 일, 표, 임베드, 속성, 이미지 붙여넣기, 템플릿, 데일리 노트.</td>
<td><b>팀 폴더.</b> 팀을 만들고 코드를 공유하면 폴더가 모든 컴퓨터에서 동일하게 유지됩니다. 실시간 접속 표시, 병합, 충돌 사본, 기록.</td>
</tr>
<tr>
<td><img src="../images/04-brain-search.png" alt="의미 검색"></td>
<td><img src="../images/05-brain-claude.png" alt="Claude 연결"></td>
</tr>
<tr>
<td><b>두 번째 뇌.</b> <kbd>Ctrl</kbd>+<kbd>J</kbd>로 자연어 질문. 하이브리드 검색(의미 + 정확한 단어)이며, 첫 모델 다운로드 후에는 완전히 오프라인으로 동작합니다.</td>
<td><b>MCP를 통한 Claude.</b> 한 번의 클릭으로 MCP 서버가 Claude Code에 등록됩니다. Claude는 <code>search</code>, <code>read_note</code>, <code>write_note</code> 등을 사용할 수 있습니다.</td>
</tr>
<tr>
<td><img src="../images/03-graph.png" alt="그래프 보기"></td>
<td><img src="../images/06-tasks.png" alt="할 일 패널"></td>
</tr>
<tr>
<td><b>그래프.</b> 노트가 어떻게 연결되는지 확인하세요. 로컬 그래프, 필터, 드래그, 확대/축소.</td>
<td><b>할 일과 일정.</b> 보관함의 모든 <code>- [ ]</code>를 한 패널에 모으고, 데일리 노트 달력도 제공합니다.</td>
</tr>
</table>

<details>
<summary><b>전체 기능 목록</b></summary>

- 탭(재시작 시 복원), 빠른 전환, 명령 팔레트, 전문 검색과 `#태그` 검색
- 라이브 미리보기: 편집 중인 줄 밖에서는 Markdown 문법이 숨겨지고, 표·콜아웃·이미지·체크박스가 바로 렌더링됩니다
- 링크에 마우스를 올리면 미리보기, 연결되지 않은 언급을 한 번의 클릭으로 링크화
- 노트 이름을 바꾸거나 옮기면 그 노트를 가리키는 모든 링크가 갱신됩니다
- 변수가 있는 템플릿(`{{title}}`, `{{date:DD/MM/YYYY}}`, `{{time}}`)과 바로 쓸 수 있는 **프로젝트 브리프** 템플릿
- 노트별 버전 기록과 복원, 삭제한 항목은 시스템 휴지통으로
- 노트를 PDF로 내보내기
- 라이트 / 다크 / 시스템 테마, 강조 색상, 글자 크기, 줄 너비, 크기 조절 가능한 패널, 집중 모드
- 기존 Markdown 폴더(Obsidian 보관함 포함)와 함께 동작

</details>

## 설치

**[Releases](https://github.com/renankelm10/briefingMCP/releases)**에서 사용하는 시스템에 맞는 최신 버전을 내려받으세요.

| 시스템 | 파일 | 참고 |
|---|---|---|
| Windows 10/11 | `Briefing-Setup-x.y.z.exe` | 아직 코드 서명되지 않았습니다: SmartScreen 경고에서 **추가 정보 → 실행**을 클릭하세요. |
| macOS 12+ (Apple Silicon) | `Briefing-x.y.z-arm64.dmg` | 아직 공증되지 않았습니다: 앱을 우클릭 → **열기**, 또는 `xattr -dr com.apple.quarantine /Applications/Briefing.app`를 실행하세요. Intel Mac은 소스에서 빌드하세요. |
| Linux (x64) | `Briefing-x.y.z.AppImage` / `.deb` | AppImage: `chmod +x Briefing-*.AppImage`. Ubuntu 24.04 이상에서는 Chromium 샌드박스를 설정해 주는 `.deb`(`sudo apt install ./briefing_*.deb`)를 권장합니다. |

처음 실행하면 Briefing이 `문서/Briefing`에 예제 보관함을 만듭니다. 다른 폴더를 열려면 **Arquivo → Abrir outro vault…**를 사용하세요.

### 소스에서 빌드

[Node.js 22+](https://nodejs.org)가 필요합니다.

```bash
git clone https://github.com/renankelm10/briefingMCP.git
cd briefingMCP
npm install
npm start            # 앱 실행
npm run dist         # 현재 시스템용 설치 파일 생성(release/에 출력)
```

## 3단계로 팀 폴더 만들기

1. 공유할 폴더를 보관함으로 열고 <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>E</kbd>(**Equipes**)를 누릅니다.
2. **Criar equipe** → 초대 코드가 복사됩니다. 비공개 채널로 동료에게 보내세요.
3. 동료가 **Equipes → Entrar numa equipe**를 열고 코드를 붙여 넣은 뒤 빈 폴더를 선택합니다. 두 컴퓨터가 온라인이 되는 즉시 파일이 도착합니다.

동기화하려면 두 컴퓨터 모두에서 Briefing이 실행 중이어야 합니다. 코드를 가진 사람은 정식 멤버가 되므로 비밀번호처럼 다루세요.

## Claude 연결(MCP)

**✦ Segundo cérebro → Conectar automaticamente**를 열거나 다음을 실행하세요:

```bash
claude mcp add briefing --scope user -- node "/path/to/briefingMCP/src/mcp/server.mjs"
```

Claude Code를 다시 시작하세요. 서버는 열려 있는 보관함과 모든 팀 폴더를 제공합니다:

| 도구 | 기능 |
|---|---|
| `search` | 의미 + 키워드 하이브리드 검색. 가장 관련 있는 구절을 파일과 줄 번호와 함께 반환 |
| `read_note` | 노트 전체 내용(경로 또는 이름만으로) |
| `list_notes` | 보관함이나 폴더의 노트와 수정 시각 |
| `recent_changes` | 최근 수정된 노트 — 동료에게서 온 변경 포함 |
| `write_note` | 노트 생성, 덮어쓰기, 내용 추가(팀에 즉시 동기화) |
| `vault_info` | 보관함, 색인된 노트/구절 수, 의미 검색 상태 |

stdio 서버를 지원하는 모든 MCP 클라이언트에서 같은 방식으로 동작합니다. 보관함을 직접 지정하려면 `BRIEFING_VAULTS="/a;/b"`를 사용하세요.

## 보안과 개인정보

- 계정도, 서버도, 원격 측정도 없습니다. 노트는 디스크에 있는 일반 파일입니다.
- 동기화 연결은 종단 간 암호화되며 초대 코드로 인증됩니다. 네트워크에서 온 파일은 절대 공유 폴더 밖에 기록되지 않으며, 다른 사람에게서 받은 실행 파일을 Briefing이 여는 일도 없습니다.
- 임베딩은 로컬에서 계산되며, 모델(`multilingual-e5-small`, 약 120 MB)은 Hugging Face에서 한 번만 내려받습니다.
- 프롬프트 인젝션 위험을 줄이기 위해 MCP 응답은 노트 내용을 신뢰할 수 없는 데이터로 표시합니다.

전체 위협 모델은 **[SECURITY.md](../../SECURITY.md)**에서 확인하세요. 취약점은 비공개로 신고해 주세요.

## 키보드 단축키

| 단축키 | 동작 | 단축키 | 동작 |
|---|---|---|---|
| <kbd>Ctrl</kbd>+<kbd>O</kbd> | 빠른 전환 | <kbd>Ctrl</kbd>+<kbd>J</kbd> | 두 번째 뇌에 질문 |
| <kbd>Ctrl</kbd>+<kbd>P</kbd> | 명령 팔레트 | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>E</kbd> | 팀 폴더 |
| <kbd>Ctrl</kbd>+<kbd>N</kbd> | 새 노트 | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>B</kbd> | 새 프로젝트 브리프 |
| <kbd>Ctrl</kbd>+<kbd>E</kbd> | 읽기 / 편집 | <kbd>Ctrl</kbd>+<kbd>G</kbd> | 그래프 |
| <kbd>Ctrl</kbd>+<kbd>T</kbd> / <kbd>W</kbd> | 새 탭 / 탭 닫기 | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>D</kbd> | 데일리 노트 |

macOS에서는 <kbd>Ctrl</kbd> 대신 <kbd>⌘</kbd>를 사용하세요.

## 자주 묻는 질문

**이것은 Obsidian인가요?** 아닙니다. Briefing은 처음부터 새로 작성된 독립 오픈 소스 프로젝트입니다. 일반 Markdown 폴더와 호환되므로 기존 보관함을 열 수 있지만, Obsidian과 제휴하거나 그 승인을 받은 것은 아닙니다.

**인터넷이 필요한가요?** 동료를 찾을 때(DHT)와 AI 모델을 한 번 내려받을 때만 필요합니다. 노트, 검색, Claude 접근은 오프라인에서도 동작합니다.

**두 사람이 같은 노트를 편집하면?** 서로 다른 부분은 자동으로 병합됩니다. 같은 줄이 바뀌면 두 버전이 모두 보존됩니다. 하나는 노트에, 다른 하나는 옆의 `(conflito de …)` 사본에 저장됩니다.

**내 데이터는 어디에 있나요?** 보관함 폴더(`.md` 파일)에 있습니다. Briefing 자체 데이터는 `<vault>/.briefing/`(색인, 기록)과 사용자 설정 폴더(`%APPDATA%\Briefing`, `~/Library/Application Support/Briefing`, `~/.config/Briefing`)에 있습니다.

## 로드맵

- 인터페이스 번역(i18n)
- 모바일 동반 앱
- 직접 연결을 차단하는 네트워크를 위한 선택적 릴레이
- 멤버별 권한과 팀 키 교체
- 서명 및 공증된 설치 파일

## 기여하기

이슈와 풀 리퀘스트를 환영합니다. 설치, 테스트, 프로젝트 구조는 **[CONTRIBUTING.md](../../CONTRIBUTING.md)**를 참고하세요.

## 라이선스

[MIT](../../LICENSE) © 2026 Renan Kelm
