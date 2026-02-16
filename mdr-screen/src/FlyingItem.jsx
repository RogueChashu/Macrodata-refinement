import { useSpring, animated } from 'react-spring';

function FlyingItem({ id, value, scale, startRect, endRect, onComplete }) {
  const props = useSpring({
    from: {
      position: 'fixed', // element now positioned relative to the viewport.
      left: `${startRect.left}px`,
      top: `${startRect.top}px`,
      width: `${startRect.width}px`,
      height: `${startRect.height}px`,
      transform: `scale(${scale})`,
    },
    to: {
      left: `${endRect.left}px`,
      top: `${endRect.top}px`,
      width: `${endRect.width}px`,   
      height: `${endRect.height}px`,
      transform: 'scale(1.75)',
    },
    delay: 1100 ,
    config: { duration: 1500, },
    onRest: () => onComplete(id), // cleanup function when done
  });

  return (
    <animated.div
      style={{
        position: 'fixed',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        willChange: 'transform, top, left, width, height',
        ...props
      }}
    >
      {value}
    </animated.div>
  );
}
export default FlyingItem
