import useKeyframe from '../useKeyframe';

type currDataType = number|object|((sum: number) => (n: number, i: number, sum: object|number) => number);

// 获取目标值对应当前的值，任意类型转成只有数字和object类型
export function getCurrData (value: any, index: number, n: number, mapOriginalStep: number[], zIndex: number = 0): currDataType {
  // 暂不支持对象有两层或以上的数据
  if (zIndex > 2) {
    return 0;
  }
  switch (typeof value) {
    case 'number':
      return n * value;
    case 'string':
      if (!isNaN(Number(value))) {
          return n * (+value);
      } else {
          return n;
      }
    case 'function':
      return zIndex === 0 ?
        (sum: object|number) => value(n, mapOriginalStep[index], sum) :
        value(n, mapOriginalStep[index]);
    case 'object':
      Object.keys(value).forEach(key => {
          value[key] = getCurrData(value[key], index, n, mapOriginalStep, zIndex + 1);
      });
      return value;
    default:
      return n;
  }
}

// 各个阶段的值相加
export function getNumSummation (sum:object, targetData:object|((sum:object) => any)):object {
  // 将对象各个属性值与sum对象累加
  const summation = (v: object) => {
    Object.keys(v).forEach(key => {
      sum[key] = (sum[key] || 0) + v[key];
    });
  };

  if (typeof targetData === 'object') {
    summation(targetData);
  } else {
    // 是否是由数字类型转过来的对象
    const isNumObj = (v: object) => (Object.keys(v).length === 1 && sum['__value']);
    const data = targetData(isNumObj(sum) ? sum['__value'] : sum);

    switch (typeof data) {
      case 'number':
        sum['__value'] = (sum['__value'] || 0) + data;
        break;
      case 'string':
        sum['__value'] = (sum['__value'] || 0) + (+data || 0);
        break;
      case 'object':
        summation(data);
        break;
      default:
    }
  }
  return sum;
}

// 通过在前面插入空的useRafFn来实现可监控延迟
export function useAllDelayKeyframe (keyframe: keyframeType[], delayList: number[]): [keyframeType[], number[], number[]] {
  const allDelayKeyframe = [...keyframe];
  const mapOriginalStep = keyframe.map((_, i) => i);
  const stepCountList = keyframe.map(() => 1);

  for (let i = allDelayKeyframe.length - 1; i >= 0; i--) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const delayRafFn = useKeyframe(delayList[i]);

    if (delayList[i] > 0) {
      allDelayKeyframe.splice(i, 0, [delayRafFn, 0]);
      mapOriginalStep.splice(i, 0, i);
      stepCountList[i] = 2;
    }
  }

  return [
    allDelayKeyframe, // 对useKeyframe处理后的值
    mapOriginalStep,  // 原始步数位置映射，如果原来是[0, 1, 2]，前两个阶段加了延迟就变成[0, 0, 1, 1, 2]
    stepCountList     // 每个阶段各需要走几步才能完成阶段动画，有延迟是2步，没有则为1步
  ];
}
