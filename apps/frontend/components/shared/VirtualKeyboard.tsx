"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Keyboard,
  Delete,
  RotateCcw,
  CornerDownLeft,
  ChevronUp,
  Type,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type KeyboardLanguage = "tamil" | "sinhala" | "english";

interface VirtualKeyboardProps {
  language: KeyboardLanguage;
  isOpen: boolean;
  onClose: () => void;
  targetElement?:
    | HTMLInputElement
    | HTMLTextAreaElement
    | HTMLDivElement
    | null;
}

// ==============================
// ENHANCED TRANSLITERATION ENGINE
// ==============================

interface TransliterationResult {
  output: string;
  isTransliterated: boolean;
  replaceStart: number;
  replaceEnd: number;
}

class TransliterationEngine {
  private buffer: string = "";
  private language: KeyboardLanguage = "sinhala";

  // Expanded Sinhala transliteration dictionary
  private sinhalaDict: Record<string, string> = {
    // Single letters
    a: "අ",
    b: "බ්",
    c: "ච්",
    d: "ද්",
    e: "එ",
    f: "ෆ්",
    g: "ග්",
    h: "හ්",
    i: "ඉ",
    j: "ජ්",
    k: "ක්",
    l: "ල්",
    m: "ම්",
    n: "න්",
    o: "ඔ",
    p: "ප්",
    q: "ඩ්",
    r: "ර්",
    s: "ස්",
    t: "ත්",
    u: "උ",
    v: "ව්",
    w: "ව්",
    x: "ෂ්",
    y: "ය්",
    z: "ඡ්",

    // Vowel combinations
    aa: "ආ",
    ae: "ඇ",
    aae: "ඈ",
    ii: "ඊ",
    uu: "ඌ",
    ee: "ඒ",
    ai: "ඓ",
    oo: "ඕ",
    au: "ඖ",

    // Common consonant-vowel combinations
    ka: "ක",
    kaa: "කා",
    ki: "කි",
    kii: "කී",
    ku: "කු",
    kuu: "කූ",
    ke: "කෙ",
    kee: "කේ",
    kai: "කෛ",
    ko: "කො",
    koo: "කෝ",
    kau: "කෞ",

    ga: "ග",
    gaa: "ගා",
    gi: "ගි",
    gii: "ගී",
    gu: "ගු",
    guu: "ගූ",
    ge: "ගෙ",
    gee: "ගේ",
    gai: "ගෛ",
    go: "ගො",
    goo: "ගෝ",
    gau: "ගෞ",

    sa: "ස",
    saa: "සා",
    si: "සි",
    sii: "සී",
    su: "සු",
    suu: "සූ",
    se: "සෙ",
    see: "සේ",
    sai: "සෛ",
    so: "සො",
    soo: "සෝ",
    sau: "සෞ",

    ha: "හ",
    haa: "හා",
    hi: "හි",
    hii: "හී",
    hu: "හු",
    huu: "හූ",
    he: "හෙ",
    hee: "හේ",
    hai: "හෛ",
    ho: "හො",
    hoo: "හෝ",
    hau: "හෞ",

    na: "න",
    naa: "නා",
    ni: "නි",
    nii: "නී",
    nu: "නු",
    nuu: "නූ",
    ne: "නෙ",
    nee: "නේ",
    nai: "නෛ",
    no: "නො",
    noo: "නෝ",
    nau: "නෞ",

    ma: "ම",
    maa: "මා",
    mi: "මි",
    mii: "මී",
    mu: "මු",
    muu: "මූ",
    me: "මෙ",
    mee: "මේ",
    mai: "මෛ",
    mo: "මො",
    moo: "මෝ",
    mau: "මෞ",

    ya: "ය",
    yaa: "යා",
    yi: "යි",
    yii: "යී",
    yu: "යු",
    yuu: "යූ",
    ye: "යෙ",
    yee: "යේ",
    yai: "යෛ",
    yo: "යො",
    yoo: "යෝ",
    yau: "යෞ",

    ra: "ර",
    raa: "රා",
    ri: "රි",
    rii: "රී",
    ru: "රු",
    ruu: "රූ",
    re: "රෙ",
    ree: "රේ",
    rai: "රෛ",
    ro: "රො",
    roo: "රෝ",
    rau: "රෞ",

    la: "ල",
    laa: "ලා",
    li: "ලි",
    lii: "ලී",
    lu: "ලු",
    luu: "ලූ",
    le: "ලෙ",
    lee: "ලේ",
    lai: "ලෛ",
    lo: "ලො",
    loo: "ලෝ",
    lau: "ලෞ",

    wa: "ව",
    waa: "වා",
    wi: "වි",
    wii: "වී",
    wu: "වු",
    wuu: "වූ",
    we: "වෙ",
    wee: "වේ",
    wai: "වෛ",
    wo: "වො",
    woo: "වෝ",
    wau: "වෞ",

    ta: "ත",
    taa: "තා",
    ti: "ති",
    tii: "තී",
    tu: "තු",
    tuu: "තූ",
    te: "තෙ",
    tee: "තේ",
    tai: "තෛ",
    to: "තො",
    too: "තෝ",
    tau: "තෞ",

    da: "ද",
    daa: "දා",
    di: "දි",
    dii: "දී",
    du: "දු",
    duu: "දූ",
    de: "දෙ",
    dee: "දේ",
    dai: "දෛ",
    do: "දො",
    doo: "දෝ",
    dau: "දෞ",

    pa: "ප",
    paa: "පා",
    pi: "පි",
    pii: "පී",
    pu: "පු",
    puu: "පූ",
    pe: "පෙ",
    pee: "පේ",
    pai: "පෛ",
    po: "පො",
    poo: "පෝ",
    pau: "පෞ",

    ba: "බ",
    baa: "බා",
    bi: "බි",
    bii: "බී",
    bu: "බු",
    buu: "බූ",
    be: "බෙ",
    bee: "බේ",
    bai: "බෛ",
    bo: "බො",
    boo: "බෝ",
    bau: "බෞ",

    // Special combinations
    ng: "ඞ්",
    nga: "ඟ",
    ngga: "ඟ",
    nja: "ඤ",
    nj: "ඥ",
    sh: "ශ්",
    sha: "ශ",
    shaa: "ශා",
    shri: "ශ්‍රී",
    sri: "ශ්‍රී",
    th: "ත්‍ථ",
    tha: "ථ",
    thaa: "ථා",
    dh: "ද්‍ධ",
    dha: "ධ",
    dhaa: "ධා",
    ch: "ච්",
    cha: "ච",
    chaa: "චා",
    jh: "ඣ්",
    jha: "ඣ",
    jhaa: "ඣා",
    kh: "ඛ්",
    kha: "ඛ",
    gha: "ඝ",
    ph: "ඵ්",
    pha: "ඵ",
    bh: "භ්",
    bha: "භ",

    // Complete words
    aarambha: "ආරම්භ",
    aramba: "ආරම්භ",
    mata: "මට",
    oba: "ඔබ",
    mage: "මගේ",
    oyage: "ඔයාගේ",
    api: "අපි",
    eka: "එක",
    deka: "දෙක",
    thuna: "තුන",
    hathara: "හතර",
    paha: "පහ",
    hoya: "හෝයා",
    kiyala: "කියලා",
    venna: "වෙන්න",
    karan: "කරන්",
    giya: "ගිය",
    enna: "එන්න",
    yanna: "යන්න",
    balan: "බලන්",
    dan: "දන්",
    ganna: "ගන්න",
    denne: "දෙන්න",
    gan: "ගන්",
    karala: "කරලා",
    inne: "ඉන්නේ",
    koheda: "කොහෙද",
    kohomada: "කොහොමද",
    sindu: "සිංදු",
    asanka: "අසංක",
    kanawaa: "කානවා",

    // Punctuation and special cases
    hello: "හෙලෝ",
    bye: "බයි",
    yes: "ඔත",
    no_negation: "නැත",
    thank: "ස්තුතියි",
    sthuthi: "ස්තුතියි",
    name: "නම",
    help: "උදවු",
    water: "ජලය",
    food: "খна",
    good: "හොඳ",
    bad: "නරක",
    big: "විශාල",
    small: "කුඩා",
    time: "කාලය",
    day: "දිනය",
    night: "රාත්‍රිය",
    morning: "උදෙ",
    evening: "ගිණ",
    home: "ගෙදර",
    school: "පාසල",
    work: "වැඩ",
    play: "விளையாட",
    read: "කියවන",
    write: "ලිපින",
    talk: "කතා",
    listen: "අහන",
    see_look: "බැලුවා",
    love: "ආදරය",
    hate: "අකමැත්ත",
    happy: "සතුටු",
    sad: "කෙඳුම",

    // Punctuation and special cases
    " ": " ",
    "\n": "\n",
    "\t": "\t",
  };

