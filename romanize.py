#!/usr/bin/env python3
"""
romanize.py — Thai Fighter Name Romanizer  (Claude Cowork v.2)
TH-ENG Convention + Fighter_Profile_Repo.xlsx dictionary
"""
import json, os, re
from http.server import BaseHTTPRequestHandler, HTTPServer

_DIR = os.path.dirname(os.path.abspath(__file__))

def _load(fname):
    try:
        with open(os.path.join(_DIR, fname), encoding='utf-8') as f:
            return json.load(f)
    except:
        return {}

DB_FIRST = _load('first_names.json')
DB_LAST  = _load('last_names.json')
DB_CSV   = _load('csv_word_dict.json')   # Thai word -> English (from Rajadamnern CSV)

# Thai script -> English overrides (highest priority)
OVERRIDE = {
    'บัวขาว':     'Buakaw',
    'บัญชาเมฆ':   'Banchamek',
    'แสงชัย':     'Saengchai',
    'ยอดทอง':     'Yotthong',
    'เสนานุช':    'Senanuch',
    'สมรักษ์':    'Somrak',
    'คำสิงห์':    'Khamsing',
    'เขาทราย':    'Khaosai',
    'แสนศักดิ์':  'Saensak',
    'เมืองสุรินทร์':'Muangsurin',
    'ปกรณ์':      'Pakorn',
    'สมชาย':      'Somchai',
    'วิชัย':      'Wichai',
    'แสนไหว':     'Saenwai',
    'สามารถ':     'Samart',
    'เขาค้อ':     'Khaokor',
    'มงกุฎเพชร':  'Mongkutphet',
    'เพชรสมุทร':  'Phetsamut',
    'เพชรมงกุฎ':  'Phetmongkut',
    'มงคล':       'Mongkhon',
    'มังกร':      'Mangkon',
    'เพชรบุรี':   'Phetchaburi',
    'สมุทรปราการ':'Samutprakan',
    'สุราษฎร์':   'Surat',
    'สิงห์สุราษฎร์':'Singhasurat',
    'ธนาธร':      'Thanathon',
    'พงษ์ภิภัทร': 'Phongphiphat',
    'สุพวัต':     'Suppawat',
    'วงศ์สถาพร':  'Wongsaphat',
    'วงศ์สาทร':   'Wongsathon',
    'กิตสะดาพร':  'Kitsadaporn',
    'พงศ์ภิภัทร': 'Phongphiphat',
    'ณัฐภัทร':    'Nattaphat',
    'ณัฐพล':      'Nattaphon',
    'ธีรวัฒน์':   'Thirawat',
    'ศุภวัฒน์':   'Suppawat',
    # กมล compounds (rule engine parses กมล wrong: Komol instead of Kamon)
    'กมลชนก':     'Kamonchanok',
    'กมล':        'Kamon',
    'ชนก':        'Chanok',
    'กมลวรรณ':    'Kamonwan',
    'กมลรัตน์':   'Kamonrat',
    'กมลพร':      'Kamonporn',
    'กมลนาถ':     'Kamonnat',
    # Common name parts that rule engine struggles with
    'มานพ':       'Manop',
    'วุฒิ':       'Wutthi',
    'วุฒิกร':     'Wutthikorn',
    'วุฒิเดช':    'Wutthidet',
    'วุฒิชัย':    'Wutthichai',
    'วุฒิไกร':    'Wutthikrai',
    'วุฒิพงษ์':   'Wutthiphong',
    'วุฒิพล':     'Wutthiphon',
    'กิตติพล':    'Kittiphon',
    'ศักดิ์สิทธิ์': 'Saksit',
    'รัตนะ':      'Rattana',
    'พลชัย':      'Phonchai',
}

CAMP_PREFIX = {
    'ส.': 'Sor. ', 'ศ.': 'Sor. ', 'พ.': 'Por. ', 'ช.': 'Chor. ',
    'ว.': 'Wor. ', 'อ.': 'Or. ', 'จ.': 'Jor. ',
}

