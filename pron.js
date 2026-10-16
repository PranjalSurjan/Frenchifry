/* Pronunciation engine
 * 1. Look up each French word's IPA on fr.wiktionary.org (free, no key).
 * 2. If a word isn't found, guess its IPA with French spelling rules.
 * 3. Turn the IPA into an English-style sound spelling, e.g. ʒe -> "zhay".
 */
(function (root) {
  'use strict';

  // ---------- IPA symbols ----------
  const NASAL = '\u0303';
  const VOWELS = new Set(['a', 'e', 'ɛ', 'ə', 'i', 'o', 'ɔ', 'u', 'y', 'ø', 'œ',
    'a' + NASAL, 'ɔ' + NASAL, 'ɛ' + NASAL, 'œ' + NASAL]);

  // Vowel -> English sound. [open syllable, closed syllable]
  const VOWEL_EN = {
    'a': ['ah', 'ah'],
    'e': ['ay', 'ay'],
    'ɛ': ['eh', 'e'],
    'ə': ['uh', 'uh'],
    'i': ['ee', 'ee'],
    'o': ['oh', 'oh'],
    'ɔ': ['o', 'o'],
    'u': ['oo', 'oo'],
    'y': ['ew', 'ew'],
    'ø': ['uh', 'uh'],
    'œ': ['uh', 'uh'],
    ['a' + NASAL]: ['ahⁿ', 'ahⁿ'],
    ['ɔ' + NASAL]: ['ohⁿ', 'ohⁿ'],
    ['ɛ' + NASAL]: ['aⁿ', 'aⁿ'],
    ['œ' + NASAL]: ['uⁿ', 'uⁿ'],
  };

  const CONS_EN = {
    'p': 'p', 'b': 'b', 't': 't', 'd': 'd', 'k': 'k', 'g': 'g', 'f': 'f', 'v': 'v',
    's': 's', 'z': 'z', 'ʃ': 'sh', 'ʒ': 'zh', 'm': 'm', 'n': 'n', 'ɲ': 'ny', 'ŋ': 'ng',
    'l': 'l', 'ʁ': 'r', 'j': 'y', 'w': 'w', 'ɥ': 'w', 'h': 'h', 'x': 'kh',
  };
  // Consonants at the end of a syllable that read better doubled in English
  const CODA_EN = { 's': 'ss' };

  const OBSTRUENTS = new Set(['p', 'b', 't', 'd', 'k', 'g', 'f', 'v']);
  const LIQUIDS = new Set(['l', 'ʁ']);
  const GLIDES = new Set(['j', 'w', 'ɥ']);

  function cleanIPA(s) {
    return s
      .replace(/\([^)]*\)/g, '')          // optional sounds like (ə)
      .replace(/[\\/\[\]ˈˌː.‿\s‧·]/g, '')
      .replace(/ɑ/g, 'a').replace(/ɡ/g, 'g').replace(/[ʀr]/g, 'ʁ')
      .replace(/ᵊ/g, '')
      .normalize('NFD')
      ;
  }

  function tokenize(ipa) {
    const out = [];
    const chars = Array.from(ipa);
    for (let i = 0; i < chars.length; i++) {
      const c = chars[i];
      if (c === NASAL) { if (out.length) out[out.length - 1] += NASAL; continue; }
      if (/[\u0300-\u036f]/.test(c)) continue; // other diacritics
      out.push(c);
    }
    return out;
  }

  function validOnset(cl) {
    if (cl.length === 1) return true;
    if (cl.length === 2) {
      const [a, b] = cl;
      if (OBSTRUENTS.has(a) && LIQUIDS.has(b)) return true;
      if (!VOWELS.has(a) && GLIDES.has(b)) return true;
      return false;
    }
    if (cl.length === 3) {
      const [a, b, c] = cl;
      return OBSTRUENTS.has(a) && LIQUIDS.has(b) && GLIDES.has(c);
    }
    return false;
  }

  function syllabify(phones) {
    const vIdx = phones.map((p, i) => VOWELS.has(p) ? i : -1).filter(i => i >= 0);
    if (!vIdx.length) return [{ onset: phones, v: null, coda: [] }];
    const starts = [0];
    for (let k = 0; k < vIdx.length - 1; k++) {
      const a = vIdx[k], b = vIdx[k + 1];
      const cluster = phones.slice(a + 1, b);
      let take = 0;
      for (let n = Math.min(3, cluster.length); n >= 1; n--) {
        if (validOnset(cluster.slice(cluster.length - n))) { take = n; break; }
      }
      starts.push(b - take);
    }
    const syl = [];
    for (let k = 0; k < starts.length; k++) {
      const seg = phones.slice(starts[k], k + 1 < starts.length ? starts[k + 1] : phones.length);
      const vi = seg.findIndex(p => VOWELS.has(p));
      syl.push({ onset: seg.slice(0, vi), v: seg[vi], coda: seg.slice(vi + 1) });
    }
    return syl;
  }

  function respellIPA(ipa) {
    const phones = tokenize(cleanIPA(ipa));
    if (!phones.length) return '';
    return syllabify(phones).map(s => {
      const on = s.onset.map(p => CONS_EN[p] ?? p).join('');
      const v = s.v ? (VOWEL_EN[s.v] || [s.v, s.v])[s.coda.length ? 1 : 0] : '';
      const co = s.coda.map(p => CODA_EN[p] ?? CONS_EN[p] ?? p).join('');
      return on + v + co;
    }).join('-');
  }

  // ---------- Fallback: guess IPA from spelling ----------
  const V_LET = 'aeiouyéèêëàâîïôûùœ';
  const isV = ch => !!ch && V_LET.includes(ch);

  function guessIPA(word) {
    let w = word.toLowerCase().normalize('NFC').replace(/[^a-zàâçéèêëîïôûùüÿœæ]/g, '');
    if (!w) return '';
    // endings
    if (w.length > 3) w = w.replace(/(er|ez)$/, 'É');
    if (w.length > 2) w = w.replace(/([^aeiouyéèêëàâîïôûù])es?$/, '$1');
    if (w.length > 2) w = w.replace(/ent$/, w.length > 5 ? 'ɑ̃' : 'ent');
    w = w.replace(/([aeiouyéèêàâîôû])[stdxzp]+$/, '$1').replace(/([^aeiouyéèêàâîôû])[stdxz]$/, '$1');
    w = w.replace(/É$/, 'é');

    let out = '';
    let i = 0;
    const nasalOK = j => !isV(w[j]) && w[j] !== 'n' && w[j] !== 'm'; // nasal if next isn't vowel/n/m
    const rules = [
      ['eaux', 'o'], ['eau', 'o'], ['aux', 'o'], ['au', 'o'], ['oû', 'u'], ['où', 'u'], ['ou', 'u'],
      ['oy', 'waj'], ['oi', 'wa'], ['œu', 'ø'], ['eu', 'ø'], ['aî', 'ɛ'], ['ai', 'ɛ'], ['ei', 'ɛ'],
      ['gn', 'ɲ'], ['ch', 'ʃ'], ['ph', 'f'], ['qu', 'k'], ['th', 't'],
    ];
    while (i < w.length) {
      const rest = w.slice(i);
      // nasal vowels
      let m;
      if (rest.startsWith('ien') && nasalOK(i + 3)) { out += 'jɛ\u0303'; i += 3; continue; }
      if ((m = rest.match(/^(eille?|eil)/))) { out += 'ɛj'; i += m[1].length; continue; }
      if ((m = rest.match(/^(aille?|ail)/))) { out += 'aj'; i += m[1].length; continue; }
      if ((m = rest.match(/^(ain|aim|ein|eim)/)) && nasalOK(i + 3)) { out += 'ɛ\u0303'; i += 3; continue; }
      if ((m = rest.match(/^(in|im|yn|ym)/)) && nasalOK(i + 2)) { out += 'ɛ\u0303'; i += 2; continue; }
      if ((m = rest.match(/^(un|um)/)) && nasalOK(i + 2)) { out += 'œ\u0303'; i += 2; continue; }
      if ((m = rest.match(/^(on|om)/)) && nasalOK(i + 2)) { out += 'ɔ\u0303'; i += 2; continue; }
      if ((m = rest.match(/^(an|am|en|em)/)) && nasalOK(i + 2)) { out += 'a\u0303'; i += 2; continue; }
      if (rest.startsWith('ill') && i > 0 && isV(w[i - 1])) { out += 'j'; i += 3; continue; }
      if (rest.startsWith('ill')) { out += 'ij'; i += 3; continue; }
      if (rest.startsWith('gu') && /[eiéèêy]/.test(w[i + 2] || '')) { out += 'g'; i += 2; continue; }
      const r = rules.find(([a]) => rest.startsWith(a));
      if (r) { out += r[1]; i += r[0].length; continue; }
      const c = w[i], n = w[i + 1] || '';
      if (c === n && !isV(c)) { i++; continue; } // double consonants
      switch (c) {
        case 'ç': out += 's'; break;
        case 'c': out += /[eiyéèê]/.test(n) ? 's' : 'k'; break;
        case 'g': out += /[eiyéèê]/.test(n) ? 'ʒ' : 'g'; break;
        case 'j': out += 'ʒ'; break;
        case 'h': break;
        case 'x': out += 'ks'; break;
        case 'y': out += 'i'; break;
        case 's': out += (isV(w[i - 1]) && isV(n)) ? 'z' : 's'; break;
        case 'r': out += 'ʁ'; break;
        case 'é': out += 'e'; break;
        case 'è': case 'ê': case 'ë': out += 'ɛ'; break;
        case 'à': case 'â': out += 'a'; break;
        case 'î': case 'ï': out += 'i'; break;
        case 'ô': out += 'o'; break;
        case 'û': case 'ù': case 'ü': out += 'y'; break;
        case 'u': out += 'y'; break;
        case 'œ': out += 'œ'; break;
        case 'e': {
          const n2 = w[i + 2] || '';
          const closed = n && !isV(n) && ((n2 && !isV(n2)) || !n2);
          out += closed ? 'ɛ' : 'ə';
          break;
        }
        default: out += c;
      }
      i++;
    }
    return out;
  }

  // ---------- Wiktionary lookup ----------
  const cache = new Map();
  const LS = 'fn:ipa:';

  function extractFrenchPron(wikitext) {
    const parts = wikitext.split(/==\s*\{\{langue\|/);
    const fr = parts.find(p => p.startsWith('fr}}'));
    if (!fr) return null;
    const m = fr.match(/\{\{pron\|([^|}]+)\|(?:lang=)?fr\}\}/);
    return m ? m[1].trim() : null;
  }

  async function fetchWikt(title) {
    const url = 'https://fr.wiktionary.org/w/api.php?action=parse&prop=wikitext&format=json&origin=*&redirects=1&page=' +
      encodeURIComponent(title);
    const r = await fetch(url);
    if (!r.ok) return null;
    const j = await r.json();
    const wt = j && j.parse && j.parse.wikitext && j.parse.wikitext['*'];
    return wt ? extractFrenchPron(wt) : null;
  }

  async function lookupWord(word) {
    const key = word.toLowerCase();
    if (cache.has(key)) return cache.get(key);
    try {
      const saved = root.localStorage && localStorage.getItem(LS + key);
      if (saved) { const v = JSON.parse(saved); cache.set(key, v); return v; }
    } catch (e) { /* storage blocked */ }
    let ipa = null;
    const tries = [key, word, key.replace(/'/g, '’')].filter((t, i, a) => a.indexOf(t) === i);
    for (const t of tries) {
      try { ipa = await fetchWikt(t); } catch (e) { ipa = null; }
      if (ipa) break;
    }
    const res = ipa ? { ipa: cleanIPA(ipa), src: 'dictionary' } : { ipa: guessIPA(word), src: 'guess' };
    cache.set(key, res);
    try { if (res.src === 'dictionary') localStorage.setItem(LS + key, JSON.stringify(res)); } catch (e) { }
    return res;
  }

  // ---------- Phrases ----------
  const ELISION = { j: 'ʒ', l: 'l', d: 'd', n: 'n', m: 'm', t: 't', s: 's', c: 's', qu: 'k',
    jusqu: 'ʒysk', lorsqu: 'lɔʁsk', puisqu: 'pɥisk' };
  const LIAISON = {
    les: 'z', des: 'z', mes: 'z', tes: 'z', ses: 'z', ces: 'z', nous: 'z', vous: 'z', ils: 'z', elles: 'z',
    aux: 'z', deux: 'z', trois: 'z', 'très': 'z', dans: 'z', chez: 'z', sans: 'z', leurs: 'z',
    un: 'n', on: 'n', en: 'n', mon: 'n', ton: 'n', son: 'n', aucun: 'n',
    est: 't', sont: 't', ont: 't', petit: 't', grand: 't', quand: 't', tout: 't', cet: '',
  };

  async function pronounce(text) {
    const words = text.trim().replace(/[’]/g, "'").split(/[\s\-]+/).filter(Boolean)
      .map(w => w.replace(/^[^\p{L}']+|[^\p{L}']+$/gu, '')).filter(Boolean);
    const parts = [];
    for (const w of words) {
      // try the whole word first (aujourd'hui), then split elisions (j'ai)
      const whole = w.includes("'") ? await lookupWord(w) : null;
      if (whole && whole.src === 'dictionary') { parts.push({ w, ...whole }); continue; }
      const m = w.match(/^(jusqu|lorsqu|puisqu|qu|[jldnmtsc])'(.+)$/i);
      if (m) {
        const rest = await lookupWord(m[2]);
        parts.push({ w, ipa: ELISION[m[1].toLowerCase()] + rest.ipa, src: rest.src });
        continue;
      }
      parts.push({ w, ...(await lookupWord(w.replace(/'/g, ''))) });
    }
    // liaison: "vous avez" -> vu zave
    for (let k = 0; k < parts.length - 1; k++) {
      const lc = LIAISON[parts[k].w.toLowerCase()];
      const next = tokenize(parts[k + 1].ipa);
      if (lc && next.length && VOWELS.has(next[0])) parts[k + 1].ipa = lc + parts[k + 1].ipa;
    }
    return {
      ipa: parts.map(p => p.ipa).join(' '),
      sound: parts.map(p => respellIPA(p.ipa)).join(' '),
      guessed: parts.some(p => p.src === 'guess'),
    };
  }

  const api = { pronounce, respellIPA, guessIPA, cleanIPA, extractFrenchPron };
  root.Pron = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
