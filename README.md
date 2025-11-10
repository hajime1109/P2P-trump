# P2P-trump

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

P2P-trump (オフラインP2P大富豪)

1. プロジェクト概要

旅行先（山奥など）や通信量を消費したくない状況で、インターネット（WAN）を一切使用せず、スマートフォン同士のローカル通信のみで完結するWeb版P2P（ピアツーピア）大富豪ゲーム。

1.1. 主な要件

ゲーム: 大富豪

人数: 2〜4人

完全オフライン: ゲームの起動からプレイまで、モバイルデータ通信を一切消費しない。

PWA: アプリはPWAとしてホーム画面に追加でき、オフラインで起動可能。

スマホのみ: PCや専用サーバーを必要とせず、参加者のスマートフォン（主にAndroidを想定）のみで完結する。

ホスティング: GitHub Pages または AWS S3（初回アクセス・PWAインストール用）

1.2. 技術スタック

UI: Vue 3 (+ Vite)

通信・ロジック: 素のJavaScript (WebRTC API)

ライブラリ: qrcode (生成), html5-qrcode (スキャン) ※極力最小限に留める

2.コア技術設計（オフラインP2P通信）

本プロジェクトの技術的な核心は、「ブラウザの制約下で、いかにしてオフラインP2P通信を実現するか」にある。

2.1. 採用アーキテクチャ

通信環境: ローカルWi-Fi (LAN)

ホスト（親機）がスマートフォンの「テザリング」機能を「モバイルデータ通信OFF」の状態で起動する。

これにより、インターネット（WAN）から切断されたローカルネットワーク（LAN）を構築する。

他のプレイヤー（子機）は、このローカルWi-Fiに接続する。

この通信はLAN内部で完結するため、ホストの通信量（ギガ）は消費されない。

通信プロトコル: WebRTC (素のAPI)

サーバーを介さずブラウザ間で直接データをやり取りできるP2P通信プロトコルとしてWebRTCを採用する。

シグナリング (接続確立): 「手動シグナリング」 (QRコード交換)

WebRTC接続の確立には、お互いの接続情報（SDP）を交換する「シグナリング」処理が必要である。

本プロジェクトはオフラインであり、仲介役となるシグナリングサーバーが存在しないため、QRコードを用いてユーザー自身の手で接続情報を交換する。

2.2. 部屋の作成・参加フロー

RTCPeerConnection APIを直接使用し、以下の手順で接続を確立する。

ホスト (Offer生成): ホストが「部屋を作成」すると、createOffer() で「オファー(SDP)」が生成される。このSDP文字列をqrcodeライブラリを使い、オファーQRコードとして画面に表示する。

ゲスト (Answer生成): ゲストが「部屋に参加」を押してhtml5-qrcodeスキャナを起動し、ホストの「オファーQRコード」をスキャンする。読み取ったSDPをsetRemoteDescription()で設定し、createAnswer()で「アンサー(SDP)」を生成する。

ゲスト (Answer提示): ゲストは生成された「アンサーSDP」を、アンサーQRコードとして自身の画面に表示する。

ホスト (接続確立): ホストがゲストの「アンサーQRコード」をスキャンする。読み取ったSDPをsetRemoteDescription()で設定する。（プレイヤーが3人以上の場合、全員のアンサーQRをスキャンする）

接続完了: 全員のP2P接続が確立（connected）され、ゲームデータ（RTCDataChannel経由）の送受信が可能になる。

切断: ホストが切断（ブラウザを閉じる、テザリングOFF）した場合、ゲームは強制終了する。（ホストマイグレーションは実装しない）

3.ゲームルール（大富豪）

革命: あり（4枚以上の同時出し）。革命返しあり。

階段: なし

縛り: なし

8切り: あり（8を出したら場が流れる）

ジョーカー: 1枚。

効果: 他のどのカードよりも強い。ワイルドカードとして他のカードの代わりにもなれる。

禁止事項: ジョーカー単体での上がり、8切り効果としての上がりは禁止。

スペ3返し: なし

都落ち: なし

下剋上: なし

ラウンド数: 1〜3回で選択可能。

階級: 1位が「大富豪」、最下位が「大貧民」。（「富豪」「貧民」はなし）

カード交換: 次のラウンド開始時、大貧民は手札の最も強いカードを2枚、大富豪に渡す。大富豪は不要なカードを2枚、大貧民に渡す。

パス:そのターンで1回パスするとそれ以降行動できない。1ラウンドで3回までパス可能。

4.技術選定の経緯（採用しなかった技術）

4.1. なぜ WebSocket ではないか？

理由: ブラウザはサーバーになれないため。

WebSocketはクライアント・サーバー型の通信であり、必ず中央サーバーが接続を「待ち受ける（Listen）」必要がある。

ブラウザ（PWA）はセキュリティ上の制約により、サーバーとして動作し、特定のポートを開放して他のデバイスからの接続を待ち受けることができない。

したがって、ホスト（親機）のブラウザをWebSocketサーバーにすることは不可能である。

4.2. なぜ Peer.js (ライブラリ) ではないか？

理由: オフラインではPeer.jsの自動化機能が使えないため。

Peer.jsは、WebRTCの複雑なシグナリング（SDP交換）を自動化するライブラリだが、デフォルトではインターネット上のシグナリングサーバー（PeerServer）に接続する必要がある。

オフライン（LAN）でPeer.jsを使うには、LAN内に自前でPeerServerを立てる必要があるが、前述の通り「ブラウザはサーバーになれない」ため、スマホ単体ではPeerServerを起動できない。

結果として、Peer.jsの恩恵を受けられないため、素のWebRTC APIを直接使う「手動シグナリング」を採用した。

4.3. なぜ Web BLE / WebNFC ではないか？

理由: ブラウザが「子機（タグ）」として振る舞えないため。

Web BLE APIやWebNFC APIは、ブラウザが「親機（セントラル / リーダー）」として、周辺のBLEデバイスやNFCタグを読み取ることしか想定されていない。

スマホ同士のP2P通信に必要な「子機（ペリフェラル）」や「タグ（HCE）」として振る舞う。
