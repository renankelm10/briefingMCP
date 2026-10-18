<div align="center">

<img src="../images/logo.svg" width="96" alt="Briefing ロゴ">

# Briefing

**チームのセカンドブレイン ― ローカルの Markdown ノートをピアツーピアで共有し、Claude からも読める。**

[![CI](https://github.com/renankelm10/briefingMCP/actions/workflows/ci.yml/badge.svg)](https://github.com/renankelm10/briefingMCP/actions/workflows/ci.yml)
[![ライセンス: MIT](https://img.shields.io/badge/license-MIT-e3a43a.svg)](../../LICENSE)
![プラットフォーム](https://img.shields.io/badge/platforms-Windows%20%7C%20macOS%20%7C%20Linux-555)
![MCP](https://img.shields.io/badge/MCP-Claude%20ready-d97757)

<!-- langs -->
[English](../../README.md) · [Português](README.pt-BR.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Italiano](README.it.md) · [Nederlands](README.nl.md) · [Polski](README.pl.md) · [Русский](README.ru.md) · [Українська](README.uk.md) · [Türkçe](README.tr.md) · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · **日本語** · [한국어](README.ko.md) · [Bahasa Indonesia](README.id.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md)
<!-- /langs -->

<img src="../images/01-editor.png" alt="ライブプレビュー、タブ、バックリンクを備えた Briefing のエディタ" width="900">

</div>

---

## Briefing とは？

Briefing は、**間にクラウドサービスを挟まずに、ひとつの共有ナレッジベースを持ちたい**チームのためのデスクトップ用ノートアプリです。

- 📝 **書く**：ノートは、パソコン上の普通のフォルダ（あなたの「保管庫 vault」）にある普通の Markdown ファイルです。
- 🔄 **共有する**：フォルダをチームと共有すると、すべてのパソコンがまったく同じコピーを持ち、変更は**パソコン同士で直接**、エンドツーエンド暗号化されて数秒で届きます。
- 🧠 **質問する**：すべてのノートは**あなた自身のマシン上で動く** AI モデルでインデックス化され、**Claude**（または任意の MCP クライアント）が内蔵の MCP サーバー経由でノートを検索・閲覧・書き込みできます。

その結果、あなたと同僚は同時に、それぞれ自分の Claude を使って同じ会社のナレッジに取り組み、常に最新版を見ることができます。

> 現在、インターフェースは**ブラジルポルトガル語**です。翻訳への協力を歓迎します ― [コントリビューション](../../CONTRIBUTING.md)をご覧ください。

## しくみ

<div align="center"><img src="../images/architecture.svg" alt="アーキテクチャ：2 台のパソコンが直接同期し、それぞれが Claude から MCP で読まれるローカル AI インデックスを持つ" width="860"></div>

1. **チームを作成**してフォルダを選びます。Briefing が `BRF-7Q2M-…` のような招待コードを生成します。
2. **同僚がコードを貼り付けます。** 2 台のパソコンは公開の [Hyperswarm](https://github.com/holepunchto/hyperswarm) DHT（発見*のみ*に使用）でお互いを見つけ、Noise で暗号化された直接接続を開きます。ファイルを 1 つでもやり取りする前に、双方がコードを知っていることを証明します。
3. **すべての変更は即座に送信されます。** あなたが書いても、同僚が書いても、Claude が書いても同じです。同時編集は行単位でマージされ（Git と同様）、2 人が同じ行を変更した場合はもう一方の版が*コンフリクトコピー*として保存されます。コピーはどのパソコンでも同一で、何も失われません。
4. **各パソコンがノートをローカルでインデックス化します**（多言語埋め込み + キーワード検索）。Claude は MCP 経由でインデックスに問い合わせ、ミリ秒単位で最も関連性の高い箇所を受け取ります。

## 機能

<table>
<tr>
<td width="50%"><img src="../images/02-reading.png" alt="閲覧モード"></td>
<td width="50%"><img src="../images/08-teams.png" alt="チームフォルダ"></td>
</tr>
<tr>
<td><b>書く。</b>ライブプレビューエディタ、補完付きの <code>[[リンク]]</code>、バックリンク、タグ、コールアウト、タスク、表、埋め込み、プロパティ、画像の貼り付け、テンプレート、デイリーノート。</td>
<td><b>チームフォルダ。</b>チームを作ってコードを共有すれば、フォルダはどのパソコンでも同一に保たれます。オンライン表示、マージ、コンフリクトコピー、履歴。</td>
</tr>
<tr>
<td><img src="../images/04-brain-search.png" alt="セマンティック検索"></td>
<td><img src="../images/05-brain-claude.png" alt="Claude の接続"></td>
</tr>
<tr>
<td><b>セカンドブレイン。</b><kbd>Ctrl</kbd>+<kbd>J</kbd> で自然な言葉で質問。ハイブリッド検索（意味 + 完全一致）で、初回のモデルダウンロード後は完全にオフライン。</td>
<td><b>MCP 経由の Claude。</b>ワンクリックで MCP サーバーを Claude Code に登録。Claude は <code>search</code>、<code>read_note</code>、<code>write_note</code> などを使えるようになります。</td>
</tr>
<tr>
<td><img src="../images/03-graph.png" alt="グラフビュー"></td>
<td><img src="../images/06-tasks.png" alt="タスクパネル"></td>
</tr>
<tr>
<td><b>グラフ。</b>ノートのつながりを確認。ローカルグラフ、フィルタ、ドラッグ、ズーム。</td>
<td><b>タスクとアジェンダ。</b>保管庫内のすべての <code>- [ ]</code> を 1 つのパネルに集約し、デイリーノートのカレンダーも表示。</td>
</tr>
</table>

<details>
<summary><b>全機能一覧</b></summary>

- タブ（再起動時に復元）、クイックスイッチャー、コマンドパレット、全文検索と `#タグ` 検索
- ライブプレビュー：編集中の行以外では Markdown 記法が隠れ、表・コールアウト・画像・チェックボックスがその場で描画されます
- リンクにカーソルを合わせるとプレビュー、リンクされていない言及をワンクリックでリンク化
- ノートの名前変更や移動で、そのノートへのリンクがすべて書き換わります
- 変数付きテンプレート（`{{title}}`、`{{date:DD/MM/YYYY}}`、`{{time}}`）と、すぐに使える**プロジェクトブリーフ**テンプレート
- ノートごとのバージョン履歴と復元。削除したものはシステムのごみ箱へ
- ノートを PDF に書き出し
- ライト / ダーク / システムのテーマ、アクセントカラー、文字サイズ、行幅、サイズ変更可能なパネル、集中モード
- 既存の Markdown フォルダ（Obsidian の保管庫を含む）で動作

</details>

## インストール

お使いのシステム向けの最新版を **[Releases](https://github.com/renankelm10/briefingMCP/releases)** からダウンロードしてください。

| システム | ファイル | 備考 |
|---|---|---|
| Windows 10/11 | `Briefing Setup x.y.z.exe` | まだコード署名されていません：SmartScreen の警告で **詳細情報 → 実行** をクリックします。 |
| macOS 12+（Apple Silicon） | `Briefing-x.y.z-arm64.dmg` | まだ公証されていません：アプリを右クリック → **開く**、または `xattr -dr com.apple.quarantine /Applications/Briefing.app` を実行します。Intel Mac はソースからビルドしてください。 |
| Linux（x64） | `Briefing-x.y.z.AppImage` / `.deb` | AppImage：`chmod +x Briefing-*.AppImage`。Ubuntu 24.04 以降では Chromium のサンドボックスを設定する `.deb`（`sudo apt install ./briefing_*.deb`）がおすすめです。 |

初回起動時、Briefing は `書類/Briefing` にサンプルの保管庫を作成します。任意のフォルダを開くには **Arquivo → Abrir outro vault…** を使います。

### ソースからビルド

[Node.js 22+](https://nodejs.org) が必要です。

```bash
git clone https://github.com/renankelm10/briefingMCP.git
cd briefingMCP
npm install
npm start            # アプリを起動
npm run dist         # 現在の OS 用インストーラーを作成（release/ に出力）
```

## 3 ステップでチームフォルダ

1. 共有したいフォルダを保管庫として開き、<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>E</kbd>（**Equipes**）を押します。
2. **Criar equipe** → 招待コードがコピーされます。非公開の手段で同僚に送ってください。
3. 同僚は **Equipes → Entrar numa equipe** を開き、コードを貼り付けて空のフォルダを選びます。両方のパソコンがオンラインになり次第、ファイルが届きます。

同期するには両方のパソコンで Briefing を起動しておく必要があります。コードを持つ人は正式なメンバーになるため、パスワードと同様に扱ってください。

## Claude を接続（MCP）

**✦ Segundo cérebro → Conectar automaticamente** を開くか、次を実行します：

```bash
claude mcp add briefing --scope user -- node "/path/to/briefingMCP/src/mcp/server.mjs"
```

Claude Code を再起動します。サーバーは開いている保管庫とすべてのチームフォルダを提供します：

| ツール | 機能 |
|---|---|
| `search` | 意味 + キーワードのハイブリッド検索。最も関連する箇所をファイル名と行番号付きで返します |
| `read_note` | ノートの全文（パス指定または名前だけでも可） |
| `list_notes` | 保管庫やフォルダ内のノートと更新日時 |
| `recent_changes` | 最近更新されたノート ― 同僚から届いた変更も含む |
| `write_note` | ノートの作成・上書き・追記（チームに即時同期） |
| `vault_info` | 保管庫、インデックス済みノート/箇所の数、セマンティック検索の状態 |

stdio サーバーに対応した MCP クライアントなら同じように使えます。保管庫を明示的に選ぶには `BRIEFING_VAULTS="/a;/b"` を使います。

## セキュリティとプライバシー

- アカウント不要、サーバーなし、テレメトリなし。ノートはディスク上の普通のファイルです。
- 同期接続はエンドツーエンドで暗号化され、招待コードで認証されます。ネットワークから届いたファイルが共有フォルダの外に書き込まれることはなく、他人から届いた実行ファイルを Briefing が開くこともありません。
- 埋め込みはローカルで計算されます。モデル（`multilingual-e5-small`、約 120 MB）は Hugging Face から一度だけダウンロードされます。
- MCP の応答は、プロンプトインジェクションのリスクを下げるため、ノートの内容を信頼できないデータとして明示します。

脅威モデルの全文は **[SECURITY.md](../../SECURITY.md)** をご覧ください。脆弱性は非公開で報告してください。

## キーボードショートカット

| ショートカット | 操作 | ショートカット | 操作 |
|---|---|---|---|
| <kbd>Ctrl</kbd>+<kbd>O</kbd> | クイックスイッチャー | <kbd>Ctrl</kbd>+<kbd>J</kbd> | セカンドブレインに質問 |
| <kbd>Ctrl</kbd>+<kbd>P</kbd> | コマンドパレット | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>E</kbd> | チームフォルダ |
| <kbd>Ctrl</kbd>+<kbd>N</kbd> | 新規ノート | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>B</kbd> | 新規プロジェクトブリーフ |
| <kbd>Ctrl</kbd>+<kbd>E</kbd> | 閲覧 / 編集 | <kbd>Ctrl</kbd>+<kbd>G</kbd> | グラフ |
| <kbd>Ctrl</kbd>+<kbd>T</kbd> / <kbd>W</kbd> | 新規 / タブを閉じる | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>D</kbd> | デイリーノート |

macOS では <kbd>Ctrl</kbd> の代わりに <kbd>⌘</kbd> を使います。

## よくある質問

**これは Obsidian ですか？** いいえ。Briefing はゼロから書かれた独立したオープンソースプロジェクトです。普通の Markdown フォルダと互換性があるため既存の保管庫を開けますが、Obsidian とは提携しておらず、承認も受けていません。

**インターネットは必要？** 同僚を見つけるとき（DHT）と、AI モデルを一度ダウンロードするときだけです。ノート、検索、Claude からのアクセスはオフラインで動作します。

**2 人が同じノートを編集したら？** 異なる部分は自動でマージされます。同じ行が変更された場合は両方の版が残ります。1 つはノートに、もう 1 つは隣の `(conflito de …)` コピーに保存されます。

**データはどこに？** 保管庫フォルダ（`.md` ファイル）にあります。Briefing 自体のデータは `<vault>/.briefing/`（インデックス、履歴）とユーザー設定フォルダ（`%APPDATA%\Briefing`、`~/Library/Application Support/Briefing`、`~/.config/Briefing`）にあります。

## ロードマップ

- インターフェースの翻訳（i18n）
- モバイル版コンパニオンアプリ
- 直接接続がブロックされるネットワーク向けのオプションのリレー
- メンバーごとの権限とチーム鍵のローテーション
- 署名・公証済みのインストーラー

## コントリビューション

Issue やプルリクエストを歓迎します。セットアップ、テスト、プロジェクト構成は **[CONTRIBUTING.md](../../CONTRIBUTING.md)** を参照してください。

## ライセンス

[MIT](../../LICENSE) © 2026 Renan Kelm
