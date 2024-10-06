// Borrowed from:
// https://github.com/custom-cards/boilerplate-card/blob/master/src/localize/localize.ts

// Sorted alphabetically
// import * as ca from './translations/ca.json';
// import * as cn from './translations/cn.json';
import * as cs from './translations/cs.json';
import * as da from './translations/da.json';
import * as de from './translations/de.json';
import * as en from './translations/en.json';
import * as et from './translations/et.json';
import * as es from './translations/es.json';
// import * as fi from './translations/fi.json';
import * as fr from './translations/fr.json';
// import * as he from './translations/he.json';
import * as hu from './translations/hu.json';
import * as it from './translations/it.json';
// import * as ko from './translations/ko.json';
// import * as lt from './translations/lt.json';
// import * as nb from './translations/nb.json';
import * as nl from './translations/nl.json';
// import * as nn from './translations/nn.json';
import * as pl from './translations/pl.json';
// import * as pt from './translations/pt.json';
// import * as pt_br from './translations/pt-BR.json';
// import * as ro from './translations/ro.json';
import * as ru from './translations/ru.json';
import * as sl from './translations/sl.json';
import * as sv from './translations/sv.json';
// import * as tw from './translations/tw.json';
// import * as uk from './translations/uk.json';
// import * as vi from './translations/vi.json';

import { DEFAULT_LANG } from './defaults';

var languages = {
  // ca,
  // cn,
  cs,
  da,
  de,
  en,
  et,
  es,
  // fi,
  fr,
  // he,
  hu,
  it,
  // ko,
  // lt,
  // nb,
  nl,
  // nn,
  pl,
  // pt,
  // pt_br,
  // ro,
  ru,
  sl,
  sv,
  // tw,
  // uk,
  // vi,
};

export default function localize(string, search, replace) {
  const [section, key] = string.toLowerCase().split('.');

  let langStored;

  try {
    langStored = JSON.parse(localStorage.getItem('selectedLanguage'));
  } catch (e) {
    console.warn(e);
    langStored = localStorage.getItem('selectedLanguage');
  }

  const lang = (langStored || navigator.language.split('-')[0] || DEFAULT_LANG)
    .replace(/['"]+/g, '')
    .replace('-', '_');

  let translated;

  try {
    translated = languages[lang][section][key];
  } catch (e) {
    console.warn(e);
    translated = languages[DEFAULT_LANG][section][key];
  }

  if (translated === undefined) {
    translated = languages[DEFAULT_LANG][section][key];
  }

  if (translated === undefined) {
    return key;
  }

  if (search !== '' && replace !== '') {
    translated = translated.replace(search, replace);
  }

  return translated;
}
