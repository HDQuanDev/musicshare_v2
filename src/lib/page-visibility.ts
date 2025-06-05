// src/lib/page-visibility.ts
"use client";

import { useEffect, useState, useRef, useCallback } from 'react';

export interface PageVisibilityHook {
  isVisible: boolean;
  isActive: boolean;
  lastActiveTime: number;
  timeSinceLastActive: number;
}

export const usePageVisibility = (): PageVisibilityHook => {
  const [isVisible, setIsVisible] = useState(!document.hidden);
  const [isActive, setIsActive] = useState(true);
  const [lastActiveTime, setLastActiveTime] = useState(Date.now());
  const [timeSinceLastActive, setTimeSinceLastActive] = useState(0);
  
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateActiveTime = useCallback(() => {
    setLastActiveTime(Date.now());
    setIsActive(true);
    
    // Reset activity timeout
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }
    
    // Set user as inactive after 5 minutes of no activity
    activityTimeoutRef.current = setTimeout(() => {
      setIsActive(false);
    }, 5 * 60 * 1000); // 5 minutes
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsVisible(visible);
      
      if (visible) {
        updateActiveTime();
      }
    };

    const handleFocus = () => {
      setIsVisible(true);
      updateActiveTime();
    };

    const handleBlur = () => {
      setIsVisible(false);
    };

    // Activity events
    const activityEvents = [
      'mousedown',
      'mousemove', 
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    const handleActivity = () => {
      updateActiveTime();
    };

    // Setup event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Update time since last active every second
    updateIntervalRef.current = setInterval(() => {
      setTimeSinceLastActive(Date.now() - lastActiveTime);
    }, 1000);

    // Initial activity time
    updateActiveTime();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
      
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [updateActiveTime, lastActiveTime]);

  return {
    isVisible,
    isActive,
    lastActiveTime,
    timeSinceLastActive
  };
};

export default usePageVisibility;