  // Tamil transliteration dictionary
  private tamilDict: Record<string, string> = {
    // Single letters
    a: "அ",
    b: "ப்",
    c: "ச்",
    d: "ட்",
    e: "எ",
    f: "ப்",
    g: "க்",
    h: "ஹ்",
    i: "இ",
    j: "ஜ்",
    k: "க்",
    l: "ல்",
    m: "ம்",
    n: "ன்",
    o: "ஒ",
    p: "ப்",
    q: "க்",
    r: "ர்",
    s: "ஸ்",
    t: "த்",
    u: "உ",
    v: "வ்",
    w: "வ்",
    x: "க்ஸ்",
    y: "ய்",
    z: "ழ்",

    // Vowel combinations
    aa: "ஆ",
    ii: "ஈ",
    ee: "ஈ",
    uu: "ஊ",
    oo: "ஓ",
    ai: "ஐ",
    au: "ஔ",

    // Common consonant-vowel combinations
    ka: "க",
    kaa: "கா",
    ki: "கி",
    kii: "கீ",
    ku: "கு",
    kuu: "கூ",
    ke: "கெ",
    kee: "கே",
    kai: "கை",
    ko: "கொ",
    koo: "கோ",
    kau: "கௌ",

    sa: "ஸ",
    saa: "ஸா",
    si: "ஸி",
    sii: "ஸீ",
    su: "ஸு",
    suu: "ஸூ",
    se: "ஸெ",
    see: "ஸே",
    sai: "ஸை",
    so: "ஸொ",
    soo: "ஸோ",
    sau: "ஸௌ",

    ha: "ஹ",
    haa: "ஹா",
    hi: "ஹி",
    hii: "ஹீ",
    hu: "ஹு",
    huu: "ஹூ",
    he: "ஹெ",
    hee: "ஹே",
    hai: "ஹை",
    ho: "ஹொ",
    hoo: "ஹோ",
    hau: "ஹௌ",

    na: "ந",
    naa: "நா",
    ni: "நி",
    nii: "நீ",
    nu: "நு",
    nuu: "நூ",
    ne: "நெ",
    nee: "நே",
    nai: "நை",
    no: "நொ",
    noo: "நோ",
    nau: "நௌ",

    ma: "ம",
    maa: "மா",
    mi: "மி",
    mii: "மீ",
    mu: "மு",
    muu: "மூ",
    me: "மெ",
    mee: "மே",
    mai: "மை",
    mo: "மொ",
    moo: "மோ",
    mau: "மௌ",

    ya: "ய",
    yaa: "யா",
    yi: "யி",
    yii: "யீ",
    yu: "யு",
    yuu: "யூ",
    ye: "யெ",
    yee: "யே",
    yai: "யை",
    yo: "யொ",
    yoo: "யோ",
    yau: "யௌ",

    ra: "ர",
    raa: "ரா",
    ri: "ரி",
    rii: "ரீ",
    ru: "ரு",
    ruu: "ரூ",
    re: "ரெ",
    ree: "ரே",
    rai: "ரை",
    ro: "ரொ",
    roo: "ரோ",
    rau: "ரௌ",

    la: "ல",
    laa: "லா",
    li: "லி",
    lii: "லீ",
    lu: "லு",
    luu: "லூ",
    le: "லெ",
    lee: "லே",
    lai: "லை",
    lo: "லொ",
    loo: "லோ",
    lau: "லௌ",

    va: "வ",
    vaa: "வா",
    vi: "வி",
    vii: "வீ",
    vu: "வு",
    vuu: "வூ",
    ve: "வெ",
    vee: "வே",
    vai: "வை",
    vo: "வொ",
    voo: "வோ",
    vau: "வௌ",

    ta: "த",
    taa: "தா",
    ti: "தி",
    tii: "தீ",
    tu: "து",
    tuu: "தூ",
    te: "தெ",
    tee: "தே",
    tai: "தை",
    to: "தொ",
    too: "தோ",
    tau: "தௌ",

    da: "ட",
    daa: "டா",
    di: "டி",
    dii: "டீ",
    du: "டு",
    duu: "டூ",
    de: "டெ",
    dee: "டே",
    dai: "டை",
    do: "டொ",
    doo: "டோ",
    dau: "டௌ",

    pa: "ப",
    paa: "பா",
    pi: "பி",
    pii: "பீ",
    pu: "பு",
    puu: "பூ",
    pe: "பெ",
    pee: "பே",
    pai: "பை",
    po: "பொ",
    poo: "போ",
    pau: "பௌ",

    // Special Tamil letters
    ng: "ங்",
    nga: "ங",
    ngaa: "ஙா",
    nj: "ஞ்",
    nja: "ஞ",
    njaa: "ஞா",
    ch: "ச்",
    cha: "ச",
    chaa: "சா",
    ja: "ஜ",
    jaa: "ஜா",
    sh: "ஷ்",
    sha: "ஷ",
    shaa: "ஷா",
    R: "ற்",
    Ra: "ற",
    Raa: "றா",
    N: "ண்",
    Na: "ண",
    Naa: "ணா",
    L: "ள்",
    La: "ள",
    Laa: "ளா",
    zh: "ழ்",
    zha: "ழ",
    zhaa: "ழா",

    // Complete words
    nan: "நான்",
    naan: "நான்",
    en: "என்",
    enakku: "எனக்கு",
    unakku: "உனக்கு",
    avaru: "அவரு",
    aval: "அவள்",
    avan: "அவன்",
    enga: "எங்க",
    unga: "உங்க",
    onga: "உங்க",
    paathu: "பார்த்து",
    irukku: "இருக்கு",
    varum: "வரும்",
    poren: "போறேன்",
    vanthu: "வந்து",
    pona: "போன",
    pannu: "பண்ணு",
    sollu: "சொல்லு",
    vekkum: "வேக்கும்",
    illa: "இல்ல",
    aana: "ஆனா",
    aaga: "ஆக",
    aachi: "ஆச்சி",
    aayiram: "ஆயிரம்",
    kaalam: "காலம்",
    nandri: "நன்றி",
    vanakkam: "வணக்கம்",
    porumai: "பொறுமை",
    iniyavai: "இனியவை",
    ungalai: "உங்களை",
    neram: "நேரம்",
    aayiduchu: "ஆயிடுச்சு",

    // Punctuation and special cases
    " ": " ",
    "\n": "\n",
    "\t": "\t",
  };

