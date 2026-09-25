
# 初期設定

docker compose up -d

1. MySQLでデータベースを作成し、`db_init.sql` を実行する。
2. Backend ディレクトリへ移動する。
3. 以下のコマンドを実行する。

```bash
pip install -r requirements.txt
python manage.py migrate --settings=config.settings.development
python manage.py shell --settings=config.settings.development < create_admin.py
python manage.py runserver --settings=config.settings.development
```

4. Frontend ディレクトリへ移動する。
5. 以下のコマンドを実行する。

```bash
yarn dev
```

## 初期管理者アカウント

- ユーザー名: `t-yamada`
- パスワード: `LabPassword`

Dev Containers 拡張機能を使ってセットアップしてください
