import { useRef, useReducer } from 'react';
import { useAllDelayKeyframe, getCurrData, getNumSummation } from './utils';

export default (allKeyframe: keyframeType[]): [any, timelineType] => {
  // 将延迟数据转成数字类型
  const delayList = allKeyframe
    .map(v => v[2])
    .map((v, i: number) => {
      switch (typeof v) {
        case 'number': return v;
        case 'string': return +v || 0;
        case 'function': return v(i) || 0;
        default: return 0;
      }
    });
  const [allDelayKeyframe, mapOriginalStep, stepCountList] = useAllDelayKeyframe(allKeyframe, delayList);
  const keyframeDataList = allDelayKeyframe.map(v => v[0]);
  const targetDataList = allDelayKeyframe.map(v => v[1] || 0);

  const allNum = keyframeDataList.map(v => v[0]);
  const allFrame = keyframeDataList.map(v => v[1]);

  const allCompleted = useRef<boolean>(false);
  const allPaused = useRef<boolean>((allFrame[0] || {}).paused);
  const allReversed = useRef<boolean>(false);
  const currStep = useRef<number>(0);
  const playStepCount = useRef<number>(0);
  const [, update] = useReducer((n: number) => n + 1, 0);

  // 绑定各个动画的完成事件，注意这边包含延迟动画，也就是一个阶段可能会包含两个动画
  for (const [key, frame] of Object.entries(allFrame)) {
    const i = +key;

    frame.useOnComplete(() => {
      // 一个动画的完成代表走完了一步
      playStepCount.current -= 1;

      // 正向运动的逻辑
      if (!allReversed.current && i !== allFrame.length - 1) {
        const nextIndex = i + 1;

        if (playStepCount.current > 0) {
          // 如果还有下一步操作，就将当前步数指向下一步
          currStep.current = nextIndex;
          allFrame[nextIndex].play()
        } else {
          allPaused.current = true
        }
      }

      // 反向运动的逻辑
      else if (allReversed.current && i !== 0) {
        const prevIndex = i - 1;

        if (playStepCount.current > 0) {
          // 如果还有上一步操作，就将当前步数指向上一步
          currStep.current = prevIndex;
          allFrame[prevIndex].reverse();
        } else {
          allPaused.current = true;
        }
      }

      // 动画全部完成
      else {
        allPaused.current = true;
        allCompleted.current = true;
      }
      update();
    });
  }

  // 当前进度
  const progress = allFrame.reduce((rs, frame, _, arr) => rs + frame.progress / arr.length, 0);

  // 根据数据结构和动画数据算出的结果
  let result = targetDataList
    .map((v, i) => getCurrData(v, i, allNum[i], mapOriginalStep))   // 获取目标值对应当前的值
    .map(v => (                                                     // 函数原样返回，数字类型转成对象
      typeof v === 'function' ? v :
        (typeof v === 'number' ? { __value: v } : v)
    ))
    .reduce((rs:object, targetData, i) => (                        // 各个阶段值相加
      i === 0 ? targetData : getNumSummation(rs, targetData)
    ), {});

  // 如果只有一个__value字段就直接以数字类型返回
  if (Object.keys(result).length === 1 && result['__value']) {
    result = result['__value'];
  }

  const start = (isReverse: boolean = false, stepCount: number = allFrame.length) => {
    if (typeof isReverse === 'undefined') {
      isReverse = allReversed.current;
    }

    // 如果动画已全部完成，就先清除所有动画再开始，并将当前所在位置指向起始点
    if (allCompleted.current) {
      currStep.current = isReverse ? allFrame.length - 1 : 0;
      allFrame.forEach(frame => frame.seek(+isReverse, isReverse));
    } else {
      const currFrame = allFrame[currStep.current];

      // 如果【当前动画已完成】且【当前动画运动方向和接下来的运动方向一致】就把当前动画位置指向下一个
      if (currFrame.completed && currFrame.reversed === isReverse) {
        currStep.current += isReverse ? -1 : 1;
      }
    }
    allPaused.current = false;
    allReversed.current = isReverse;
    allCompleted.current = false;

    if (stepCount !== allFrame.length) {
      // 走到各一个阶段需要所要经历的步数，比如[0, 2, 4, 5]，起始点、第一阶段、第二阶段...，从起始点到第二阶段需要走4步
      const allStepCount = stepCountList.reduce((rs: number[], v, i) => rs.concat(v + rs[i]), [0]);
      // 用于这边计算时候的当前步数值，比如有4个阶段，正向0-4，反向5-1，所以反向加一
      const _currStep = currStep.current + (+allReversed.current);
      const sign = allReversed.current ? -1 : 1;  // 正负号
      let currStepIndex = allStepCount.indexOf(_currStep);

      // 找不到就说明运动到一半时执行nextStep，原本应该走两步这时已经执行了一步，应该只剩下一步
      if (currStepIndex === -1) {
        currStepIndex = allStepCount.indexOf(_currStep - sign);
      }
      const nextIndex = currStepIndex + stepCount * sign;

      playStepCount.current = Math.abs(allStepCount[nextIndex] - _currStep);
    } else {
      playStepCount.current = stepCount;
    }

    allFrame[currStep.current][isReverse ? 'reverse' : 'play']();
  };

  const play = () => {
    start(false);
  };
  const reverse = () => {
    start(true);
  };
  const nextStep = (stepCount: number = 1, isReverse: boolean = false) => {
    start(isReverse, stepCount);
  };

  const pause = () => {
    allPaused.current = true;
    allFrame[currStep.current].pause();
  };

  const restart = () => {
    currStep.current = 0;
    allFrame.forEach(frame => frame.seek(0, false));
    play();
  };

  const seek = (elapsed: number = 0, isReverse?: boolean) => {
    const currReversed = typeof isReverse === 'undefined' ? allReversed.current : isReverse;
    const index = Math.floor(elapsed * allNum.length);

    allFrame.forEach((frame, i) => {
      if (i < index) {
        frame.seek(1);
      } else if (i > index) {
        frame.seek(0);
      } else {
        currStep.current = index;
        allFrame[index].seek(elapsed * allNum.length - index);
      }
    });
    allPaused.current = true;
    allReversed.current = currReversed;
    allCompleted.current = elapsed === +!currReversed;
  };

  const useOnComplete = (fn: () => void, index?: number) => {
    const _index = typeof index !== 'undefined'
      ? mapOriginalStep[allReversed.current ? 'indexOf' : 'lastIndexOf'](index)
      : allReversed.current ? 0 : allFrame.length - 1;

    allFrame[_index].useOnComplete(fn);
  };

  return [
    result,
    {
      start,
      completed: allCompleted.current,
      paused: allPaused.current,
      reversed: allReversed.current,
      progress,
      useOnComplete,
      play, pause, reverse, seek, restart,
      nextStep
    }
  ];
};