# ── Unicode codepoints ────────────────────────────────────────────
THANTHAKHAT    = '\u0E4C'
SARA_AA        = '\u0E32'  # า
MAI_HAN_AKAT   = '\u0E31'  # ั
SARA_I         = '\u0E34'  # ิ
SARA_II        = '\u0E35'  # ี
SARA_UE        = '\u0E36'  # ึ
SARA_UEE       = '\u0E37'  # ื
SARA_U         = '\u0E38'  # ุ
SARA_UU        = '\u0E39'  # ู
SARA_AM        = '\u0E33'  # ำ  (am)
SARA_E         = '\u0E40'  # เ
SARA_AE        = '\u0E41'  # แ
SARA_O         = '\u0E42'  # โ
SARA_AI_MUAN   = '\u0E43'  # ใ
SARA_AI_MALAI  = '\u0E44'  # ไ
MAI_TAI_KHU    = '\u0E47'  # ็
KO_KAI         = '\u0E2D'  # อ
WO_WAEN        = '\u0E27'  # ว
RO_RUA         = '\u0E23'  # ร
LO_LING        = '\u0E25'  # ล
YO_YAK         = '\u0E22'  # ย
NGO_NGU        = '\u0E07'  # ง

TONE_MARKS  = {'\u0E48', '\u0E49', '\u0E4A', '\u0E4B'}
ABOVE_VOWS  = {SARA_I, SARA_II, SARA_UE, SARA_UEE, MAI_HAN_AKAT, MAI_TAI_KHU,
               THANTHAKHAT, '\u0E48', '\u0E49', '\u0E4A', '\u0E4B'}
BELOW_VOWS  = {SARA_U, SARA_UU}
LEAD_VOWS   = {SARA_E, SARA_AE, SARA_O, SARA_AI_MUAN, SARA_AI_MALAI}

CONS_INIT = {
    'ก':'K',  'ข':'Kh', 'ฃ':'Kh', 'ค':'Kh', 'ฅ':'Kh', 'ฆ':'Kh',
    'ง':'Ng',
    'จ':'J',  'ฉ':'Ch', 'ช':'Ch', 'ฌ':'Ch',
    'ซ':'S',  'ศ':'S',  'ษ':'S',  'ส':'S',
    'ญ':'Y',
    'ด':'D',  'ฎ':'D',  'ฑ':'Th', 'ฒ':'Th',
    'ต':'T',  'ฏ':'T',
    'ถ':'Th', 'ฐ':'Th', 'ท':'Th', 'ธ':'Th',
    'น':'N',  'ณ':'N',
    'บ':'B',
    'ป':'P',
    'ผ':'Ph', 'พ':'Ph', 'ภ':'Ph',
    'ฝ':'F',  'ฟ':'F',
    'ม':'M',
    'ย':'Y',
    'ร':'R',
    'ล':'L',  'ฬ':'L',
    'ว':'W',
    'ห':'H',  'ฮ':'H',
    'อ':'',
}
CONS_FINAL = {
    'ก':'k',  'ข':'k',  'ค':'k',  'ฆ':'k',
    'ง':'ng',
    'จ':'t',  'ช':'t',  'ซ':'t',  'ฌ':'t',
    'ด':'t',  'ฎ':'t',  'ฑ':'t',  'ฒ':'t',  'ต':'t',  'ฏ':'t',
    'ถ':'t',  'ฐ':'t',  'ท':'t',  'ธ':'t',
    'น':'n',  'ณ':'n',
    'บ':'p',  'ป':'p',  'ผ':'p',  'พ':'p',  'ภ':'p',
    'ม':'m',
    'ย':'i',  'ญ':'n',
    'ร':'n',  'ล':'n',  'ฬ':'n',
    'ว':'w',
    'ศ':'t',  'ษ':'t',  'ส':'t',
}

def is_cons(c):
    return '\u0E01' <= c <= '\u0E2E'

