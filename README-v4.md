# overlay-service V4 style upgrade

V4 adds badge support and a redesigned poster card system:

- new multipart field: badge
- stronger typography hierarchy
- lighter glass card backgrounds
- badge / title / text three-level design
- safer formula card layout
- upgraded TikTok/Xiaohongshu/Instagram-style visual language

Deploy:

```bash
cd /mnt/data/mnt/nvme0n1-4/jerry-data/overlay-service
cp server.js server.js.before-v4.$(date +%F-%H%M%S)
cp server.v4.js server.js
cd /mnt/data/mnt/nvme0n1-4/jerry-data
docker compose up -d --build overlay-service
curl http://127.0.0.1:7001/health
```

n8n HTTP Request must add form-data field:

- badge = {{$json.overlay_badge}}
