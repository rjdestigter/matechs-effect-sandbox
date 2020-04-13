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
            Press <i>x</i> to reset.
          </li>
          <li>
            Press <i>d</i> to commit.
          </li>
          <li>
            Press <i>r</i> to replay <i>(after commiting.)</i>.
          </li>
        </ul>
        <p>
          You can redraw as many times as you want after committing. Size and
          coordinates are preserved. Colours are not. Redrawing happens at twice
          the speed you drew.
        </p>
      </footer>
    </div>
  );
}

export default App;
