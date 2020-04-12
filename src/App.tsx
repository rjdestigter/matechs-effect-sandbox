import { effect as T, stream as S, ref as R } from "@matechs/effect";
import { log, Console, provideConsole } from "@matechs/console";
import * as E from "fp-ts/lib/Either";
import * as Rnd from "fp-ts/lib/Random";
import * as D from "fp-ts/lib/Date";
import * as O from "fp-ts/lib/Option";
import * as IO from "fp-ts/lib/IO";

import React from "react";
import "./App.scss";
import { pipe } from "fp-ts/lib/pipeable";
import { fromEvent } from "rxjs";
import { encaseObservable } from "@matechs/rxjs";
import { constVoid, constant, flow } from "fp-ts/lib/function";
import { Do } from "fp-ts-contrib/lib/Do";
import { dot2, dot } from "./utils/getter";
import { fst, snd } from "fp-ts/lib/ReadonlyTuple";
import { result } from "@matechs/effect/lib/effect";

type IO<A> = IO.IO<A>;

const tuple = <T extends any[]>(...ts: T) => ts;

/**
 * Take elements from a stream until a given effect resolves.
 *
 * @param until The effect that will terminate the stream
 * @param stream The stream
 */
function takeUntil_<R1, E1, R2, E2, A>(stream: S.Stream<R1, E1, A>, until: T.Effect<R2, E2, any>) {
  type Wrapped = { type: "until" } | { type: "stream"; value: A };

  const wrappedUntil = S.as<Wrapped>({ type: "until" })(S.encaseEffect(until));

  const wrappedStream = pipe(
    stream,
    S.map((value): Wrapped => ({ type: "stream", value }))
  );

  return pipe(
    S.mergeAll([wrappedUntil as any, wrappedStream as any] as S.Stream<R1 & R2, E1 | E2, Wrapped>[]),
    S.takeWhile((wrapped) => wrapped.type === "stream"),
    S.filter((wrapped): wrapped is Extract<Wrapped, { type: "stream" }> => wrapped.type === "stream"),
    S.map((wrapped) => (wrapped as Extract<Wrapped, { type: "stream" }>).value)
  );
}

export function takeUntil<R2, E2>(until: T.Effect<R2, E2, any>) {
  return function<R1, E1, A>(s: S.Stream<R1, E1, A>) {return  takeUntil_(s, until);}
}

function fromIO<T>(io: IO<T>) {
  return T.sync(() => io());
}

// Emitter

const emitterURI = Symbol()

interface Emitter {
  [emitterURI]: {
    addEventListener: (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => T.Effect<T.NoEnv, never, void>;
    removeEventListener: (type: string, listener: EventListenerOrEventListenerObject) => T.Effect<T.NoEnv, never, void>;
  }
}

// Canvas
const canvasUri = Symbol();

interface Canvas {
  [canvasUri]: CanvasRenderingContext2D;
}

/**
 * circle :: number -> number -> number -> Effect Canvas never (number, number, number)
 * 
 * Draws a circle on the canvas. X, y, and radius are returned again.
 */
const circle = (x: number, y: number, r: number) =>
  T.accessM((_: Canvas) =>
    T.sync(() => {
      _[canvasUri].beginPath();
      _[canvasUri].arc(x, y, r, 0, Math.PI * 2);
      _[canvasUri].stroke();
      return tuple(x, y, r);
    })
  );

/**
 * clear :: T.Effect Canvas never void
 * 
 * Clears a canvas
 */
const clear = T.accessM((_: Canvas) =>
  T.sync(() => {
    _[canvasUri].clearRect(
      0,
      0,
      _[canvasUri].canvas.width,
      _[canvasUri].canvas.height
    );
  })
);

/**
 * waitForKeyPress :: number -> Effect NoEnv never void
 * 
 * Given a keyCode returns an effect that resolves once the user
 * presses a key on the keyboard matching the key code.
 */
const waitForKeyPress = (keyCode: number): T.Effect<T.NoEnv, never, void> =>
  T.async<never, void>((r) => {
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.keyCode === keyCode) {
        document.removeEventListener("keyup", onKeyUp);
        r(E.right(undefined));
      }
    };

