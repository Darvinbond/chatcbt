'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from './button'
import { cn } from '@/lib/utils'
import { Mode } from '@/types/mode'

interface ModeDropdownProps {
  modes: Mode[]
  selectedMode: Mode | null
  onSelectMode: (mode: Mode) => void
}

export function ModeDropdown({ modes, selectedMode, onSelectMode }: ModeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <Button onClick={() => setIsOpen(!isOpen)} variant="ghost" size="sm">
        {selectedMode ? (
          <div className="flex items-center gap-2">
            {selectedMode.icon}
            <span>{selectedMode.name}</span>
          </div>
        ) : (
          <span>Tools</span>
        )}
      </Button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute bottom-full mb-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg"
          >
            <ul>
              {modes.map(mode => (
                <li key={mode.id}>
                  <button
                    onClick={() => {
                      onSelectMode(mode)
                      setIsOpen(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 flex items-center gap-2"
                  >
                    {mode.icon}
                    <span>{mode.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
