# Beds24 Private Label — Quick Setup (for this website)

Ta dokument je samo za **tebe** (owner/admin). Gostje ga ne vidijo.

## Kaj je Private Label?
Ko v Beds24 vklopiš *Private Label*, booking stran ne teče več na `beds24.com`, ampak na tvojem subdomainu (npr. `book.tvojadomena.com`).
To je najboljši način, da booking izgleda 100% “kot del tvoje strani”.

## 1) Nastavi subdomain (DNS)
1. V DNS tvoje domene naredi subdomain, npr. **book**.
2. V Beds24 Private Label nastavitvah ti bo pisalo, kateri DNS zapis rabiš.
   - običajno je to **CNAME** `book` → (Beds24 cilj)
3. Shrani DNS.

> Opomba: dokler Beds24 ne vidi pravilnega DNS, Private Label ne bo delal.

## 2) V Beds24 vklopi Private Label
V Beds24 adminu pojdi na nastavitve za *Branding / Private Label* (lokacija se lahko malo razlikuje).
- Vpiši svoj subdomain (npr. `book.tvojadomena.com`).
- Shrani.
- Počakaj, da status kaže **active/verified**.

## 3) V tej spletni strani vklopi Private Label (1 sprememba)
Odpri:
`assets/data/content.json`

V bloku `"booking"`:
- `beds24_private_label_url` nastavi na tvoj subdomain + isti path:
  - primer: `https://book.TVOJADOMENA.com/book-calypsophuket`
- `beds24_css_url` nastavi na tvoj live CSS file:
  - primer: `https://TVOJADOMENA.com/beds24.css`
- `use_private_label` nastavi na `true`

Primer:
```json
"booking": {
  "beds24_base_url": "https://beds24.com/book-calypsophuket",
  "beds24_private_label_url": "https://book.TVOJADOMENA.com/book-calypsophuket",
  "use_private_label": true,
  "beds24_css_url": "https://TVOJADOMENA.com/beds24.css",
  "default_adults": 2
}
```

## 4) Kako testiraš (najlažje)
Odpri stran:
`private-label-test.html`

- Klikni **Open booking (selected)**
- Če v browserju vidiš URL na tvojem subdomainu (npr. `book.tvojadomena.com`) in ostane tak tudi med checkoutom → ✅ Private Label dela.

## Če se booking ne prikaže v “modal” (iframe)
Včasih lahko booking sistem blokira iframe. V tem primeru:
- testiraj najprej z gumbom “Open booking (selected)” (odpre v nov tab)
- potem uredimo embed način (Beds24 ima tudi “Embedded iFrame” varianto).

---

If you want, pošlji screenshot Beds24 Private Label nastavitev (ali napiši katero domeno uporabljaš) in ti napišem točno “klik-po-klik” kam v Beds24.
