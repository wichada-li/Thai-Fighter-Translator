'use strict';
/**
 * romanize.browser.js — Thai Fighter Name Romanizer (browser build)
 * Pure JavaScript, no Node/fs dependency. Dictionaries are loaded via
 * Romanizer.init({first, last, csv}) after fetching the JSON files.
 */
let DB_FIRST = {};
let DB_LAST  = {};
let DB_CSV   = {};

function init(dicts) {
  DB_FIRST = (dicts && dicts.first) || {};
  DB_LAST  = (dicts && dicts.last)  || {};
  DB_CSV   = (dicts && dicts.csv)   || {};
}

const OVERRIDE = {
  'บัวขาว':'Buakaw','บัญชาเมฆ':'Banchamek','แสงชัย':'Saengchai',
  'ยอดทอง':'Yotthong','เสนานุช':'Senanuch','สมรักษ์':'Somrak',
  'คำสิงห์':'Khamsing','เขาทราย':'Khaosai','แสนศักดิ์':'Saensak',
  'เมืองสุรินทร์':'Muangsurin','ปกรณ์':'Pakorn','สมชาย':'Somchai',
  'วิชัย':'Wichai','แสนไหว':'Saenwai','สามารถ':'Samart',
  'เขาค้อ':'Khaokor','มงกุฎเพชร':'Mongkutphet','เพชรสมุทร':'Phetsamut',
  'เพชรมงกุฎ':'Phetmongkut','มงคล':'Mongkhon','มังกร':'Mangkon',
  'เพชรบุรี':'Phetchaburi','สมุทรปราการ':'Samutprakan',
  'สุราษฎร์':'Surat','สิงห์สุราษฎร์':'Singhasurat',
  'สมใจ':'Somjai','สมพงษ์':'Somphong',
  'ธนาธร':'Thanathon','พงษ์ภิภัทร':'Phongphiphat','สุพวัต':'Suppawat',
  'วงศ์สถาพร':'Wongsaphat','วงศ์สาทร':'Wongsathon','กิตสะดาพร':'Kitsadaporn',
  'พงศ์ภิภัทร':'Phongphiphat','ณัฐภัทร':'Nattaphat','ณัฐพล':'Nattaphon',
  'ธีรวัฒน์':'Thirawat','ศุภวัฒน์':'Suppawat',
  // กมล compounds
  'กมลชนก':'Kamonchanok','กมล':'Kamon','ชนก':'Chanok',
  'กมลวรรณ':'Kamonwan','กมลรัตน์':'Kamonrat','กมลพร':'Kamonporn','กมลนาถ':'Kamonnat',
  'มานพ':'Manop','วุฒิ':'Wutthi','วุฒิกร':'Wutthikorn',
  'วุฒิเดช':'Wutthidet','วุฒิชัย':'Wutthichai','วุฒิไกร':'Wutthikrai',
  'วุฒิพงษ์':'Wutthiphong','วุฒิพล':'Wutthiphon',
  'กิตติพล':'Kittiphon','ศักดิ์สิทธิ์':'Saksit','รัตนะ':'Rattana','พลชัย':'Phonchai',
};

const CAMP_PREFIX = {
  'ส.':'Sor. ','ศ.':'Sor. ','พ.':'Por. ','ช.':'Chor. ',
  'ว.':'Wor. ','อ.':'Or. ','จ.':'Jor. ',
};

// Unicode constants
const THANTHAKHAT  = '\u0E4C';
const SARA_AA      = '\u0E32';
const MAI_HAN_AKAT = '\u0E31';
const SARA_I       = '\u0E34';
const SARA_II      = '\u0E35';
const SARA_UE      = '\u0E36';
const SARA_UEE     = '\u0E37';
const SARA_U       = '\u0E38';
const SARA_UU      = '\u0E39';
const SARA_AM      = '\u0E33';
const SARA_E       = '\u0E40';
const SARA_AE      = '\u0E41';
const SARA_O       = '\u0E42';
const SARA_AI_MUAN = '\u0E43';
const SARA_AI_MAL  = '\u0E44';
const MAI_TAI_KHU  = '\u0E47';
const KO_KAI       = '\u0E2D';
const WO_WAEN      = '\u0E27';
const RO_RUA       = '\u0E23';
const LO_LING      = '\u0E25';
const YO_YAK       = '\u0E22';
const NGO_NGU      = '\u0E07';
const SARA_A       = '\u0E30';

