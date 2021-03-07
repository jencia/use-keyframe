import React from 'react';
import { useKeyframe, useTimeline } from '../../';
import mdx from './useTimeline.mdx';

export default {
  title: 'core|useTimeline',
  parameters: {
    docs: { page: mdx }
  }
}

export const Syntax = () => '';

export const Demo1 = () => {
  const [x, frame] = useTimeline([
    [useKeyframe(200), 200],
    [useKeyframe(1000), 100],
    [useKeyframe(300), 200],
  ]);

  return (
    <>
      <div
        className="ball"
        style={{ transform: `translateX(${x}px)` }}
      />
      <p><button onClick={frame.play}>动起来</button></p>
    </>
  );
};

export const Demo2 = () => {
  const [{ x, y, rotate }, timeline] = useTimeline([
    [useKeyframe(1500, 'inQuint'), { x: 500 }],
    [useKeyframe(1000, 'linear'), { x: -300, y: 100, rotate: -360 }],
  ]);

  timeline.useOnComplete(() => {
    console.log('animate completed');
  })

  return (
    <div>
      <div
        className="box"
        style={{ transform: `translate(${x}px, ${y}px) rotate(${rotate}deg)` }}
      />
      <ul>
        {/* <li>elapsed: {n}</li> */}
        <li>paused: {timeline.paused.toString()}</li>
        <li>reversed: {timeline.reversed.toString()}</li>
        <li>completed: {timeline.completed.toString()}</li>
      </ul>
      <div>
        <input
          type="range"
          min={0} max={1} step={0.01}
          value={timeline.progress}
          onChange={e => timeline.seek(+e.target.value)}
        />
        {Math.floor(timeline.progress * 1e4) / 1e2}%
      </div>
      <button onClick={timeline.play}>play</button>
      <button onClick={timeline.reverse}>reverse</button>
      <button onClick={timeline.pause}>pause</button>
      <button onClick={timeline.restart}>restart</button>
      <br />
      <button onClick={() => timeline.nextStep()}>nextStep</button>
      <button onClick={() => timeline.nextStep(1, true)}>reverse nextStep</button>
    </div>
  );
};