def skip_tone(chars, i):
    while i < len(chars) and chars[i] in TONE_MARKS:
        i += 1
    return i

def lookahead_has_vowel(chars, i):
    """True if position i is followed by a vowel mark (above/below)"""
    if i >= len(chars): return False
    c = chars[i]
    return c in ABOVE_VOWS or c in BELOW_VOWS or c == SARA_AA or c == MAI_HAN_AKAT

def next_syllable_starts(chars, i):
    """True if chars[i] begins a new syllable (consonant + vowel following)"""
    if i >= len(chars) or not is_cons(chars[i]): return False
    if i+1 >= len(chars): return False
    nc = chars[i+1]
    # next char is a vowel mark -> this consonant is initial of new syllable
    return (nc in ABOVE_VOWS or nc in BELOW_VOWS or
            nc == SARA_AA or nc == MAI_HAN_AKAT or
            nc in LEAD_VOWS)

def romanize_syllable(chars, i):
    """
    Parse one Thai syllable starting at position i.
    Returns (romanized_string, new_position).
    """
    n = len(chars)
    if i >= n:
        return '', i

    c = chars[i]

    # ── Leading vowel syllable ────────────────────────────────────
    if c in LEAD_VOWS:
        lead = c; i += 1
        # Consume initial consonant (+ cluster)
        init, i = _get_init(chars, i)
        i = skip_tone(chars, i)

        if lead == SARA_E:
            # เ_  เ_า (ao)  เ_็_  เ_อ (oe)  เ_ีย (ia)  เ_ือ (ua)
            if i < n and chars[i] == KO_KAI:
                i += 1
                # เ_ือ or เ_อ
                if i < n and chars[i] in (SARA_UE, SARA_UEE):
                    i += 1; vow = 'ua'
                else:
                    vow = 'oe'
                fin, i = _get_final(chars, i)
            elif i < n and chars[i] == MAI_TAI_KHU:
                i += 1; vow = 'e'; fin, i = _get_final(chars, i)
            elif i < n and chars[i] == SARA_AA:
                # เ_า = 'ao' (เงา=Ngao, เรา=Rao, เกา=Kao, เมา=Mao)
                # (แ = U+0E41 is a separate character, not เ+า)
                i += 1; vow = 'ao'; fin = ''
                # check for additional final after า (rare)
                if i < n and is_cons(chars[i]) and chars[i] != WO_WAEN:
                    fin, i = _get_final(chars, i)
            else:
                # check for เ_ีย (ia) / เ_ือ (uea) — two patterns:
                # Pattern A: lead=เ + init + SARA_II/UEE + YO/KO (เธียร, เกียร์, เดียว)
                # Pattern B: lead=เ + init + cons + SARA_II/UEE + YO (old code — เ_C_ีย)
                if i < n and chars[i] in (SARA_II, SARA_UEE):
                    # Pattern A: ี/ือ directly after init (most common)
                    sara = chars[i]; i += 1
                    if i < n and chars[i] == YO_YAK: i += 1; vow = 'ia'
                    elif i < n and chars[i] == KO_KAI: i += 1; vow = 'uea'  # เ_ือ = uea
                    else: vow = 'ia' if sara == SARA_II else 'uea'
                    fin, i = _get_final(chars, i)
                elif i < n and is_cons(chars[i]) and i+1 < n and chars[i+1] in (SARA_II, SARA_UEE):
                    fin_cons = chars[i]; i += 2
                    if i < n and chars[i] == YO_YAK: i += 1; vow = 'ia'
                    elif i < n and chars[i] == KO_KAI: i += 1; vow = 'ua'
                    else: vow = 'ia'
                    fin, i = _get_final(chars, i)
                else:
                    vow = 'e'; fin, i = _get_final(chars, i)
        elif lead == SARA_AE:
            vow = 'ae'; fin, i = _get_final(chars, i)
        elif lead == SARA_O:
            vow = 'o'; fin, i = _get_final(chars, i)
        elif lead in (SARA_AI_MUAN, SARA_AI_MALAI):
            vow = 'ai'; fin = ''
            # ไ/ใ open syllable — ย after init is PART of the vowel (ไทย=Thai not Thaii)
            # skip silent ย, only consume true final consonants (not ย)
            if i < len(chars) and chars[i] == YO_YAK:
                i += 1  # silent ย — already encoded in 'ai'
            else:
                fin2, i2 = _get_final(chars, i)
                if fin2: fin = fin2; i = i2
        else:
            vow = ''; fin = ''

        return init + vow + fin, i

    # ── Normal (consonant-initial) syllable ───────────────────────
    if is_cons(c):
        # ── รร (sara ar) shortcut: C+รร[+C] ───────────────────────
        # Must check BEFORE _get_init or ร gets consumed as initial
        # Pattern: current cons + ร + ร = C + 'a' + (n if closed, else 'n')
        # e.g. กรรม=Kam, วรรณ=Wan, บรรดา=Banda, ธรรม=Tham
        if (i+2 < n and chars[i+1] == RO_RUA and chars[i+2] == RO_RUA):
            init_rom = CONS_INIT.get(c, '').capitalize()
            j = i + 3  # skip C+ร+ร
            j = skip_tone(chars, j)
            if j < n and chars[j] == SARA_AA:
                # วรรณา: รร+า = 'anna' (double n + a)
                j += 1
                fin, j = _get_final(chars, j)
                return init_rom + 'anna' + fin, j
            elif j < n and is_cons(chars[j]) and chars[j] != RO_RUA:
                fin, j = _get_final(chars, j)
                return init_rom + 'a' + fin, j
            else:
                return init_rom + 'an', j

        # Before consuming as initial, check if this is a FINAL-only consonant:
        # A consonant with no vowel following, at word boundary, is a FINAL.
        # e.g. มานพ: พ at position 3, nothing after -> CONS_FINAL = 'p'
        next_c = chars[i+1] if i+1 < len(chars) else ''
        if (i+1 >= len(chars) or
            (not (next_c in ABOVE_VOWS or next_c in BELOW_VOWS or
                  next_c == SARA_AA or next_c == MAI_HAN_AKAT or next_c == SARA_AM or
                  next_c in LEAD_VOWS or next_c == KO_KAI or next_c == WO_WAEN or
                  next_c == YO_YAK or next_c == NGO_NGU or is_cons(next_c)))):
            # Lone consonant with only a tone mark or nothing -> it's a final
            fin_rom = CONS_FINAL.get(c, '')
            return fin_rom, i + 1

        init, i = _get_init(chars, i)
        i = skip_tone(chars, i)

        if i >= n:
            # bare init at absolute end of word
            # If init contains a cluster (e.g. 'Pr' from พร), the cluster suffix
            # (ร ล ว) is actually the final consonant — parse as init + 'o' + final
            # e.g. พร -> Ph + o + n = Phon, กร -> K + o + n = Kon
            # Use CONS_INIT[c] directly (not reduced cluster) for correct Ph vs P
            orig_init = (romanize_syllable.__globals__['CONS_INIT'].get(c, '') or
                         CONS_INIT.get(c, '')).capitalize()
            if len(init) > 1:
                cluster_sfx = {'r': 'n', 'l': 'n', 'w': 'o'}
                last = init[-1].lower()
                if last in cluster_sfx:
                    return orig_init + 'o' + cluster_sfx[last], i
            return init, i

        nc = chars[i]

        # ── รร (sara ar) = special vowel ─────────────────────────
        # C+รร = C + 'an' (end of word) OR C + 'a' + final_cons
        # e.g. วรรณ=Wan, ธรรม=Tham, กรรม=Kam, สรร=San
        if nc == RO_RUA and i+1 < n and chars[i+1] == RO_RUA:
            i += 2  # consume รร
            i = skip_tone(chars, i)
            if i < n and is_cons(chars[i]) and chars[i] != RO_RUA:
                fin, i = _get_final(chars, i)
                return init + 'a' + fin, i
            else:
                return init + 'an', i

        # ── Above/below/following vowels ─────────────────────────
        if nc == MAI_HAN_AKAT:      # ั -> a, but ัว = ua (อัว vowel)
            i += 1; i = skip_tone(chars, i)
            # ัว = 'ua' (อัว compound vowel: กัว=Kua, ตัว=Tua, หัว=Hua)
            if i < n and chars[i] == WO_WAEN:
                i += 1
                return init + 'ua', i
            fin, i = _get_final(chars, i)
            return init + 'a' + fin, i

        if nc == SARA_AA:            # า -> a (long)
            i += 1
            i = skip_tone(chars, i)
            # า + ว = 'ao' (ดาว=Dao, ขาว=Khao, สาว=Sao, ราว=Rao)
            if i < n and chars[i] == WO_WAEN:
                next_after = chars[i+1] if i+1 < n else ''
                # only collapse า+ว='ao' if ว is truly at word-end or before a new syllable
                if not next_after or not is_cons(next_after):
                    i += 1
                    return init + 'ao', i
            fin, i = _get_final(chars, i)
            return init + 'a' + fin, i

        if nc == SARA_I:             # ิ -> i
            i += 1; i = skip_tone(chars, i)
            # C+ิ+์ = entire unit is silent (การันต์): ดิ์ ธิ์ ทิ์
            if i < n and chars[i] == THANTHAKHAT:
                i += 1
                return '', i   # silent — return empty
            fin, i = _get_final(chars, i)
            return init + 'i' + fin, i

        if nc == SARA_II:            # ี -> i (closed), ee (open at EOW)
            i += 1; i = skip_tone(chars, i)
            # C+ี+์ = silent
            if i < n and chars[i] == THANTHAKHAT:
                i += 1
                return '', i
            fin, i = _get_final(chars, i)
            # ี open syllable (no final) = 'ee' in Thai names (นี=Nee, มณี=Manee)
            # ี closed syllable (has final) = 'i' (กิน=Kin, ทิน=Tin)
            if not fin:
                return init + 'ee', i
            return init + 'i' + fin, i

        if nc == SARA_UE:            # ึ -> ue
            i += 1
            fin, i = _get_final(chars, i)
            return init + 'ue' + fin, i

        if nc == SARA_UEE:           # ื -> ue / ua+อ
            i += 1
            if i < n and chars[i] == KO_KAI:
                i += 1; vow = 'ua'
            else:
                vow = 'ue'
            fin, i = _get_final(chars, i)
            return init + vow + fin, i

        if nc == SARA_U:             # ุ -> u
            i += 1
            fin, i = _get_final(chars, i)
            return init + 'u' + fin, i

        if nc == SARA_UU:            # ู -> u
            i += 1
            fin, i = _get_final(chars, i)
            return init + 'u' + fin, i

        if nc == SARA_AM:            # ำ -> am (always open, no extra final)
            i += 1
            return init + 'am', i

        if nc == MAI_TAI_KHU:        # ็ -> e (short e)
            i += 1
            fin, i = _get_final(chars, i)
            return init + 'e' + fin, i

        if nc == '\u0E30':           # ะ -> a (sara a short)
            i += 1
            fin, i = _get_final(chars, i)
            return init + 'a' + fin, i

        if nc == KO_KAI:             # อ after cons = o
            i += 1
            fin, i = _get_final(chars, i)
            return init + 'o' + fin, i

        if nc == WO_WAEN:            # ว -> various
            i += 1
            if i < n and chars[i] == YO_YAK:
                # ว+ย = 'uay' (มวย=Muay)
                i += 1
                return init + 'uay', i
            elif i < n and is_cons(chars[i]):
                fin, i = _get_final(chars, i)
                return init + 'ua' + fin, i
            else:
                return init + 'o', i

        if nc == YO_YAK:             # ย after cons = final -ai (Chai, Saengchai convention)
            i += 1
            return init + 'ai', i

        if nc == NGO_NGU:            # ง as final after implied vowel
            i += 1
            return init + 'ang', i

        # ── Two consecutive consonants (C1 + C2, no vowel) ─────────
        if is_cons(nc):
            # Peek ahead for THANTHAKHAT silent cluster: C1 C2... ์
            j = i + 1
            while j < n and is_cons(chars[j]):
                j += 1
            if j < n and chars[j] == THANTHAKHAT:
                # Silent ending cluster — map by common patterns
                cluster = ''.join(chars[i:j])
                j += 1  # consume ์
                if 'ณ' in cluster or 'น' in cluster or 'ร' in cluster:
                    vow = 'on'
                elif 'ง' in cluster:
                    vow = 'ong'
                else:
                    vow = 'an'
                return init + vow, j

            # C2 is at word-end (nothing follows) → C2 is FINAL consonant of this syllable
            # Implied vowel: 'o' for most Thai word-final CC patterns (Manop, Phon, Nop)
            # But if C2 has a vowel mark after it, it starts the NEXT syllable → implied 'a'
            c2 = chars[i]
            after_c2 = chars[i+1] if i+1 < n else ''
            if after_c2 in ABOVE_VOWS or after_c2 in BELOW_VOWS or after_c2 == MAI_HAN_AKAT or after_c2 == SARA_AA or after_c2 in LEAD_VOWS:
                # C2 is initial of next syllable, current syllable ends with implied 'a'
                return init + 'a', i
            else:
                # C2 is final of THIS syllable → use CONS_FINAL, implied vowel 'o'
                fin_rom = CONS_FINAL.get(c2, '')
                i += 1
                # skip การันต์ if present
                if i < n and chars[i] == THANTHAKHAT:
                    i += 1
                return init + 'o' + fin_rom, i

        # Fallback: short 'a'
        return init + 'a', i

    # ะ sara a short as standalone (after previous syllable consumed consonant)
    if c == '\u0E30':
        return 'a', i + 1

    # Non-Thai passthrough
    return c, i + 1


