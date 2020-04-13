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
            Click anywhere on the canvas to draw a circle with a random.
          </li>
          <li>
            Press <i>x</i> to reset.
          </li>
          <li>
            Press <i>d</i> to commit.
          </li>
          <li>
            Press <i>r</i> to replay <i>(after commiting.)</i>.
          </li>
          <li>
            Press <i>r</i> again while replaying to cancel and restart.
          </li>
        </ul>
        <p>
          You can redraw as many times as you want once a drawing has been comitted. Size and
          coordinates are preserved. Colours are not. Redrawing happens at twice.          
        </p>
        <p>
          Circles have a random radius, start angle, end angle, color and border color.
        </p>
      </footer>
    </div>
  );
}

export default App;
