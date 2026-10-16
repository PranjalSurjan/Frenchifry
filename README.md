# French notes

A shared French notebook for two people. Write with the S Pen, and each line gets an
English-style sound spelling (from Wiktionary) and a button that says it in a French voice.
You type the English meaning yourself.

## Files

- `index.html` – the app
- `pron.js` – sound spellings (Wiktionary lookup, plus a spelling-rule guess when a word isn't found)
- `api/data.js` – saves notes so both tablets stay in sync
- `api/handwriting.js` – sends S Pen strokes to Google's free handwriting reader (French)

## Put it on Vercel

1. Create a new GitHub repository and upload all these files (keep the `api` folder).
2. In Vercel, choose **Add New → Project** and import that repository. No build settings are needed.
3. In the project, open the **Storage** tab, add **Upstash for Redis** (free plan) from the Marketplace,
   and connect it to this project. Vercel adds the connection settings for you.
4. Go to **Settings → Environment Variables** and add `APP_PASSCODE` with a passcode you both know.
   This stops strangers from writing in your notebook.
5. Open **Deployments** and redeploy so the new settings take effect.

## On each tablet

1. Open your Vercel link in **Chrome**.
2. Enter the passcode, then choose whose tablet it is.
3. Chrome menu (⋮) → **Add to Home screen**, so it opens like an app.
4. If tapping the speaker is silent, install a French voice:
   Android **Settings → General management → Text-to-speech → Preferred engine (Google) → Install voice data → French**.

## How to use it

- **Write** French in the box at the bottom with the S Pen. Tap a suggestion (or **Add line**) to add it to the page.
- **Type** the English meaning on the line. Samsung's handwriting-to-text works in that box too.
- **Tap the sound spelling or the speaker** to hear it. `0.6×` slows the voice, `FR`/`CA` switches France and Canadian French.
- **Eye button** blurs the English so you can test yourself; tap a line to reveal it.
- **⋮ on a line** lets you edit the French, fix the sound spelling, look it up again, or delete the line.
- Your friend's pages are on their tab at the top, read only.

A small ≈ before a sound spelling means Wiktionary didn't have that word and the spelling was guessed
from French spelling rules. Check those ones, and edit them if they look wrong.

## Notes

- Without the Upstash step the app still works, but notes are saved on that tablet only.
- The handwriting reader is Google's free public service. It's widely used but unofficial, so if it ever
  stops working, switch to the keyboard button in the toolbar.