def _get_init(chars, i):
    """
    Consume initial consonant(s). Handles clusters (กร กล กว พร ปล ฯลฯ)
    and silent ห นำ.
    Returns (romanized_init, new_i).
    """
    n = len(chars)
    if i >= n or not is_cons(chars[i]):
        return '', i

    c = chars[i]

    # การันต์ on first cons = silenced
    if i+1 < n and chars[i+1] == THANTHAKHAT:
        return '', i+2

    init_rom = CONS_INIT.get(c, '')
    i += 1

    # ห นำ: ห+ย ห+ว ห+น ห+ง ห+ล ห+ม ห+ร -> silent ห, keep second
    if c == 'ห' and i < n and is_cons(chars[i]):
        nc = chars[i]
        if nc in 'ยวนงลมร' and (i+1 >= n or chars[i+1] not in ABOVE_VOWS | BELOW_VOWS | {SARA_AA, MAI_HAN_AKAT}):
            init_rom = CONS_INIT.get(nc, '')
            i += 1
            return init_rom, i

    # Cluster: _ร _ล _ว — ONLY when what comes AFTER them is a vowel mark
    # กร+า = cluster (Kra), but พล+nothing = init+final (Phon), not cluster (Phl)
    if i < n and chars[i] in (RO_RUA, LO_LING, WO_WAEN):
        nc2 = chars[i]
        after = chars[i+1] if i+1 < n else ''
        # Must have a vowel immediately after the cluster-second for it to BE a cluster
        # Valid: กรา (after ร = า), กริ (after ร = ิ), เกร (leading vowel before whole cluster)
        # Invalid: พล (nothing after ล), กลม (ม follows ล = another cons -> not cluster)
        if nc2 == WO_WAEN:
            is_cluster = (after in ABOVE_VOWS and after not in (MAI_HAN_AKAT,))
        else:
            # ร/ล cluster when followed by: vowel mark, word-end, ว or ะ (sara a short)
            # แพรว: พร cluster, ว is final 'w' -> Praew
            # ประ: ปร cluster, ะ = short a -> Pra
            SARA_A = '\u0E30'
            is_cluster = (after in ABOVE_VOWS or after in BELOW_VOWS or
                          after == SARA_AA or after == MAI_HAN_AKAT or after == SARA_AM
                          or after == SARA_A          # short a ะ (ประ=Pra, กระ=Kra)
                          or after == ''           # word-final open syllable
                          or after == WO_WAEN)     # ว as final of same syllable (แพรว, กราว)
        if is_cluster:
            sfx = {RO_RUA: 'r', LO_LING: 'l', WO_WAEN: 'w'}
            init_rom += sfx[nc2]
            i += 1
            # Convention: พร=Pr, พล=Pl (not Phr/Phl) — drop silent 'h' in Ph+cluster
            if init_rom.lower() in ('phr', 'phl'):
                init_rom = init_rom.replace('Ph', 'P').replace('ph', 'p')

    return init_rom.capitalize(), i


