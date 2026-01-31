MyModernStay — Static Website (HTML/CSS/JS) + Beds24 embedded booking + Free FAQ bot + optional tawk.to

WHAT YOU EDIT (NO CODE):
1) assets/data/content.json
   - Change support email, WhatsApp number, hero headline/subheadline
   - Replace gallery image paths
   - Put your Beds24 CSS URL (must be HTTPS)
   - Paste tawk.to property_id + widget_id (optional)

WHAT YOU UPLOAD:
- assets/media/hero.mp4  (your hero video)
- assets/img/*.jpg       (your real photos)

BEDS24 STYLING:
- beds24.css is provided.
- In content.json set booking.beds24_css_url to https://mymodernstay.com/beds24.css
  (after you deploy it on your domain)

UNANSWERED QUESTIONS LOG:
- Hosted on Netlify: the hidden form 'unanswered' collects questions in Netlify dashboard.
  (No redirect. It's a background POST.)
- If not on Netlify, it silently does nothing.

DEPLOY (RECOMMENDED):
- Netlify: drag&drop the folder, then connect domain mymodernstay.com.
