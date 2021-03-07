import { useLayoutEffect, useState, useReducer, useRef } from 'react';
import { easing as mapEasing } from 'ts-easing';

export default (ms: number = 1e3, easing: (string | ((num: number) => number)) = 'linear'): [number, frameType] => {
  const [elapsed, setElapsed] = useState<number>(0);

  const isUnmounted = useRef<boolean>(false);
  const [, update] = useReducer((n: number) => n + 1, 0);

  const raf = useRef<number | null>(null);
  const tmpElapsed = useRef<number>(0);     // Used to record the value of elapsed when paused
  const startTime = useRef<number>(0);

  const completed = useRef<boolean>(false);
  const paused = useRef<boolean>(true);
  const reversed = useRef<boolean>(false);

  const setRaf = (onFrame: () => void) => {
    raf.current = requestAnimationFrame(onFrame);
  };
  const clearRaf = () => {
    raf.current && cancelAnimationFrame(raf.current);
  };

  const onFrame = () => {
    const pauseElapsed = reversed.current ? 1 - tmpElapsed.current : tmpElapsed.current;
    const currElapsed = Math.min(1, (Date.now() - startTime.current) / ms + pauseElapsed);

    setElapsed(reversed.current ? 1 - currElapsed : currElapsed);
    if (currElapsed === 1) {
      clearRaf();
      paused.current = true;
      completed.current = true;
      tmpElapsed.current = +reversed.current;
      update();
    } else {
      setRaf(onFrame);
    }
  };

  const run = () => {
    if (isUnmounted.current) {
      return;
    }
    clearRaf();
    paused.current = false;
    completed.current = false;
    startTime.current = Date.now();
    setRaf(onFrame);
  };

  const start = (isReverse?: boolean) => {
    if (typeof isReverse === 'undefined') {
      isReverse = reversed.current;
    }
    // 用相反的方向执行
    if (reversed.current !== isReverse) {
      reversed.current = isReverse;
      tmpElapsed.current = elapsed;
      run();
    } else if (paused.current) {
      run();
    }
  }
  const play = () => {
    start(false);
  };

  const reverse = () => {
    start(true);
  };

  const pause = () => {
    if (isUnmounted.current || [0, 1].includes(elapsed)) {
      return;
    }
    clearRaf();
    tmpElapsed.current = elapsed;
    paused.current = true;
    update();
  };

  const restart = () => {
    if (isUnmounted.current) {
      return;
    }
    setElapsed(0);
    reversed.current = false;
    tmpElapsed.current = 0;
    run();
  };

  const seek = (currElapsed: number = 0, isReverse?: boolean) => {
    if (isUnmounted.current) {
      return;
    }
    const _currElapsed = Math.max(Math.min(currElapsed, 1), 0);
    const currReversed = typeof isReverse === 'undefined' ? reversed.current : isReverse;
    const _completed = _currElapsed === +!currReversed;

    // reversed and completed  => 0
    // !reversed and completed => 1
    // !completed            => _currElapsed
    tmpElapsed.current = _completed ? +currReversed : _currElapsed;

    reversed.current = currReversed;
    paused.current = true;
    completed.current = _completed;

    clearRaf();
    setElapsed(_currElapsed);
  };

  const useOnComplete = (fn: () => void) => {
    useLayoutEffect(() => {
      completed.current && fn && fn();
    }, [completed.current]);  // eslint-disable-line
  }

  useLayoutEffect(() => () => {
    clearRaf();
    isUnmounted.current = true;
  }, []);  // eslint-disable-line

  const easingFn = typeof easing === 'string' ? mapEasing[easing] : easing;
  let result = elapsed;

  try {
    result = easingFn(elapsed);

    // 解决到终点时小数点换算误差导致最终值不是1
    if (elapsed === 1 && result !== 1) {
      result = 1;
    }
  } catch (e) {
    if (process.env.NODE_ENV !== 'production' && typeof easingFn !== 'function') {
      console.error(
        'useKeyframe() expected "easingName" property to be a valid easing function name, like:' +
          '"' +
          Object.keys(mapEasing).join('", "') +
          '".'
      );
      console.trace();
    }
  }

  return [
    result,
    {
      progress: elapsed,
      reversed: reversed.current,
      paused: paused.current,
      completed: completed.current,
      start, play, pause, restart, seek, reverse,
      useOnComplete
    }
  ];
};
