import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { useRecoilValue } from 'recoil';
import { languageState } from '../recoil/atoms';
import translationEN from './en/translation.json';
import translationKO from './ko/translation.json';

const resources = {
  en: { translation: translationEN },
  ko: { translation: translationKO },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ko',  
    fallbackLng: 'en',
    interpolation: { escapeValue: false }
  });

// Recoil 언어 상태에 맞춰 i18next 언어 변경
export const useLanguageSync = () => {
  const language = useRecoilValue(languageState);
  i18n.changeLanguage(language);
};

export default i18n;