    document.addEventListener("keyup", onKeyUp);

    return (cb) => {
      document.removeEventListener("keyup", onKeyUp);
      cb();
    };
  });

const drawCirclesOnClick = pipe(
  // Read canvas element from environment
  T.accessM((_: Canvas) => T.pure(_[canvasUri].canvas)),
  // Turn it into a  stream
  S.encaseEffect,
  // Flat map the 1 element stream containing the canvas element to a stream of mouse clicks
  S.chain((canvasEl) =>
    encaseObservable(fromEvent<MouseEvent>(canvasEl, "click"), constVoid)
  ),
  // Take mouse clicks until the user presses d or D
  takeUntil(waitForKeyPress(68)),
  // Map the mouse event to it's coordinates
  S.map((e) => tuple(e.offsetX, e.offsetY)),
  // Flat map the stream of coordinates to
  /// a stream that draws a circle
  S.chain(([x, y]) =>
    pipe(
      // Get a random radius for the circle to draw
      Rnd.randomInt(30, 200),
      // Convert IO to Effect
      fromIO,
      // Map effect that produces a random int to an effect that draws a circle
      T.chain((r) => circle(x, y, r)),
      // Turn the effect into a stream
      S.encaseEffect
    )
  ),
  // Turn the stream producing x, y, and radius into
  // a stream producing x, y, radius, and the timestamp the circle was drawn
  S.chain(([x, y, r]) =>
    S.encaseEffect(
      fromIO(
        pipe(
          // Get the timestamp
          D.now, // IO<number>
          // Map it to a tuple of x, y, radius, and date
          IO.map((date) => tuple(x, y, r, date))
        )
      )
    )
  ),
  // Turn stream into an effect of an array of values
  S.collectArray,
  T.chain((output) => T.as(log("Done drawing!"), output))
);

const programC = Do(T.effect)
  // Let the user draw circles until they press d or D
  .bind("circles", drawCirclesOnClick)
  // Wait for the user to press r or R (replay)
  .do(waitForKeyPress(82))
  .do(log("Replaying.."))
  // Clear the canvas
  .do(clear)
  .doL(
    // Flat map the list of circle coordinates and dates to
    // a program that redraws the circles in the same amount of time
    flow(dot("circles"), (circles) =>
      circles
        .reduce((acc, next, index) => {
          // Determin the number of milliseconds the program should
          // delay drawing the next circle based on the previous
          // circle's timestamp.
          const prev = circles[index - 1];
          const ms = prev ? next[3] - prev[3] : 0;
          
          // Create an effect that redraws the circle after a delay
          acc.push(T.delay(circle(next[0], next[1], next[2]), ms));
          return acc;
        }, [] as Array<ReturnType<typeof circle>>)
        // Turn the list of effects into a single chained effect (andThen)
        .reduce((a, b) =>
          pipe(
            a,
            T.chain(() => b)
          )
        )
    )
  )
  .done();

function App() {
  const ref = React.useRef<HTMLCanvasElement | null>(null);
  const [[width, height], setSize] = React.useState(tuple(0, 0));

  React.useEffect(() => {
    setTimeout(() => {
      if (ref.current && ref.current.parentElement) {
        const {
          width,
          height,
        } = ref.current.parentElement.getBoundingClientRect();
        setSize(tuple(width, height));
      }
    }, 1);
  }, []);

  React.useEffect(() => {
    if (ref.current) {
      const ctx = ref.current.getContext("2d");

      if (ctx) {
        const program: T.Effect<Canvas & Console, never, void> = Do(T.effect)
          // Spawn a program that allows the user to draw circles and replay their drawing
          .bind("fiber", T.fork(programC))
          // Wait for the user to press x or X to cancel
          .do(waitForKeyPress(88))
          // Interrupt the fiber
          .doL(({ fiber }) => fiber.interrupt)
          // Clear the canvas
          .do(clear)
          // Reboot
          .doL(() => program)
          .return(constVoid);

        pipe(program, T.provideS({ [canvasUri]: ctx }), provideConsole, T.run);
      }
    }
  }, []);

  return (
    <div className="App">
      <canvas height={height} width={width} ref={ref}></canvas>
    </div>
  );
}

export default App;
