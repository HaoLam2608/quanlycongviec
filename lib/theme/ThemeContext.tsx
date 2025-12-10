'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  effectiveTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme') as Theme
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setThemeState(savedTheme)
    }
  }, [])

  useEffect(() => {
    const root = window.document.documentElement
    
    // Calculate effective theme
    let newEffectiveTheme: 'light' | 'dark' = 'light'
    
    if (theme === 'system') {
      // Check system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      newEffectiveTheme = systemPrefersDark ? 'dark' : 'light'
    } else {
      newEffectiveTheme = theme as 'light' | 'dark'
    }
    
    setEffectiveTheme(newEffectiveTheme)
    
    // Apply theme to DOM - add both class and data attribute
    root.classList.remove('light', 'dark')
    root.classList.add(newEffectiveTheme)
    
    // Set data attribute for CSS
    root.setAttribute('data-theme', newEffectiveTheme)
    
    // Also update body background color immediately
    document.body.style.backgroundColor = newEffectiveTheme === 'dark' ? '#0f172a' : '#ffffff'
  }, [theme])

  // Listen to system theme changes when theme is 'system'
  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const newEffectiveTheme = mediaQuery.matches ? 'dark' : 'light'
      setEffectiveTheme(newEffectiveTheme)
      
      const root = window.document.documentElement
      root.classList.remove('light', 'dark')
      root.classList.add(newEffectiveTheme)
      root.setAttribute('data-theme', newEffectiveTheme)
      document.body.style.backgroundColor = newEffectiveTheme === 'dark' ? '#0f172a' : '#ffffff'
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, effectiveTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