  setLanguage(lang: KeyboardLanguage) {
    this.language = lang;
    this.clearBuffer();
  }

  clearBuffer() {
    this.buffer = "";
  }

  getBuffer(): string {
    return this.buffer;
  }

  getTransliterationForBuffer(): TransliterationResult {
    return this.getTransliteration();
  }

  processCharacter(char: string): TransliterationResult {
    // Always add to buffer for alphabetic characters
    if (/[a-zA-Z]/.test(char)) {
      this.buffer += char.toLowerCase();
      return this.getTransliteration();
    } else {
      // Non-alphabetic characters: finalize current buffer and add separator
      const bufferResult = this.getTransliteration();
      const finalOutput = bufferResult.output || "";
      this.buffer = "";

      return {
        output: finalOutput + char,
        isTransliterated: bufferResult.isTransliterated,
        replaceStart: bufferResult.replaceStart,
        replaceEnd: bufferResult.replaceEnd,
      };
    }
  }

  processBackspace(): TransliterationResult {
    if (this.buffer.length > 0) {
      this.buffer = this.buffer.slice(0, -1);
      return this.getTransliteration();
    }

    return {
      output: "",
      isTransliterated: false,
      replaceStart: 0,
      replaceEnd: 0,
    };
  }

  private getTransliteration(): TransliterationResult {
    if (this.buffer.length === 0) {
      return {
        output: "",
        isTransliterated: false,
        replaceStart: 0,
        replaceEnd: 0,
      };
    }

    const dict =
      this.language === "sinhala" ? this.sinhalaDict : this.tamilDict;

    // Try to match from longest to shortest for best match
    for (let i = this.buffer.length; i >= 1; i--) {
      const suffix = this.buffer.slice(-i);
      if (dict[suffix]) {
        return {
          output: dict[suffix],
          isTransliterated: true,
          replaceStart: this.buffer.length - i,
          replaceEnd: this.buffer.length,
        };
      }
    }

    // No match found - just show the buffer as is (let user see what they're typing)
    return {
      output: this.buffer,
      isTransliterated: false,
      replaceStart: 0,
      replaceEnd: this.buffer.length,
    };
  }
}

