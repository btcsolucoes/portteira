import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
/** Disable motion until the platform preference is known; observe runtime changes. */
export function useReducedMotionSetting() {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active) setReduced(value);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  return reduced;
}
