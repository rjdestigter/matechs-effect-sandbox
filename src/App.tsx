import "./App.scss";

import React from "react";
import { tuple } from "./utils/tuple";
import * as Circles from './apps/circles'

// Hooks
const useCanvasRef = () => React.useRef<HTMLCanvasElement | null>(null);
const useSizeState = () => React.useState(tuple(0, 0));

const useCanvas = () => {
  const ref = useCanvasRef()
  const [[width, height], setSize] = useSizeState()

  React.useEffect(() => {
    setTimeout(() => {
      if (ref.current && ref.current.parentElement) {
        console.log(ref.current.parentElement.getBoundingClientRect());
        const {
          width,
          height,
        } = ref.current.parentElement.getBoundingClientRect();
        setSize(tuple(width, height));
      }
    }, 1);
  }, [ref, setSize]);
  
  return tuple(<canvas height={height} width={width} ref={ref}></canvas>, ref)
}

function App() {
  const [canvas, ref] = useCanvas()
  Circles.useCircles(ref)

  return (
    <div id="app">
      <section>
        {canvas}
      </section>
      <footer>
        <ul>
          <li>
            Press <strong>1</strong> to enter "circles" mode. Once in this mode you can click anywhere to draw a random circle.
            <ul>
              <li>
                Press <strong>S</strong> or <strong>X</strong> to cancel. You will be taken back to main mode.
              </li>
            </ul>
          </li>
          <li>
            Press <strong>2</strong> to enter "markers" mode. Once in this mode you can click anywhere to draw a yellow marker.
            <ul>
              <li>
                Press <strong>S</strong> or <strong>X</strong> to cancel. You will be taken back to main mode.
              </li>
            </ul>
          </li>
          <li>
            Press <strong>X</strong> while in <i>main</i> mode to clear the canvas.
          </li>
        </ul>
        <p>
          Circles have a random radius, start angle, end angle, color and border color.
        </p>
      </footer>
    </div>
  );
}

export default App;
