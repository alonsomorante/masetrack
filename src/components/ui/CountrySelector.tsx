'use client'

import { useState } from 'react'
import { COUNTRIES, getDefaultCountry, Country } from '@/lib/data/countries'
import { ChevronDown } from 'lucide-react'

interface CountrySelectorProps {
  value: string
  onChange: (country: Country) => void
  className?: string
}

export function CountrySelector({ value, onChange, className = '' }: CountrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedCountry = COUNTRIES.find(c => c.code === value) || getDefaultCountry()

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] font-mono text-sm hover:border-[var(--accent)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{selectedCountry.flag}</span>
          <span>{selectedCountry.prefix}</span>
          <span className="text-[var(--text-muted)]">{selectedCountry.name}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-lg">
            {COUNTRIES.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={() => {
                  onChange(country)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-[var(--accent)]/10 transition-colors ${
                  country.code === value ? 'bg-[var(--accent)]/20' : ''
                }`}
              >
                <span className="text-lg">{country.flag}</span>
                <span className="font-mono text-sm text-[var(--text-primary)]">{country.prefix}</span>
                <span className="text-sm text-[var(--text-secondary)] flex-1">{country.name}</span>
                {country.default && (
                  <span className="text-[10px] text-[var(--accent)]">DEFAULT</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
