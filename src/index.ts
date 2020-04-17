import "./index.scss";
import "./App.scss";
import * as serviceWorker from "./serviceWorker";

import * as Circles from "./apps/circles";
import { parentElement, mapDocument, documentUri, $ } from "./modules/dom";
import { pipe } from "fp-ts/lib/pipeable";

import { effect as T, stream as S } from "@matechs/effect";
import * as O from "fp-ts/lib/Option";
import { constVoid, flow, identity, constant } from "fp-ts/lib/function";
import { snd } from "fp-ts/lib/ReadonlyTuple";
import { makeEmitterLive, subscribe } from "./modules/emitter";
import { makeCanvasLive } from "./modules/canvas";
import { provideConsole } from "@matechs/console";

const voidEffect = flow(constVoid, T.pure);

const program = mapDocument(doc =>
  pipe(
    $("canvas"),
    T.chain(canvasO =>
      pipe(
        canvasO,
        O.fold(voidEffect, canvas =>
          pipe(
            canvas,
            parentElement,
            O.fold(voidEffect, parent =>
              pipe(
                T.zip(
                  pipe(
                    T.sync(() => {
                      const { width, height } = parent.getBoundingClientRect();
                      canvas.width = width;
                      canvas.height = height;

                      // Dirty but seems to be the only solution to
                      // preventing text selection from happening when
                      // clicking fast on the canvas.
                      // Using addEventListener doesn't work
                      // See https://stackoverflow.com/questions/3799686/clicking-inside-canvas-element-selects-text
                      canvas.onmousedown = constant(false)
                      return canvas
                    }),
                    // T.map(subscribe('mousedown', false)),
                    // T.map(S.drain),
                    // T.map(T.fork),
                    // T.chain(identity),
                    T.chain(_ => Circles.main),
                    T.provideS(makeEmitterLive(doc)),
                    T.provideS(makeCanvasLive(canvas.getContext("2d")!))
                  ),
                  voidEffect()
                ),
                T.map(snd)
              )
            )
          )
        )
      )
    )
  )
);

pipe(
  pipe(program, T.chain(identity)),
  T.provideS({ [documentUri]: document }),
  provideConsole,
  T.run,
);

// ReactDOM.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>,
//   document.getElementById("root")
// );

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