def _get_final(chars, i):
    """
    Consume final consonant (if any). Respects การันต์.
    Returns (romanized_final, new_i).
    """
    n = len(chars)
    if i >= n: return '', i

    i = skip_tone(chars, i)
    if i >= n: return '', i

    c = chars[i]

    # Silent ์
    if c == THANTHAKHAT:
        return '', i+1

    if not is_cons(c):
        return '', i

    # Check: consonant + vowel_mark + ์ = entire unit is silent (e.g. ดิ์ กิ์ นิ์)
    if i+2 < n and chars[i+1] in ABOVE_VOWS and chars[i+2] == THANTHAKHAT:
        return '', i+3
    if i+1 < n and chars[i+1] == THANTHAKHAT:
        # Single C + ์ already silent -> but use CONS_FINAL value (e.g. ษ์ ร์)
        return '', i+2  # fully silent

    # Peek ahead: is this consonant the INITIAL of next syllable?
    if i+1 < n:
        nc = chars[i+1]
        if nc in ABOVE_VOWS or nc in BELOW_VOWS or nc == MAI_HAN_AKAT or nc == SARA_AM or nc == SARA_AA:
            return '', i  # carries a vowel -> next syllable's initial

    # Silent ร rule: C + ร + C_with_vowel = ร is silent (เพชรชัย, สมุทรปราการ pattern)
    # e.g. เพช+ร+ชัย: ช=final t, ร=silent, ชัย=next syllable
    if i+1 < n and chars[i+1] == RO_RUA:
        after_ro = chars[i+2] if i+2 < n else ''
        # ร is silent if what follows it is a consonant with a vowel (= new syllable start)
        if is_cons(after_ro) or after_ro in LEAD_VOWS:
            fin_rom = CONS_FINAL.get(c, '')
            return fin_rom, i+2  # consume C + ร (ร silent)

    # การันต์ cluster: C + C... + ์ = all silent
    if i+1 < n and is_cons(chars[i+1]):
        j = i + 1
        while j < n and is_cons(chars[j]):
            j += 1
        if j < n and chars[j] == THANTHAKHAT:
            return CONS_FINAL.get(c, ''), j+1

    return CONS_FINAL.get(c, ''), i+1


