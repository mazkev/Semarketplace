import { useState, useCallback, useRef } from 'react'

export function useLocalStorage(key, initialValue) {
  const [value, setInternalValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch { return initialValue }
  })

  // Keep a ref to the latest state so we can evaluate functions immediately
  const stateRef = useRef(value)
  stateRef.current = value

  const setValue = useCallback((valueOrFn) => {
    try {
      const valueToStore = valueOrFn instanceof Function ? valueOrFn(stateRef.current) : valueOrFn
      stateRef.current = valueToStore
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
      setInternalValue(valueToStore)
    } catch (e) {
      console.warn('localStorage write failed:', e)
    }
  }, [key])

  return [value, setValue]
}

export function useToast(setToasts) {
  return useCallback((msg, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200)
  }, [setToasts])
}