const TONE_MARKS = new Set(['\u0E48','\u0E49','\u0E4A','\u0E4B']);
const ABOVE_VOWS = new Set([SARA_I,SARA_II,SARA_UE,SARA_UEE,MAI_HAN_AKAT,MAI_TAI_KHU,
                             THANTHAKHAT,'\u0E48','\u0E49','\u0E4A','\u0E4B']);
const BELOW_VOWS = new Set([SARA_U,SARA_UU]);
const LEAD_VOWS  = new Set([SARA_E,SARA_AE,SARA_O,SARA_AI_MUAN,SARA_AI_MAL]);
const VOWEL_MARKS = new Set([...ABOVE_VOWS,...BELOW_VOWS,SARA_AA,MAI_HAN_AKAT,SARA_AM,SARA_A]);

const CONS_INIT = {
  'ก':'K','ข':'Kh','ฃ':'Kh','ค':'Kh','ฅ':'Kh','ฆ':'Kh',
  'ง':'Ng','จ':'J','ฉ':'Ch','ช':'Ch','ฌ':'Ch',
  'ซ':'S','ศ':'S','ษ':'S','ส':'S','ญ':'Y',
  'ด':'D','ฎ':'D','ฑ':'Th','ฒ':'Th',
  'ต':'T','ฏ':'T','ถ':'Th','ฐ':'Th','ท':'Th','ธ':'Th',
  'น':'N','ณ':'N','บ':'B','ป':'P',
  'ผ':'Ph','พ':'Ph','ภ':'Ph','ฝ':'F','ฟ':'F',
  'ม':'M','ย':'Y','ร':'R','ล':'L','ฬ':'L',
  'ว':'W','ห':'H','ฮ':'H','อ':'',
};
const CONS_FINAL = {
  'ก':'k','ข':'k','ค':'k','ฆ':'k','ง':'ng',
  'จ':'t','ช':'t','ซ':'t','ฌ':'t',
  'ด':'t','ฎ':'t','ฑ':'t','ฒ':'t','ต':'t','ฏ':'t',
  'ถ':'t','ฐ':'t','ท':'t','ธ':'t',
  'น':'n','ณ':'n','บ':'p','ป':'p','ผ':'p','พ':'p','ภ':'p',
  'ม':'m','ย':'i','ญ':'n','ร':'n','ล':'n','ฬ':'n','ว':'w',
  'ศ':'t','ษ':'t','ส':'t',
};

function isCons(c) { return c >= '\u0E01' && c <= '\u0E2E'; }
function skipTone(chars, i) {
  while (i < chars.length && TONE_MARKS.has(chars[i])) i++;
  return i;
}