def romanize_word(word):
    """Romanize a single Thai word. Tries greedy DB prefix matching for compounds."""
    if not word:
        return '', 'rule'
    if re.match(r'^[A-Za-z0-9][A-Za-z0-9\'\-\.]*$', word):
        return word, 'english'
    if not any('\u0E00' <= c <= '\u0E7F' for c in word):
        return word, 'other'

    # Greedy prefix matching: split compound into known DB pieces
    # เพชรแพรวฟ้า -> เพชร(Phet) + แพรว(Praew) + ฟ้า(Fah)
    VOWEL_MARKS = ABOVE_VOWS | BELOW_VOWS | {SARA_AA, MAI_HAN_AKAT, SARA_AM, '\u0E30'}
    result_parts = []
    remaining = word
    while remaining:
        matched = False
        for length in range(min(len(remaining), 12), 0, -1):
            prefix = remaining[:length]
            roman, _ = lookup(prefix)
            if roman:
                # Don't match if next char is a vowel mark (would become orphan)
                # e.g. เมฆ matched before ิน would leave ิ stranded
                next_char = remaining[length] if length < len(remaining) else ''
                if next_char in VOWEL_MARKS:
                    continue  # skip this match, try shorter prefix
                result_parts.append(roman)
                remaining = remaining[length:]
                matched = True
                break
        if not matched:
            chars = list(remaining)
            syl, adv = romanize_syllable(chars, 0)
            if adv == 0: adv = 1  # safety: advance at least 1
            result_parts.append(syl)
            remaining = remaining[adv:]

    result = ''.join(p.lower() for p in result_parts)
    if result:
        result = result[0].upper() + result[1:]
    return result or word, 'rule'


