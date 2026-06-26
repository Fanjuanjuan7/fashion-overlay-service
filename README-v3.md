# overlay-service V3 样式升级

把 `server.v3.js` 上传到服务器的 `overlay-service` 目录，并重命名覆盖为 `server.js`。

然后执行：

```bash
cd /mnt/data/mnt/nvme0n1-4/jerry-data
docker compose up -d --build overlay-service
curl http://127.0.0.1:7001/health
```

`/health` 返回 version `3.0.0` 即成功。
