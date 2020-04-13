import * as React from "react";

import { effect as T, stream as S } from "@matechs/effect";
import { log, Console, provideConsole } from "@matechs/console";
import * as Rnd from "fp-ts/lib/Random";
import * as D from "fp-ts/lib/Date";
import * as IO from "fp-ts/lib/IO";

import { pipe } from "fp-ts/lib/pipeable";
import { constVoid, flow } from "fp-ts/lib/function";
import { Do } from "fp-ts-contrib/lib/Do";
import { dot } from "../../utils/getter";

import * as Canvas from "../../modules/canvas";
import * as Emitter from "../../modules/emitter";
import { fromIO, takeUntil } from "../../utils/effect";
import { tuple } from "../../utils/tuple";

/**
 * Type alias for IO
 */
type IO<A> = IO.IO<A>;

type X = number;
type Y = number;
type Radius = number;
type Angle = number;
type StartAngle = Angle;
type EndAngle = Angle;
type TimeStamp = number;

type Circle = [X, Y, Radius, StartAngle, EndAngle];
type TimeStamped = [X, Y, Radius, StartAngle, EndAngle, TimeStamp];

/**
 * ```hs
 * drawCircle :: (number, number) -> Stream Canvas never Circle
 * ```
 *
 * Draws a circle with a random radius
 */
const drawCircle = ([x, y]: [number, number]) =>
  pipe(
    // Get a random radius for the circle to draw
    Rnd.randomInt(30, 200),
    // Convert IO to Effect
    fromIO,
    // Map effect that produces a random int to an effect that draws a circle
    T.chain((r) => Canvas.circle(x, y, r)),
    // Turn the effect into a stream
    S.encaseEffect
  );

/**
 * ```hs
 * circleToTimeStamped :: Circle -> Stream NoEnv never TimeStamped
 * ```
 *
 * Draws a circle with a random radius
 */
const circleToTimeStamped = ([x, y, r, sa, ea]: Circle) =>
  S.encaseEffect(
    fromIO(
      pipe(
        // Get a timestamp using fp-ts' Date library
        D.now, // IO<number>
        // Map it to a tuple of x, y, radius, and date
        IO.map((date) => tuple(x, y, r, sa, ea, date))
      )
    )
  );

/**
 * ```hs
 * mapMouseEventToCoords :: MouseEvent -> (X, Y
 * ```
 */
const mapMouseEventToCoords = (e: MouseEvent) => tuple(e.offsetX, e.offsetY);

/**
 * ```hs
 * drawCirclesOnClick :: Effect (Console & Canvas & Emitter) never [TimeStamped]
 * ```
 *
 * Draw a circle on every mouseclick until the program is terminated by pressing 'd' or 'D'
 */
const drawCirclesOnClick = pipe(
  // Read canvas element from environment
  T.accessM((_: Canvas.Canvas) => _[Canvas.uri].canvas),
  // Turn it into a stream
  S.encaseEffect,
  // Flat map the 1 element stream containing the canvas element to a stream of mouse clicks
  S.chain((canvasEl) =>
    // encaseObservable(fromEvent<MouseEvent>(canvasEl, "click"), constVoid)
    Emitter.subscribe("click", canvasEl)
  ),
  // Take mouse clicks until the user presses d or D
  takeUntil(Emitter.waitForKeyPress(68)),
  // Map the mouse event to it's coordinates
  S.map(mapMouseEventToCoords),
  // Flat map the stream of coordinates to
  // a stream that draws a circle
  S.chain(drawCircle),
  // Turn the stream producing x, y, and radius into
  // a stream producing x, y, radius, and the timestamp the circle was drawn
  S.chain(circleToTimeStamped),
  // Turn stream into an effect of an array of values
  S.collectArray,
  T.chain((output) => T.as(log("Done drawing!"), output))
);

/**
 * ```hs
 * circles2effects :: [TimeStamped] -> Effect Canvas never any
 * ```
 *
 * Fold a list of timestamped circles into a single effect that draws them to canvas.
 *
 */
const circles2effects = (timestampedCircles: TimeStamped[]) =>
  timestampedCircles
    .reduce((acc, next, index) => {
      // DeterminE the number of milliseconds the program should
      // delay drawing the next circle based on the previous
      // circle's timestamp.
      const prev = timestampedCircles[index - 1];
      const ms = prev ? (next[5] - prev[5]) / 2 : 0;

      // Create an effect that redraws the circle after a delay
      acc.push(
        T.delay(Canvas.circle(next[0], next[1], next[2], next[3], next[4]), ms)
      );
      return acc;
    }, [] as Array<ReturnType<typeof Canvas.circle>>)
    // Turn the list of effects into a single chained effect (andThen)
    .reduce((a, b) =>
      pipe(
        a,
        T.chain(() => b)
      )
    );

/**
 * ```hs
 * redrawCircles :: [TimeStamped] -> Effect (Emitter & Console & Canvas) never void
 * ```
 */
const redrawCircles = (circles: TimeStamped[]) => {
  const p1 = Do(T.effect)
    // Wait for the user to press r or R (replay)
    // .do(Emitter.waitForKeyPress(82))
    .do(log("Replaying..."))
    // Clear the canvas
    .do(Canvas.clear)
    .do(
      // Flat map the list of circle coordinates and dates to
      // a program that redraws the circles in the same amount of time
      circles2effects(circles)
    )
    .return(constVoid);

    return T.zip(
        Emitter.waitForKeyPress(82),
        T.forever(T.race(Emitter.waitForKeyPress(82), p1))
    )
    
};

const drawAndRedraw = Do(T.effect)
  // Let the user draw circles until they press d or D
  .bind("circles", drawCirclesOnClick)
  .doL(
    flow(dot("circles"), (circles) =>
      redrawCircles(circles)
    )
  )
  .done();

export const main: T.Effect<
  Canvas.Canvas & Console & Emitter.Emitter,
  never,
  void
> = Do(T.effect)
  // Spawn a program that allows the user to draw circles and replay their drawing
  .bind("fiber", T.fork(drawAndRedraw))
  // Wait for the user to press x or X to cancel
  .do(Emitter.waitForKeyPress(88))
  // Interrupt the fiber
  .doL(({ fiber }) => fiber.interrupt)
  // Clear the canvas
  .do(Canvas.clear)
  // Reboot
  .doL(() => main)
  .return(constVoid);

export const useCircles = (
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>
) =>
  React.useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");

      if (ctx) {
        pipe(
          main,
          T.provideS(Emitter.makeEmitterLive(document)),
          T.provideS(Canvas.makeCanvasLive(ctx)),
          provideConsole,
          T.run
        );
      }
    }
  }, [canvasRef]);