def lookup(word):
    if word in DB_CSV:   return DB_CSV[word],   'csv'    # Rajadamnern DB (highest Thai-key priority)
    if word in OVERRIDE: return OVERRIDE[word], 'dict'
    low = word.lower()
    if low in DB_FIRST: return DB_FIRST[low], 'db'
    if low in DB_LAST:  return DB_LAST[low], 'db'
    return None, None


def translate_name(text):
    text = text.strip()
    if not text: return None

    # Full-word override
    if text in OVERRIDE:
        return {'romanized': OVERRIDE[text],
                'parts': [{'thai': text, 'roman': OVERRIDE[text], 'method': 'dict'}],
                'method': 'dict'}

    words = text.split()
    parts = []
    methods = []

    for word in words:
        if not word: continue

        prefix_rom = ''
        rest = word
        for pre, rom in CAMP_PREFIX.items():
            if word.startswith(pre):
                prefix_rom = rom; rest = word[len(pre):]
                break

        if re.match(r'^[A-Za-z0-9][A-Za-z0-9\'\-\.]*$', rest):
            roman = prefix_rom + rest
            parts.append({'thai': word, 'roman': roman, 'method': 'english'})
            methods.append('english'); continue

        roman, method = lookup(rest)
        if roman:
            parts.append({'thai': word, 'roman': prefix_rom + roman, 'method': method})
            methods.append(method); continue

        roman, method = romanize_word(rest)
        parts.append({'thai': word, 'roman': prefix_rom + roman, 'method': 'rule'})
        methods.append('rule')

    if not parts: return None
    romanized = ' '.join(p['roman'] for p in parts)
    overall = 'dict' if 'dict' in methods else ('db' if 'db' in methods else 'rule')
    return {'romanized': romanized, 'parts': parts, 'method': overall}


# ── HTTP Server ───────────────────────────────────────────────────
class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args): pass

    def do_OPTIONS(self):
        self.send_response(204); self._cors(); self.end_headers()

    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length)
        try:
            data = json.loads(body)
            name = data.get('name', '').strip()
            result = translate_name(name)
            if result:
                resp = json.dumps({'ok': True, 'result': result}, ensure_ascii=False).encode('utf-8')
            else:
                resp = json.dumps({'ok': False, 'error': 'empty input'}).encode()
            self.send_response(200); self._cors()
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers(); self.wfile.write(resp)
        except Exception as e:
            self.send_response(500); self._cors()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'ok': False, 'error': str(e)}).encode())

    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

if __name__ == '__main__':
    port = 3001
    print(f'  [PY] romanize.py ready at http://localhost:{port}', flush=True)
    HTTPServer(('localhost', port), Handler).serve_forever()
