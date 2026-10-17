# French notes

A shared French notebook for two people. Write with the S Pen, and each line gets an
English-style sound spelling (from Wiktionary) and a button that says it in a French voice.
You type the English meaning yourself.

## Files

- `index.html` – the app
- `pron.js` – sound spellings (Wiktionary lookup, plus a spelling-rule guess when a word isn't found)
- `api/data.js` – saves notes so both tablets stay in sync

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

- **Write anywhere on your page** with the S Pen. Only the pen writes: fingers scroll and tap, and a palm resting
  on the screen while you write is ignored. The page grows as you write near the bottom.
- **Hold the S Pen button** while writing to rub out strokes, or pick the **eraser** in the toolbar.
- A quick **pen tap** on a button or box still presses it, just like a finger.
- **Undo / Redo** step back and forward through strokes and erasing; **Clear** erases all ink on the page (Undo brings it back).
- Tap **Type** if you want to add a French text line with the keyboard.
- **Type** the English meaning on a line.
- **Tap the sound spelling or the speaker** to hear it. `0.6×` slows the voice, `FR`/`CA` switches France and Canadian French.
- **Eye button** blurs the English so you can test yourself; tap a line to reveal it.
- **⋮ on a line** lets you edit the French, fix the sound spelling, look it up again, or delete the line.
- **Trash button on one of your home-page cards** deletes that page and all its lines after confirmation.
- Your friend's pages are on their tab at the top, read only.

A small ≈ before a sound spelling means Wiktionary didn't have that word and the spelling was guessed
from French spelling rules. Check those ones, and edit them if they look wrong. S Pen ink is saved with
the page and syncs with the notebook; browser ink cannot reproduce all of Samsung Notes' native features.

## Notes

- Without the Upstash step the app still works, but notes are saved on that tablet only.
