'use client'

import { Sun, Moon, Monitor, Globe } from 'lucide-react'
import { useTheme } from '@/lib/theme/ThemeContext'
import { useI18n } from '@/lib/i18n/I18nContext'
import { useState } from 'react'

export default function QuickSettings() {
  const { theme, setTheme } = useTheme()
  const { language, setLanguage } = useI18n()
  const [showThemeMenu, setShowThemeMenu] = useState(false)
  const [showLangMenu, setShowLangMenu] = useState(false)

  const themeIcons = {
    light: Sun,
    dark: Moon,
    system: Monitor,
  }

  const CurrentThemeIcon = themeIcons[theme]

  return (
    <div className="flex items-center gap-2">
      {/* Language Switcher */}
      <div className="relative">
        <button
          onClick={() => setShowLangMenu(!showLangMenu)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Change Language"
        >
          <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>

        {showLangMenu && (
          <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
            <button
              onClick={() => {
                setLanguage('vi')
                setShowLangMenu(false)
              }}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${
                language === 'vi' ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              🇻🇳 Tiếng Việt
            </button>
            <button
              onClick={() => {
                setLanguage('en')
                setShowLangMenu(false)
              }}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${
                language === 'en' ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              🇬🇧 English
            </button>
          </div>
        )}
      </div>

      {/* Theme Switcher */}
      <div className="relative">
        <button
          onClick={() => setShowThemeMenu(!showThemeMenu)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Change Theme"
        >
          <CurrentThemeIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>

        {showThemeMenu && (
          <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
            <button
              onClick={() => {
                setTheme('light')
                setShowThemeMenu(false)
              }}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${
                theme === 'light' ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              <Sun className="w-4 h-4" />
              Light
            </button>
            <button
              onClick={() => {
                setTheme('dark')
                setShowThemeMenu(false)
              }}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${
                theme === 'dark' ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              <Moon className="w-4 h-4" />
              Dark
            </button>
            <button
              onClick={() => {
                setTheme('system')
                setShowThemeMenu(false)
              }}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${
                theme === 'system' ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              <Monitor className="w-4 h-4" />
              System
            </button>
          </div>
        )}
      </div>

      {/* Close menus when clicking outside */}
      {(showThemeMenu || showLangMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowThemeMenu(false)
            setShowLangMenu(false)
          }}
        />
      )}
    </div>
  )
}
