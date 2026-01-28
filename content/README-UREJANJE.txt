MODERNSTAY — CURRAN-INSPIRED TEMPLATE (3 APARTMENTS)
====================================================

To ni identična kopija nobene obstoječe strani. Je originalen template s podobno moderno UX logiko:
- sticky top nav
- hero video (ali poster) + booking CTA
- 3 apartmaji (grid + detail)
- 3D tour embed
- availability page (Beds24 embed ali gumb)
- content v JSON/MD, media v ločenih mapah

EDITING
--------
1) Teksti/linki:
   - content/settings/global.json (bookingUrl + tourEmbedUrl)
   - content/pages/home.json
   - content/apartments/apartma1.json (in 2/3)
   - content/pages/residence.json
   - content/pages/contact.json
   - content/pages/policies.md

2) Slike/video:
   - assets/media/images/ (zamenjaj SVG placeholderje s svojimi JPG/PNG/WebP)
   - assets/media/video/hero.mp4 (dodaj svoj MP4)

IN-PAGE EDITOR (brez kode)
--------------------------
- Odpri stran z ?edit=1 (npr. index.html?edit=1)
- Click "Edit mode: ON"
- Click tekst in ga uredi
- "Download changes" prenese JSON datoteke (zamenjaj jih v /content in push na GitHub)