function getInit(chars, i) {
  const n = chars.length;
  if (i >= n || !isCons(chars[i])) return ['', i];
  const c = chars[i];
  if (i+1 < n && chars[i+1] === THANTHAKHAT) return ['', i+2];
  let initRom = CONS_INIT[c] || '';
  i++;
  // ห นำ
  if (c === 'ห' && i < n && isCons(chars[i])) {
    const nc = chars[i];
    if ('ยวนงลมร'.includes(nc)) {
      const after = i+1 < n ? chars[i+1] : '';
      if (!ABOVE_VOWS.has(after) && !BELOW_VOWS.has(after) && after !== SARA_AA && after !== MAI_HAN_AKAT) {
        initRom = CONS_INIT[nc] || '';
        return [initRom, i+1];
      }
    }
  }
  // Cluster
  if (i < n && [RO_RUA, LO_LING, WO_WAEN].includes(chars[i])) {
    const nc2 = chars[i];
    const after = i+1 < n ? chars[i+1] : '';
    let isCluster = false;
    if (nc2 === WO_WAEN) {
      isCluster = ABOVE_VOWS.has(after) && after !== MAI_HAN_AKAT;
    } else {
      isCluster = ABOVE_VOWS.has(after) || BELOW_VOWS.has(after) ||
                  after === SARA_AA || after === MAI_HAN_AKAT || after === SARA_AM ||
                  after === SARA_A || after === '' || after === WO_WAEN;
    }
    if (isCluster) {
      const sfx = {[RO_RUA]:'r',[LO_LING]:'l',[WO_WAEN]:'w'};
      initRom += sfx[nc2];
      i++;
      if (initRom.toLowerCase() === 'phr' || initRom.toLowerCase() === 'phl')
        initRom = initRom.replace('Ph','P').replace('ph','p');
    }
  }
  return [initRom[0] ? initRom[0].toUpperCase() + initRom.slice(1) : '', i];
}

function getFinal(chars, i) {
  const n = chars.length;
  if (i >= n) return ['', i];
  i = skipTone(chars, i);
  if (i >= n) return ['', i];
  const c = chars[i];
  if (c === THANTHAKHAT) return ['', i+1];
  if (!isCons(c)) return ['', i];
  if (i+2 < n && ABOVE_VOWS.has(chars[i+1]) && chars[i+2] === THANTHAKHAT) return ['', i+3];
  if (i+1 < n && chars[i+1] === THANTHAKHAT) return ['', i+2];
  if (i+1 < n) {
    const nc = chars[i+1];
    if (ABOVE_VOWS.has(nc) || BELOW_VOWS.has(nc) || nc === MAI_HAN_AKAT || nc === SARA_AM || nc === SARA_AA)
      return ['', i];
  }
  // Silent ร rule
  if (i+1 < n && chars[i+1] === RO_RUA) {
    const afterRo = i+2 < n ? chars[i+2] : '';
    if (isCons(afterRo) || LEAD_VOWS.has(afterRo))
      return [CONS_FINAL[c]||'', i+2];
  }
  // การันต์ cluster
  if (i+1 < n && isCons(chars[i+1])) {
    let j = i+1;
    while (j < n && isCons(chars[j])) j++;
    if (j < n && chars[j] === THANTHAKHAT) return [CONS_FINAL[c]||'', j+1];
  }
  return [CONS_FINAL[c]||'', i+1];
}

