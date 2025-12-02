import React, { useState, useEffect } from 'react'
import '../styles/LoadingPopup.css'

export default function LoadingPopup({ onComplete }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const duration = 8000 // 8 seconds
    const interval = 50 // Update every 50ms
    const increment = (100 / duration) * interval

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + increment
        if (newProgress >= 100) {
          clearInterval(progressInterval)
          setTimeout(onComplete, 200) // Small delay before hiding
          return 100
        }
        return newProgress
      })
    }, interval)

    return () => clearInterval(progressInterval)
  }, [onComplete])

  return (
    <div className="loading-popup-overlay">
      <div className="loading-popup-content">
        <div className="loading-logo">🛒</div>
        <h1 className="loading-title">Better Bites</h1>
        <p className="loading-subtitle">Fresh Groceries at Your Doorstep</p>
        
        <div className="loading-bar-container">
          <div 
            className="loading-bar" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <p className="loading-text">{Math.floor(progress)}%</p>
      </div>
    </div>
  )
}
