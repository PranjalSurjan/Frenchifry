# French notes

A shared French notebook for two people. Write French anywhere on the page with the S Pen; when you pause,
an arrow appears after the word for your English meaning, and a locked box underneath shows an
English-style pronunciation (from Wiktionary) that you can tap to hear in a French voice.

## Files

- `index.html` – the app
- `pron.js` – sound spellings (Wiktionary lookup, plus a spelling-rule guess when a word isn't found)
- `api/data.js` – saves notes so both tablets stay in sync
- `api/handwriting.js` – sends S Pen strokes to Google's free handwriting reader

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

- **Floating pen palette**: the tools you use while writing (French pen, Free, Select, Add line, eraser, ink
  colour, undo, redo) also sit in a small dark bar at the bottom right, so you don't have to reach for the top.
  Drag it anywhere by its ⋮⋮ handle; it stays where you put it. Tap ⌄ to tuck it into one round button, and
  tap that button to bring it back (drag the button to move it too).
- **Write a French word on any line** of the page with the S Pen. Your handwriting stays as you wrote it.
  The page never ends: keep scrolling down and more ruled lines appear.
- **Pause** for a moment and the line is read: an arrow appears right after your word, and a locked box on
  the line below shows how it sounds:
  ```
  le → the
  [luh]
  ```
- **Write the English meaning by hand** after the arrow. It stays as ink; nothing is ever corrected.
  One word or phrase per line; anything you write to the left of the arrow counts as French.
- **Mistake highlighter**: once you've written the English, the app checks your French against it. Your
  writing is never changed: mistakes get a red **highlighter** mark, and the **correction is shown** in a red
  tag next to the pronunciation box (e.g. `merc → merci`, `content → contente`, or `→ J'aime les pommes`
  when the French doesn't say what your English says). Tap the pronunciation box for the explanation, then
  fix it yourself by rubbing it out and rewriting it. Tap **✕** on a correction to **ignore** it; it won't come
  back for that line unless you change the French or the English.
- **Aa** in the toolbar sets the size of the printed text on the page (pronunciation boxes, corrections,
  arrows, typed lines, title): Small, Normal, Large or Extra large. The page fills the full screen width.
  - **Spelling and grammar**, for single words and whole sentences, come from LanguageTool's free checker.
    In a sentence, just the wrong words are highlighted.
  - **Meaning**: a single word is checked with English Wiktionary. A sentence is translated by a free translator
    (MyMemory) and compared with your English; this is rough, so it only flags sentences that seem to say
    something quite different.
  - If the app can't tell (offline, or the free services are busy), it doesn't highlight anything.
- **Tap a pronunciation box** to hear the word. A box with **?** couldn't be read; tap it to try again, or
  rub the word out and write it again. A small ≈ means Wiktionary didn't have the word and the pronunciation
  was guessed from French spelling rules.
- Tap **Free** in the toolbar for plain freehand ink: notes, drawings, underlines. It's never read and gets
  no arrow or pronunciation box. Tap the pen button to go back to French writing.
- **Select** in the toolbar lets you move writing, e.g. to make room for a word you missed:
  draw a loop around some writing, or **tap a line to select everything from there down**, then drag the
  dashed box (with the pen or a finger). It moves up and down by whole lines, and pronunciation boxes move
  with their words. The bar above the box has **Everything below**, **Delete** and **Done**. Undo puts it back.
- **Add line**: tap it, then tap the line where you missed something. Everything from that line down moves
  down to make room for one word and its pronunciation box, and you're back on the pen. Undo removes it.
- Only the S Pen writes; fingers scroll and tap. Pick the **eraser** to rub out strokes; the arrow and box
  update by themselves. **Undo / Redo** step through your writing.
- Tap **Type** to add a line with the keyboard instead (`que -> than` works there too). Typed lines sit at
  the top of the page, with an editable pronunciation box and a speaker.
- **Zoom** the page by pinching with two fingers, or with **−** / **+** in the toolbar (tap the % to go back
  to 100%). Only the notebook page zooms, not the rest of the app, and you can keep writing while zoomed in.
- `0.6×` slows the voice, `FR`/`CA` switches France and Canadian French. **▶** reads the whole page aloud.
- **Eye button** blurs the English, typed or handwritten, so you can test yourself.
- **⋮ on a typed line** lets you edit the French, fix the pronunciation, look it up again, or delete the line.
- **Trash button on one of your home-page cards** deletes that page and all its lines after confirmation.
- Your friend's pages are on their tab at the top, read only.

## Notes

- Without the Upstash step the app still works, but notes are saved on that tablet only.
- The handwriting reader is Google's free public service. It's widely used but unofficial, so if it ever
  stops working, switch to the keyboard button in the toolbar.