function romanizeSyllable(chars, i) {
  const n = chars.length;
  if (i >= n) return ['', i];
  const c = chars[i];

  // Leading vowel
  if (LEAD_VOWS.has(c)) {
    const lead = c; i++;
    let [init, ni] = getInit(chars, i); i = ni;
    i = skipTone(chars, i);
    let vow = '', fin = '';

    if (lead === SARA_E) {
      if (i < n && chars[i] === KO_KAI) {
        i++;
        if (i < n && (chars[i] === SARA_UE || chars[i] === SARA_UEE)) { i++; vow = 'ua'; }
        else vow = 'oe';
        [fin, i] = getFinal(chars, i);
      } else if (i < n && chars[i] === MAI_TAI_KHU) {
        i++; vow = 'e'; [fin, i] = getFinal(chars, i);
      } else if (i < n && chars[i] === SARA_AA) {
        i++; vow = 'ao'; fin = '';
        if (i < n && isCons(chars[i]) && chars[i] !== WO_WAEN) [fin, i] = getFinal(chars, i);
      } else if (i < n && (chars[i] === SARA_II || chars[i] === SARA_UEE)) {
        const sara = chars[i]; i++;
        if (i < n && chars[i] === YO_YAK) { i++; vow = 'ia'; }
        else if (i < n && chars[i] === KO_KAI) { i++; vow = 'uea'; }
        else vow = sara === SARA_II ? 'ia' : 'uea';
        [fin, i] = getFinal(chars, i);
      } else if (i < n && isCons(chars[i]) && i+1 < n && (chars[i+1] === SARA_II || chars[i+1] === SARA_UEE)) {
        i += 2;
        if (i < n && chars[i] === YO_YAK) { i++; vow = 'ia'; }
        else if (i < n && chars[i] === KO_KAI) { i++; vow = 'ua'; }
        else vow = 'ia';
        [fin, i] = getFinal(chars, i);
      } else {
        vow = 'e'; [fin, i] = getFinal(chars, i);
      }
    } else if (lead === SARA_AE) {
      vow = 'ae'; [fin, i] = getFinal(chars, i);
    } else if (lead === SARA_O) {
      vow = 'o'; [fin, i] = getFinal(chars, i);
    } else if (lead === SARA_AI_MUAN || lead === SARA_AI_MAL) {
      vow = 'ai'; fin = '';
      if (i < n && chars[i] === YO_YAK) i++;
      else { const [f2, i2] = getFinal(chars, i); if (f2) { fin = f2; i = i2; } }
    }
    return [init + vow + fin, i];
  }

  // Normal consonant syllable
  if (isCons(c)) {
    // รร shortcut
    if (i+2 < n && chars[i+1] === RO_RUA && chars[i+2] === RO_RUA) {
      const initRom = (CONS_INIT[c]||'') || '';
      const cap = initRom ? initRom[0].toUpperCase() + initRom.slice(1) : '';
      let j = i + 3;
      j = skipTone(chars, j);
      if (j < n && chars[j] === SARA_AA) {
        j++; const [fin, j2] = getFinal(chars, j); return [cap + 'anna' + fin, j2];
      } else if (j < n && isCons(chars[j]) && chars[j] !== RO_RUA) {
        const [fin, j2] = getFinal(chars, j); return [cap + 'a' + fin, j2];
      } else return [cap + 'an', j];
    }

    // Lone consonant check
    const nextC = i+1 < n ? chars[i+1] : '';
    if (i+1 >= n || (!ABOVE_VOWS.has(nextC) && !BELOW_VOWS.has(nextC) &&
        nextC !== SARA_AA && nextC !== MAI_HAN_AKAT && nextC !== SARA_AM &&
        !LEAD_VOWS.has(nextC) && nextC !== KO_KAI && nextC !== WO_WAEN &&
        nextC !== YO_YAK && nextC !== NGO_NGU && !isCons(nextC))) {
      return [CONS_FINAL[c]||'', i+1];
    }

    let [init, ni] = getInit(chars, i); i = ni;
    const origC = c;
    i = skipTone(chars, i);

    if (i >= n) {
      const origInit = CONS_INIT[origC] || '';
      const cap = origInit ? origInit[0].toUpperCase() + origInit.slice(1) : init;
      if (init.length > 1) {
        const sfxMap = {'r':'n','l':'n','w':'o'};
        const last = init[init.length-1].toLowerCase();
        if (sfxMap[last]) return [cap + 'o' + sfxMap[last], i];
      }
      return [init, i];
    }

    const nc = chars[i];

    // รร after init
    if (nc === RO_RUA && i+1 < n && chars[i+1] === RO_RUA) {
      i += 2; i = skipTone(chars, i);
      if (i < n && isCons(chars[i]) && chars[i] !== RO_RUA) {
        const [fin, i2] = getFinal(chars, i); return [init + 'a' + fin, i2];
      }
      return [init + 'an', i];
    }

    // Vowels
    if (nc === MAI_HAN_AKAT) {
      i++; i = skipTone(chars, i);
      if (i < n && chars[i] === WO_WAEN) { i++; return [init + 'ua', i]; }
      const [fin, i2] = getFinal(chars, i); return [init + 'a' + fin, i2];
    }
    if (nc === SARA_AA) {
      i++; i = skipTone(chars, i);
      if (i < n && chars[i] === WO_WAEN) {
        const nextAfter = i+1 < n ? chars[i+1] : '';
        if (!nextAfter || !isCons(nextAfter)) { i++; return [init + 'ao', i]; }
      }
      const [fin, i2] = getFinal(chars, i); return [init + 'a' + fin, i2];
    }
    if (nc === SARA_I) {
      i++; i = skipTone(chars, i);
      if (i < n && chars[i] === THANTHAKHAT) return ['', i+1];
      const [fin, i2] = getFinal(chars, i); return [init + 'i' + fin, i2];
    }
    if (nc === SARA_II) {
      i++; i = skipTone(chars, i);
      if (i < n && chars[i] === THANTHAKHAT) return ['', i+1];
      const [fin, i2] = getFinal(chars, i);
      return [init + (fin ? 'i' : 'ee') + fin, i2];
    }
    if (nc === SARA_UE) { i++; const [fin, i2] = getFinal(chars, i); return [init + 'ue' + fin, i2]; }
    if (nc === SARA_UEE) {
      i++;
      let vow = 'ue';
      if (i < n && chars[i] === KO_KAI) { i++; vow = 'ua'; }
      const [fin, i2] = getFinal(chars, i); return [init + vow + fin, i2];
    }
    if (nc === SARA_U)  { i++; const [fin, i2] = getFinal(chars, i); return [init + 'u' + fin, i2]; }
    if (nc === SARA_UU) { i++; const [fin, i2] = getFinal(chars, i); return [init + 'u' + fin, i2]; }
    if (nc === SARA_AM) { i++; return [init + 'am', i]; }
    if (nc === MAI_TAI_KHU) { i++; const [fin, i2] = getFinal(chars, i); return [init + 'e' + fin, i2]; }
    if (nc === SARA_A)  { i++; const [fin, i2] = getFinal(chars, i); return [init + 'a' + fin, i2]; }
    if (nc === KO_KAI)  { i++; const [fin, i2] = getFinal(chars, i); return [init + 'o' + fin, i2]; }
    if (nc === WO_WAEN) {
      i++;
      if (i < n && chars[i] === YO_YAK) { i++; return [init + 'uay', i]; }
      if (i < n && isCons(chars[i])) { const [fin, i2] = getFinal(chars, i); return [init + 'ua' + fin, i2]; }
      return [init + 'o', i];
    }
    if (nc === YO_YAK) { i++; return [init + 'ai', i]; }
    if (nc === NGO_NGU) { i++; return [init + 'ong', i]; }

    // CC pattern
    if (isCons(nc)) {
      let j = i + 1;
      while (j < n && isCons(chars[j])) j++;
      if (j < n && chars[j] === THANTHAKHAT) {
        const cluster = chars.slice(i, j).join('');
        j++;
        let vow = 'an';
        if ('ณนร'.split('').some(x => cluster.includes(x))) vow = 'on';
        else if (cluster.includes('ง')) vow = 'ong';
        return [init + vow, j];
      }
      const c2 = chars[i];
      const afterC2 = i+1 < n ? chars[i+1] : '';
      if (ABOVE_VOWS.has(afterC2) || BELOW_VOWS.has(afterC2) ||
          afterC2 === MAI_HAN_AKAT || afterC2 === SARA_AA || LEAD_VOWS.has(afterC2)) {
        return [init + 'a', i];
      } else {
        let finRom = CONS_FINAL[c2] || '';
        i++;
        if (i < n && chars[i] === THANTHAKHAT) i++;
        return [init + 'o' + finRom, i];
      }
    }
    return [init + 'a', i];
  }

  if (c === SARA_A) return ['a', i+1];
  return [c, i+1];
}

