import React, { useState, useEffect } from 'react';
import useKeyframe from '.';
import { easing } from 'ts-easing';
import mdx from './useKeyframe.mdx';

export default {
  title: 'core|useKeyframe',
  parameters: {
    docs: { page: mdx }
  }
}

export const Syntax = () => '';

export const Demo1 = () => {
  const [n, frame] = useKeyframe(2000);

  return (
    <>
      <div
        className="ball"
        style={{ transform: `translateX(${n * 300}px)` }}
      />
      <p><button onClick={frame.play}>动起来</button></p>
    </>
  );
};

export const Demo2 = () => {
  const [n, frame] = useKeyframe(2000);

  useEffect(frame.play, []);

  frame.useOnComplete(() => {
    frame.start(!frame.reversed);
  })

  return (
    <div
      className="ball"
      style={{ transform: `translateX(${n * 300}px)` }}
    />
  );
};

export const Demo3 = () => {
  const [easingName, setEasingName] = useState('linear');
  const [n, frame] = useKeyframe(2000, easingName);

  frame.useOnComplete(() => {
    console.log('animate completed');
  })

  return (
    <div>
      <div
        className="ball"
        style={{ transform: `translateX(${n * 500}px)` }}
      />
      <ul>
        <li>elapsed: {n}</li>
        <li>paused: {frame.paused.toString()}</li>
        <li>reversed: {frame.reversed.toString()}</li>
        <li>completed: {frame.completed.toString()}</li>
        <li>
          easing：
          <select
            value={easingName}
            onChange={e => {
              setEasingName(e.target.value);
              frame.restart();
            }}
          >
            {Object.keys(easing).map(key => (
              <option key={key} value={key}>{key}</option>
            ))}
          </select>
        </li>
      </ul>
      <div>
        <input
          type="range"
          min={0} max={1} step={0.01}
          value={frame.progress}
          onChange={e => frame.seek(+e.target.value)}
        />
        {Math.floor(frame.progress * 1e4) / 1e2}%
      </div>
      <button onClick={frame.play}>play</button>
      <button onClick={frame.reverse}>reverse</button>
      <button onClick={frame.pause}>pause</button>
      <button onClick={frame.restart}>restart</button>
    </div>
  );
};