// Create engine instance
const transliterationEngine = new TransliterationEngine();

// ==============================
// TEXT MANIPULATION UTILITIES
// ==============================

class TextManipulator {
  insertText(
    element: HTMLInputElement | HTMLTextAreaElement | HTMLDivElement,
    text: string,
    replaceLength: number = 0
  ): void {
    if (!text && replaceLength === 0) return;

    if (
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement
    ) {
      const startPos = element.selectionStart || 0;
      const endPos = element.selectionEnd || 0;

      // Calculate replacement start position
      const replaceStart = Math.max(0, startPos - replaceLength);

      const currentValue = element.value;
      const newValue =
        currentValue.substring(0, replaceStart) +
        text +
        currentValue.substring(endPos);

      element.value = newValue;

      // Update cursor position
      const newPosition = replaceStart + text.length;
      element.setSelectionRange(newPosition, newPosition);

      // Trigger events
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
    } else if (element instanceof HTMLDivElement) {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);

      // Handle replacement
      if (replaceLength > 0) {
        const startOffset = Math.max(0, range.startOffset - replaceLength);
        range.setStart(range.startContainer, startOffset);
      }

      range.deleteContents();
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);

      // Move cursor after inserted text
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);

      element.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  handleTransliteration(
    element: HTMLInputElement | HTMLTextAreaElement | HTMLDivElement,
    result: TransliterationResult,
    isBackspace: boolean = false
  ): void {
    if (!result.output && !isBackspace) return;

    if (isBackspace) {
      // Handle backspace - remove one character
      this.insertText(element, "", 1);
      return;
    }

    // Check if it's a special character like space or newline
    const isSpecialChar = [" ", "\n", "\t"].includes(result.output);

    if (result.isTransliterated) {
      // Replace the appropriate number of characters for transliterated text
      this.insertText(element, result.output, result.replaceEnd);
    } else if (isSpecialChar) {
      // Direct insertion for special characters (space, newline, tab)
      this.insertText(element, result.output, 0);
    } else {
      // Just insert the character as-is
      this.insertText(element, result.output, 0);
    }
  }
}

