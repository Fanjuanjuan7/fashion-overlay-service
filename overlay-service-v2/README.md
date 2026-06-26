# Fashion Overlay Service

Node.js + Playwright + Sharp image title/caption overlay service for TikTok women fashion carousel images.

## API

- GET /health
- POST /overlay multipart-form-data
  - image: binary image
  - title: optional title
  - text: caption/body
  - style_pack: visual style
  - template: layout template
  - page: page number, not rendered

## Supported languages

Chinese, English, Thai, Malay, emoji.

## Supported style_pack

- thai_fashion_luxury
- malay_modest_luxury
- sweet_daily_girl
- magazine_editorial
- clean_tips_card

Chinese aliases are also supported.

## Supported template

- cover_hero
- bottom_caption
- side_caption
- detail_card
- tips_sticker
- formula_layout
