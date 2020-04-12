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
// Canvas
const canvasUri = Symbol();

interface Canvas {
  [canvasUri]: CanvasRenderingContext2D;
}

const circle = (x: number, y: number, r: number) =>
  T.accessM((_: Canvas) =>
    T.sync(() => {
      _[canvasUri].beginPath();
      _[canvasUri].arc(x, y, r, 0, Math.PI * 2);
      _[canvasUri].stroke();
      return tuple(x, y, r);
    })
  );

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
  T.accessM((_: Canvas) => T.pure(_[canvasUri].canvas)),
  S.encaseEffect,
  S.chain((canvasEl) =>
    encaseObservable(fromEvent<MouseEvent>(canvasEl, "click"), constVoid)
  ),
  takeUntil(waitForKeyPress(68)),
  S.map((e) => tuple(e.offsetX, e.offsetY)),
  S.chain(([x, y]) =>
    pipe(
      Rnd.randomInt(30, 200),
      fromIO,
      T.chain((r) => circle(x, y, r)),
      S.encaseEffect
    )
  ),
  S.chain(([x, y, r]) =>
    S.encaseEffect(
      fromIO(
        pipe(
          D.now,
          IO.map((date) => tuple(x, y, r, date))
        )
      )
    )
  ),
  S.collectArray,
  T.chain((output) => T.as(log("Done drawing!"), output))
);

const programC = Do(T.effect)
  .bind("circles", drawCirclesOnClick)
  .do(waitForKeyPress(82))
  .do(log("Replaying.."))
  .do(clear)
  .doL(
    flow(dot("circles"), (circles) =>
      circles
        .reduce((acc, next, index) => {
          const prev = circles[index - 1];
          const ms = prev ? next[3] - prev[3] : 0;
          console.log(ms);
          acc.push(T.delay(circle(next[0], next[1], next[2]), ms));
          return acc;
        }, [] as Array<ReturnType<typeof circle>>)
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
          .bind("fiber", T.fork(programC))
          .do(waitForKeyPress(88))
          .doL(({ fiber }) => fiber.interrupt)
          .doL(dot2("fiber", "interrupt"))
          .do(clear)
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