function lookup(word) {
  if (DB_CSV[word])    return [DB_CSV[word],   'csv'];
  if (OVERRIDE[word])  return [OVERRIDE[word],  'dict'];
  const low = word.toLowerCase();
  if (DB_FIRST[low])   return [DB_FIRST[low],   'db'];
  if (DB_LAST[low])    return [DB_LAST[low],    'db'];
  return [null, null];
}

function romanizeWord(word) {
  if (!word) return ['', 'rule'];
  if (/^[A-Za-z0-9][A-Za-z0-9'\-.]*$/.test(word)) return [word, 'english'];
  if (!/[\u0E00-\u0E7F]/.test(word)) return [word, 'other'];

  // สม- prefix special case (very common in Thai names: สมชาย, สมใจ, สมพงษ์...).
  // Read as "Som" whenever ม is NOT itself carrying a vowel mark (the ม-has-its-own-vowel
  // case is the ส-มัย/ส-มัคร "Sa-" pattern, e.g. สมัย -> Samai, สมัคร -> Samak).
  if (word.length > 2 && word[0] === 'ส' && word[1] === 'ม') {
    const after = word[2];
    const vowelOnM = ABOVE_VOWS.has(after) || BELOW_VOWS.has(after) ||
                      after === MAI_HAN_AKAT || after === SARA_AA || after === SARA_AM;
    if (!vowelOnM) {
      const [restRoman] = romanizeWord(word.slice(2));
      const restLower = restRoman.toLowerCase();
      return ['Som' + restLower, 'rule'];
    }
  }

  const parts = [];
  let remaining = word;
  while (remaining) {
    let matched = false;
    for (let len = Math.min(remaining.length, 12); len >= 1; len--) {
      const prefix = remaining.slice(0, len);
      const [roman] = lookup(prefix);
      if (roman) {
        const nextChar = len < remaining.length ? remaining[len] : '';
        if (VOWEL_MARKS.has(nextChar)) continue;
        parts.push(roman);
        remaining = remaining.slice(len);
        matched = true;
        break;
      }
    }
    if (!matched) {
      const chars = [...remaining];
      let [syl, adv] = romanizeSyllable(chars, 0);
      if (adv === 0) adv = 1;
      parts.push(syl);
      remaining = remaining.slice(adv);
    }
  }
  let result = parts.map(p => p.toLowerCase()).join('');
  if (result) result = result[0].toUpperCase() + result.slice(1);
  return [result || word, 'rule'];
}

function translateName(text) {
  text = text.trim();
  if (!text) return null;
  if (OVERRIDE[text]) return {
    romanized: OVERRIDE[text],
    parts: [{thai: text, roman: OVERRIDE[text], method: 'dict'}],
    method: 'dict'
  };

  const words = text.split(/\s+/);
  const parts = [];
  const methods = [];

  for (const word of words) {
    if (!word) continue;
    let prefixRom = '';
    let rest = word;
    for (const [pre, rom] of Object.entries(CAMP_PREFIX)) {
      if (word.startsWith(pre)) { prefixRom = rom; rest = word.slice(pre.length); break; }
    }
    if (/^[A-Za-z0-9][A-Za-z0-9'\-.]*$/.test(rest)) {
      parts.push({thai: word, roman: prefixRom + rest, method: 'english'});
      methods.push('english'); continue;
    }
    const [roman, method] = lookup(rest);
    if (roman) {
      parts.push({thai: word, roman: prefixRom + roman, method});
      methods.push(method); continue;
    }
    const [r2] = romanizeWord(rest);
    parts.push({thai: word, roman: prefixRom + r2, method: 'rule'});
    methods.push('rule');
  }

  if (!parts.length) return null;
  const romanized = parts.map(p => p.roman).join(' ');
  const overall = methods.includes('dict') ? 'dict' : methods.includes('db') ? 'db' : 'rule';
  return {romanized, parts, method: overall};
}

window.Romanizer = { init, translateName };