const textManipulator = new TextManipulator();

// ==============================
// KEYBOARD LAYOUT
// ==============================

const KEYBOARD_LAYOUT = {
  rows: [
    [
      "`",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "0",
      "-",
      "=",
      "Backspace",
    ],
    ["Tab", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]", "\\"],
    ["Caps", "a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'", "Enter"],
    ["Shift", "z", "x", "c", "v", "b", "n", "m", ",", ".", "/", "Shift"],
    ["Ctrl", "Alt", "Space", "Alt", "Ctrl", "Clear"],
  ],
  normal: {
    "`": "`",
    "1": "1",
    "2": "2",
    "3": "3",
    "4": "4",
    "5": "5",
    "6": "6",
    "7": "7",
    "8": "8",
    "9": "9",
    "0": "0",
    "-": "-",
    "=": "=",
    q: "q",
    w: "w",
    e: "e",
    r: "r",
    t: "t",
    y: "y",
    u: "u",
    i: "i",
    o: "o",
    p: "p",
    "[": "[",
    "]": "]",
    "\\": "\\",
    a: "a",
    s: "s",
    d: "d",
    f: "f",
    g: "g",
    h: "h",
    j: "j",
    k: "k",
    l: "l",
    ";": ";",
    "'": "'",
    z: "z",
    x: "x",
    c: "c",
    v: "v",
    b: "b",
    n: "n",
    m: "m",
    ",": ",",
    ".": ".",
    "/": "/",
  },
  shift: {
    "`": "~",
    "1": "!",
    "2": "@",
    "3": "#",
    "4": "$",
    "5": "%",
    "6": "^",
    "7": "&",
    "8": "*",
    "9": "(",
    "0": ")",
    "-": "_",
    "=": "+",
    q: "Q",
    w: "W",
    e: "E",
    r: "R",
    t: "T",
    y: "Y",
    u: "U",
    i: "I",
    o: "O",
    p: "P",
    "[": "{",
    "]": "}",
    "\\": "|",
    a: "A",
    s: "S",
    d: "D",
    f: "F",
    g: "G",
    h: "H",
    j: "J",
    k: "K",
    l: "L",
    ";": ":",
    "'": '"',
    z: "Z",
    x: "X",
    c: "C",
    v: "V",
    b: "B",
    n: "N",
    m: "M",
    ",": "<",
    ".": ">",
    "/": "?",
  },
};

