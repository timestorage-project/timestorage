import { useState, useEffect } from 'react'
import { en } from '@/lang/en'
import { it } from '@/lang/it'

const translations = {
  en,
  it,
}

type Language = 'en' | 'it'

export const useTranslation = () => {
  const [language, setLanguage] = useState<Language>('en')

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language
    if (savedLanguage && translations[savedLanguage]) {
      setLanguage(savedLanguage)
    } else {
      const browserLanguage = navigator.language.split('-')[0] as Language
      if (translations[browserLanguage]) {
        setLanguage(browserLanguage)
      }
    }
  }, [])

  const setLanguageAndSave = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem('language', lang)
    window.location.reload()
  }

  const t = (key: string) => {
    return translations[language][key as keyof typeof en] || key
  }

  return { t, setLanguage: setLanguageAndSave, language }
}
