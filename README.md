# French notes

A shared French notebook for two people. Write a French word with the S Pen and it becomes a line on
your page, like `que → than`, with an English-style pronunciation (from Wiktionary) underneath and a
button that says it in a French voice. Leave the English blank and a meaning is suggested for you.

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

- At the bottom of your page, **write the French** in the left box with the S Pen and, if you like, the
  **English meaning** in the right box. A moment after you lift the pen, the handwriting is read: the best
  guess is highlighted, other guesses sit next to it (tap one if it read you wrong), and you can hear how
  the French sounds before you add it.
- Tap **Add line**. The line goes on the page as `French → English`, with the pronunciation box under it
  filled in automatically. Writing a whole line like `moi → me` in the French box works too.
- If you left the English blank, a meaning from Wiktionary fills in, shown in grey italics. Tap it to change it.
- The pronunciation box is yours to fix: tap it and type. A small ≈ means Wiktionary didn't have the word
  and the pronunciation was guessed from French spelling rules, so check those ones.
- In the writing boxes only the S Pen writes once you've used it, so a palm resting on the screen is ignored.
  **Hold the S Pen button** (or pick the **eraser**) to rub out strokes. **Undo / Redo** and **Clear** work on the boxes.
- Tap **Type** to add a line with the keyboard instead (`que -> than` works there too).
- **Tap the speaker** to hear a line. `0.6×` slows the voice, `FR`/`CA` switches France and Canadian French.
  **▶** reads the whole page aloud.
- **Eye button** blurs the English so you can test yourself; tap a line to reveal it.
- **⋮ on a line** lets you edit the French, fix the pronunciation, look it up again, get a suggested meaning, or delete the line.
- **Trash button on one of your home-page cards** deletes that page and all its lines after confirmation.
- Your friend's pages are on their tab at the top, read only.

## Notes

- Without the Upstash step the app still works, but notes are saved on that tablet only.
- The handwriting reader is Google's free public service. It's widely used but unofficial, so if it ever
  stops working, switch to the keyboard button in the toolbar.