// ==============================
// MAIN VIRTUAL KEYBOARD COMPONENT
// ==============================

export const VirtualKeyboard = React.forwardRef<
  HTMLDivElement,
  VirtualKeyboardProps
>(({ language, isOpen, onClose, targetElement }, ref) => {
  const keyboardRef = useRef<HTMLDivElement>(null);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [isCapsLock, setIsCapsLock] = useState(false);
  const [buffer, setBuffer] = useState("");
  const [currentOutput, setCurrentOutput] = useState("");

  // Update transliteration engine when language changes
  useEffect(() => {
    transliterationEngine.setLanguage(language);
    setBuffer("");
    setCurrentOutput("");
  }, [language]);

  const handleCharacter = useCallback(
    (char: string) => {
      if (!targetElement) return;

      if (language === "english") {
        // Direct insertion for English
        textManipulator.insertText(targetElement, char);
        return;
      }

      // Process through transliteration engine
      const result = transliterationEngine.processCharacter(char);
      setBuffer(transliterationEngine.getBuffer());
      setCurrentOutput(result.output);

      // Special handling for non-alphabetic characters (space, newline, etc.)
      if (!/[a-zA-Z]/.test(char)) {
        // First, commit any pending transliterated text
        const pendingTransliteration =
          transliterationEngine.getTransliterationForBuffer();
        if (pendingTransliteration.output) {
          // Insert the transliterated text and the separator
          textManipulator.insertText(
            targetElement,
            pendingTransliteration.output + char,
            0
          );
        } else {
          // Just insert the separator
          textManipulator.insertText(targetElement, char, 0);
        }
        transliterationEngine.clearBuffer();
        setBuffer("");
        setCurrentOutput("");
        return;
      }

      // Update the input field with transliteration
      textManipulator.handleTransliteration(targetElement, result);
    },
    [targetElement, language]
  );

  const handleBackspace = useCallback(() => {
    if (!targetElement) return;

    if (language === "english") {
      // Direct backspace for English
      textManipulator.insertText(targetElement, "", 1);
      return;
    }

    // For transliteration languages, we need to handle backspace in the buffer
    const beforeBackspace = transliterationEngine.getBuffer();

    if (beforeBackspace.length > 0) {
      // We have characters in the buffer, just backspace them
      const result = transliterationEngine.processBackspace();
      setBuffer(transliterationEngine.getBuffer());
      setCurrentOutput(result.output);

      // Update the input field to show the new transliteration
      if (transliterationEngine.getBuffer().length > 0) {
        const newResult = transliterationEngine.getTransliterationForBuffer();
        textManipulator.handleTransliteration(targetElement, newResult);
      } else {
        // Buffer is now empty, just remove the last character from input
        textManipulator.insertText(targetElement, "", 1);
      }
    } else {
      // Buffer is empty, remove character from input field
      textManipulator.insertText(targetElement, "", 1);
    }
  }, [targetElement, language]);

  // Handle physical keyboard events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen || !targetElement) return;

      // Check if target element has focus
      if (document.activeElement !== targetElement) return;

      // Handle special keys
      switch (event.key) {
        case "Shift":
          setIsShiftPressed(true);
          return;
        case "CapsLock":
          setIsCapsLock(!isCapsLock);
          return;
        case "Escape":
          onClose();
          return;
        case "Backspace":
          event.preventDefault();
          handleBackspace();
          return;
        case "Enter":
          event.preventDefault();
          handleCharacter("\n");
          return;
        case " ":
          event.preventDefault();
          handleCharacter(" ");
          return;
        case "Tab":
          // Allow tab for navigation
          return;
      }

      // Only process printable characters
      if (event.key.length === 1) {
        event.preventDefault();
        const char =
          isShiftPressed || isCapsLock
            ? event.key.toUpperCase()
            : event.key.toLowerCase();
        handleCharacter(char);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Shift") {
        setIsShiftPressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("keyup", handleKeyUp, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("keyup", handleKeyUp, true);
    };
  }, [
    isOpen,
    targetElement,
    language,
    isShiftPressed,
    isCapsLock,
    onClose,
    handleCharacter,
    handleBackspace,
  ]);

  const handleVirtualKeyPress = useCallback(
    (keyId: string) => {
      if (!targetElement) return;

      const isUppercase = isShiftPressed || isCapsLock;

      // Handle special keys
      switch (keyId) {
        case "Shift":
          setIsShiftPressed(!isShiftPressed);
          return;
        case "Caps":
          setIsCapsLock(!isCapsLock);
          return;
        case "Space":
          handleCharacter(" ");
          return;
        case "Backspace":
          handleBackspace();
          return;
        case "Enter":
          handleCharacter("\n");
          return;
        case "Clear":
          if (
            targetElement instanceof HTMLInputElement ||
            targetElement instanceof HTMLTextAreaElement
          ) {
            targetElement.value = "";
            targetElement.dispatchEvent(new Event("input", { bubbles: true }));
          } else if (targetElement instanceof HTMLDivElement) {
            targetElement.innerHTML = "";
            targetElement.dispatchEvent(new Event("input", { bubbles: true }));
          }
          transliterationEngine.clearBuffer();
          setBuffer("");
          setCurrentOutput("");
          return;
        case "Tab":
          handleCharacter("\t");
          return;
      }

      // Get character from layout
      let char = "";
      const keyIdKey = keyId as keyof typeof KEYBOARD_LAYOUT.shift;
      if (isUppercase && KEYBOARD_LAYOUT.shift[keyIdKey]) {
        char = KEYBOARD_LAYOUT.shift[keyIdKey];
      } else if (KEYBOARD_LAYOUT.normal[keyIdKey]) {
        char = KEYBOARD_LAYOUT.normal[keyIdKey];
      } else {
        char = keyId;
      }

      if (char) {
        handleCharacter(char);
      }

      // Auto-release shift after typing
      if (!["Shift", "Caps"].includes(keyId)) {
        setIsShiftPressed(false);
      }
    },
    [
      targetElement,
      isShiftPressed,
      isCapsLock,
      handleCharacter,
      handleBackspace,
    ]
  );

  const getKeyDisplay = useCallback(
    (keyId: string) => {
      const isUppercase = isShiftPressed || isCapsLock;

      // Special keys with icons
      if (keyId === "Backspace") return <Delete className="h-4 w-4" />;
      if (keyId === "Enter") return <CornerDownLeft className="h-4 w-4" />;
      if (keyId === "Clear") return <RotateCcw className="h-4 w-4" />;
      if (keyId === "Shift") return <ChevronUp className="h-4 w-4" />;
      if (keyId === "Caps") return <Type className="h-4 w-4" />;
      if (keyId === "Tab") return "Tab";
      if (keyId === "Space") return "Space";
      if (keyId === "Ctrl") return "Ctrl";
      if (keyId === "Alt") return "Alt";

      // Get character for display
      let displayChar = "";
      const displayKeyIdKey = keyId as keyof typeof KEYBOARD_LAYOUT.shift;
      if (isUppercase && KEYBOARD_LAYOUT.shift[displayKeyIdKey]) {
        displayChar = KEYBOARD_LAYOUT.shift[displayKeyIdKey];
      } else if (KEYBOARD_LAYOUT.normal[displayKeyIdKey]) {
        displayChar = KEYBOARD_LAYOUT.normal[displayKeyIdKey];
      } else {
        displayChar = keyId;
      }

      return displayChar;
    },
    [isShiftPressed, isCapsLock]
  );

  const getKeyClassName = useCallback(
    (keyId: string) => {
      const baseClass = "font-medium transition-all min-h-9";

      if (["Space", "Backspace", "Enter", "Clear", "Tab"].includes(keyId)) {
        return cn(
          baseClass,
          "bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800",
          "text-blue-900 dark:text-blue-100",
          keyId === "Space" && "min-w-[200px]",
          keyId === "Backspace" && "min-w-[80px]",
          keyId === "Enter" && "min-w-[80px]",
          keyId === "Tab" && "min-w-[60px]",
          keyId === "Clear" && "min-w-[70px]"
        );
      }

      if (["Shift", "Caps", "Ctrl", "Alt"].includes(keyId)) {
        const isActive =
          (keyId === "Shift" && isShiftPressed) ||
          (keyId === "Caps" && isCapsLock);

        return cn(
          baseClass,
          isActive
            ? "bg-blue-500 text-white hover:bg-blue-600"
            : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600",
          keyId === "Shift" && "min-w-[90px]",
          keyId === "Caps" && "min-w-[70px]",
          keyId === "Ctrl" && "min-w-[60px]",
          keyId === "Alt" && "min-w-[60px]"
        );
      }

      return cn(
        baseClass,
        "bg-white dark:bg-gray-700 text-gray-900 dark:text-white",
        "hover:bg-gray-200 dark:hover:bg-gray-600",
        "min-w-9"
      );
    },
    [isShiftPressed, isCapsLock]
  );

  if (!isOpen) return null;

  return (
    <div
      ref={ref || keyboardRef}
      className="mt-3 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-700 shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="flex items-center gap-3">
          <Keyboard className="h-5 w-5" />
          <div>
            <span className="text-sm font-semibold capitalize">
              {language === "tamil" ? " " : language === "sinhala" ? " " : ""}
              {language} Keyboard
            </span>
            <div className="flex items-center gap-2 mt-1">
              {isShiftPressed && (
                <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                  Shift
                </span>
              )}
              {isCapsLock && (
                <span className="text-xs px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded">
                  Caps
                </span>
              )}
              {buffer && (language === "sinhala" || language === "tamil") && (
                <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded">
                  Buffer: {buffer} → {currentOutput}
                </span>
              )}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900"
        >
          ✕
        </Button>
      </div>

      {/* Keyboard Layout */}
      <div className="space-y-2">
        {KEYBOARD_LAYOUT.rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-1.5 justify-center flex-wrap">
            {row.map((keyId, keyIndex) => (
              <Button
                key={`${rowIndex}-${keyIndex}`}
                onClick={() => handleVirtualKeyPress(keyId)}
                variant="default"
                size="sm"
                className={getKeyClassName(keyId)}
              >
                {getKeyDisplay(keyId)}
              </Button>
            ))}
          </div>
        ))}
      </div>

      {/* Info and Status Bar */}
      <div className="mt-4 pt-3 border-t border-gray-300 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {language === "tamil" ? (
              <>
                <strong>Type in Tamglish:</strong> Type "naan" for "நான்",
                "ungal" for "உங்கள்"
              </>
            ) : language === "sinhala" ? (
              <>
                <strong>Type in Singlish:</strong> Type "mata" for "මට", "oba"
                for "ඔබ"
              </>
            ) : (
              <>
                <strong>Tip:</strong> Use Shift/Caps for uppercase letters
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-500 dark:text-gray-500">
              {language === "tamil"
                ? "Type phonetic English (Tamglish)"
                : language === "sinhala"
                  ? "Type phonetic English (Singlish)"
                  : "Type directly"}
            </div>
            <div className="text-xs">
              <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
                Esc
              </kbd>
              <span className="mx-1">to close</span>
            </div>
          </div>
        </div>

        {/* Examples */}
        {(language === "sinhala" || language === "tamil") && (
          <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
            <strong>Examples:</strong>
            {language === "sinhala" ? (
              <span className="ml-2">
                "mata" → මට, "oba" → ඔබ, "kohomada" → කොහොමද, "aarambha" → ආරම්භ
              </span>
            ) : (
              <span className="ml-2">
                "naan" → நான், "ungal" → உங்கள், "nandri" → நன்றி, "vanakkam" →
                வணக்கம்
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

VirtualKeyboard.displayName = "VirtualKeyboard";

export default VirtualKeyboard;
