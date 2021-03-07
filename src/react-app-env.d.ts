/// <reference types="react-scripts" />
declare module '*.mdx';
declare interface frameType {
  completed: boolean,
  paused: boolean,
  reversed: boolean,
  progress: number,
  start: (isReverse?: boolean) => void,
  play: () => void,
  pause: () => void,
  restart: () => void,
  seek: (currentElapsed: number, isReverse?: boolean) => void,
  reverse: () => void,
  useOnComplete: (fn: () => void) => void
};
declare interface timelineType extends frameType {
  start: (isReverse?: boolean, stepCount?: number) => void,
  nextStep: (stepCount?: number, isReverse?: boolean) => void
}
declare type keyframeType = [[number, frameType], any, any?];
