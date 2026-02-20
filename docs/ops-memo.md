# 本番環境 運用メモ

squfibo-game-online サーバーを Linux 本番環境でデーモンとして動かすための手順メモ。

---

## 前提環境

| ソフトウェア | バージョン |
|---|---|
| OS | Ubuntu 22.04 LTS (または同等の systemd 系 Linux) |
| Node.js | 18.x 以上 |
| npm | 9.x 以上 |
| Redis | 7.x 以上 |
| Nginx | 1.24 以上 |

---

## 1. Node.js のインストール

```bash
# NodeSource リポジトリ経由で Node.js 22.x をインストール
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v   # v22.x.x と表示されれば OK
```

---

## 2. Redis のインストール・起動

```bash
sudo apt-get install -y redis-server

# 起動 & 自動起動設定
sudo systemctl enable redis-server
sudo systemctl start redis-server

# 確認
redis-cli ping   # PONG と返れば OK
```

パスワードを設定する場合は `/etc/redis/redis.conf` の `requirepass` を編集し、
後述の `.env` にも `REDIS_PASSWORD` を設定すること。

---

## 3. アプリのセットアップ

```bash
# デプロイ先ディレクトリに移動 (例: /home/deploy/squfibo-game-online)
cd /home/deploy/squfibo-game-online

# shared パッケージのビルド (server が依存しているため先に実施)
cd shared
npm install
npm run build

# server の依存関係インストール & TypeScript ビルド
cd ../server
npm install
npm run build
# → dist/server.js が生成される
```

---

## 4. 環境変数の設定

```bash
# server/.env を作成 (.env.example をコピーして編集)
cp /home/deploy/squfibo-game-online/server/.env.example \
   /home/deploy/squfibo-game-online/server/.env

vi /home/deploy/squfibo-game-online/server/.env
```

`.env` の内容例:

```dotenv
PORT=3000
NODE_ENV=production
LOG_LEVEL=info
CLIENT_URL=https://squfibo-online.buntozu.com
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=（設定した場合のみ）
```

> **注意**: `.env` には機密情報が含まれるため、パーミッションを制限すること。
> ```bash
> chmod 600 /home/deploy/squfibo-game-online/server/.env
> ```

---

## 5. systemd サービスの登録

以下の内容で `/etc/systemd/system/squfibo-server.service` を作成する。

```ini
[Unit]
Description=SquFibo Game Server
After=network.target redis-server.service
Requires=redis-server.service

[Service]
Type=simple
User=deploy
WorkingDirectory=/home/deploy/squfibo-game-online/server
EnvironmentFile=/home/deploy/squfibo-game-online/server/.env
ExecStart=/usr/bin/node dist/server.js
Restart=on-failure
RestartSec=5s

# ログは journald に集約する
StandardOutput=journal
StandardError=journal
SyslogIdentifier=squfibo-server

[Install]
WantedBy=multi-user.target
```

> `User=deploy` と `WorkingDirectory` は実際のデプロイユーザー・パスに合わせて変更すること。

---

## 6. サービスの起動・自動起動設定

```bash
# systemd に設定を読み込ませる
sudo systemctl daemon-reload

# 自動起動を有効化
sudo systemctl enable squfibo-server

# サービス起動
sudo systemctl start squfibo-server

# 起動状態の確認
sudo systemctl status squfibo-server
```

---

## 7. ログの確認

```bash
# リアルタイムでログを追う
sudo journalctl -u squfibo-server -f

# 直近 100 行を表示
sudo journalctl -u squfibo-server -n 100

# 起動日時でフィルタ
sudo journalctl -u squfibo-server --since "2026-01-01 00:00:00"
```

---

## 8. 停止・再起動

```bash
# 停止
sudo systemctl stop squfibo-server

# 再起動
sudo systemctl restart squfibo-server

# 設定変更後にリロード (graceful restart)
sudo systemctl reload-or-restart squfibo-server
```

---

## 9. アプリのアップデート手順

```bash
cd /home/deploy/squfibo-game-online

# 最新コードを取得
git pull origin main

# shared → server の順でリビルド
cd shared && npm install && npm run build
cd ../server && npm install && npm run build

# サービス再起動
sudo systemctl restart squfibo-server

# 正常起動を確認
sudo systemctl status squfibo-server
curl http://localhost:3000/health   # {"status":"ok"} が返れば OK
```

---

## 10. Nginx の設定

Nginx のテンプレートは `etc/nginx-template/squfibo-online.conf` にある。
詳細はファイル冒頭のコメントを参照。

```bash
# テンプレートをコピー
sudo cp /home/deploy/squfibo-game-online/etc/nginx-template/squfibo-online.conf \
        /etc/nginx/sites-available/squfibo-online.conf

# DOCUMENT_ROOT を実際のパスに編集
sudo vi /etc/nginx/sites-available/squfibo-online.conf

# sites-enabled にシンボリックリンクを作成
sudo ln -s /etc/nginx/sites-available/squfibo-online.conf \
           /etc/nginx/sites-enabled/squfibo-online.conf

# 設定テスト
sudo nginx -t

# Let's Encrypt で SSL 証明書を取得
sudo certbot --nginx -d squfibo-online.buntozu.com

# Nginx リロード
sudo systemctl reload nginx
```

---

## 11. ヘルスチェック

```bash
# サーバーが正常に動作しているか確認
curl https://squfibo-online.buntozu.com/health
# → {"status":"ok"} が返れば正常

# Redis の接続確認
redis-cli ping
# → PONG

# systemd サービスの状態確認
sudo systemctl status squfibo-server redis-server nginx
```
