import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * `motion.reduce` token (Section 7.1): reads the phone's "Reduce motion"
 * ("Remove animations" on Android) setting and follows changes.
 */
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active) setReduce(value);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      active = false;
      sub.remove();
    };
  }, []);

  return reduce;
}
