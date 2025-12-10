"use client"

import { useState, useEffect } from "react"
import { Palette, Sun, Moon, Monitor, Globe, Calendar, CheckCircle2 } from "lucide-react"
import { useTheme } from "@/lib/theme/ThemeContext"
import { useI18n } from "@/lib/i18n/I18nContext"
import type { Language } from "@/lib/i18n/translations"

export default function AppearanceSettings() {
  const { theme, setTheme } = useTheme()
  const { language, setLanguage, t } = useI18n()
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const savedDateFormat = localStorage.getItem('dateFormat') || 'DD/MM/YYYY'
    setDateFormat(savedDateFormat)
  }, [])

  const handleSaveSettings = () => {
    localStorage.setItem('dateFormat', dateFormat)
    setMessage(t('appearance.saved'))
    setTimeout(() => setMessage(""), 3000)
  }

  const themeOptions = [
    { value: 'light', label: t('appearance.themeLight'), icon: Sun },
    { value: 'dark', label: t('appearance.themeDark'), icon: Moon },
    { value: 'system', label: t('appearance.themeSystem'), icon: Monitor },
  ]

  const languageOptions = [
    { value: 'vi', label: t('appearance.languageVi'), flag: '🇻🇳' },
    { value: 'en', label: t('appearance.languageEn'), flag: '🇬🇧' },
  ]

  const dateFormatOptions = [
    { value: 'DD/MM/YYYY', example: '31/12/2025' },
    { value: 'MM/DD/YYYY', example: '12/31/2025' },
    { value: 'YYYY-MM-DD', example: '2025-12-31' },
  ]

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {message && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl border border-green-200 dark:border-green-800 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          {message}
        </div>
      )}

      {/* Theme Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <Palette className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('appearance.title')}</h3>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-6">{t('appearance.description')}</p>

        {/* Theme Selection */}
        <div className="space-y-4 mb-6">
          <label className="block font-medium text-gray-700 dark:text-gray-300">
            {t('appearance.theme')}
          </label>
          <div className="grid grid-cols-3 gap-4">
            {themeOptions.map((option) => {
              const Icon = option.icon
              const isActive = theme === option.value
              return (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value as any)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    isActive
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700'
                  }`}
                >
                  <Icon className={`w-8 h-8 mx-auto mb-2 ${
                    isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                  }`} />
                  <div className={`text-sm font-medium ${
                    isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {option.label}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Language Selection */}
        <div className="space-y-4 mb-6">
          <label className="block font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            {t('appearance.language')}
          </label>
          <div className="grid grid-cols-2 gap-4">
            {languageOptions.map((option) => {
              const isActive = language === option.value
              return (
                <button
                  key={option.value}
                  onClick={() => setLanguage(option.value as Language)}
                  className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                    isActive
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700'
                  }`}
                >
                  <span className="text-3xl">{option.flag}</span>
                  <div className={`text-sm font-medium ${
                    isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {option.label}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Date Format */}
        <div className="space-y-4">
          <label className="block font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {t('appearance.dateFormat')}
          </label>
          <select
            value={dateFormat}
            onChange={(e) => setDateFormat(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            {dateFormatOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value} ({option.example})
              </option>
            ))}
          </select>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSaveSettings}
          className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 transition-all"
        >
          {t('save')}
        </button>
      </div>

      {/* Preview */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Preview</h3>
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Theme: <span className="font-semibold text-gray-900 dark:text-white">{theme}</span></p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Language: <span className="font-semibold text-gray-900 dark:text-white">{language === 'vi' ? 'Tiếng Việt' : 'English'}</span></p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Date Format: <span className="font-semibold text-gray-900 dark:text-white">{dateFormat}</span></p>
          </div>
        </div>
      </div>
    </div>
  )
}
