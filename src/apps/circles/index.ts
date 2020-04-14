import * as React from "react";

import { effect as T, stream as S, ref } from "@matechs/effect";
import { provideConsole } from "@matechs/console";
import * as Rnd from "fp-ts/lib/Random";
import * as A from "fp-ts/lib/Array";

import { pipe } from "fp-ts/lib/pipeable";
import { flow, identity } from "fp-ts/lib/function";
import { Do } from "fp-ts-contrib/lib/Do";
import { dot } from "../../utils/getter";

import * as Canvas from "../../modules/canvas";
import * as Emitter from "../../modules/emitter";
import { fromIO, takeUntil } from "../../utils/effect";
import { tuple } from "../../utils/tuple";
import { charCodeAt } from "../../utils/string";

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
 * randomCircle :: (number, number) -> Stream Canvas never Circle
 * ```
 *
 * Draws a circle with a random radius
 */
const randomCircle = ([x, y]: [X, Y]) =>
  pipe(
    // Get a random radius for the circle to draw
    Rnd.randomInt(30, 200),
    // Convert IO to Effect
    fromIO,
    // Map effect that produces a random int to an effect that draws a circle
    T.chain((r) => Canvas.circle(x, y, r))
    // Turn the effect into a stream
  );

/**
 * ```hs
 * mapMouseEventToCoords :: MouseEvent -> (X, Y
 * ```
 */
const mapMouseEventToCoords = (e: MouseEvent) => tuple(e.offsetX, e.offsetY);

const makeOnClick = (
  makeEffect: ([x, y]: [X, Y]) => T.Effect<
    Canvas.Canvas,
    never,
    Canvas.Instruction[]
  >
) =>
  pipe(
    // Read canvas element from environment
    T.accessM((_: Canvas.Canvas) => _[Canvas.uri].canvas),
    // Turn it into a stream
    S.encaseEffect,
    // Flat map the 1 element stream containing the canvas element to a stream of mouse clicks
    S.chain((canvasEl) =>
      // encaseObservable(fromEvent<MouseEvent>(canvasEl, "click"), constVoid)
      Emitter.subscribe("click", canvasEl)
    ),
    //   // Take mouse clicks until the user presses d or D
    //   takeUntil(Emitter.waitForKeyPress(68)),
    // Map the mouse event to it's coordinates
    S.map(mapMouseEventToCoords),
    // Flat map the stream of coordinates to
    // a stream that draws a circle
    S.chain(flow(makeEffect, S.encaseEffect))
  );

/**
 * ```hs
 * drawCirclesOnClick :: Effect (Console & Canvas & Emitter) never [TimeStamped]
 * ```
 *
 * Draw a circle on every mouseclick until the program is terminated by pressing 'd' or 'D'
 */
const drawCirclesOnClick = makeOnClick(randomCircle);

const marker = ([x, y]: [number, number]) =>
  T.accessM((_: Canvas.Canvas) => {
    const ctx = _[Canvas.uri];

    return pipe(
      [
        ctx.beginPath,
        ctx.arc(x, y, 20, 0, Math.PI * 2),
        ctx.strokeStyle("#000000"),
        ctx.fillStyle("Yellow"),
        ctx.lineWidth(2),
        ctx.stroke,
        ctx.fill,
      ],
      A.array.sequence(T.effect)
    );
  });

const drawMarkerOnClick = makeOnClick(marker);

const makeWaitForMenuChoice = (menuCodes: number[]) =>
  pipe(
    Emitter.subscribe("keyup"),
    S.map(dot("keyCode")),
    S.filter(menuCodes.includes.bind(menuCodes)),
    S.take(1),
    S.collectArray,
    T.map(([keyCode]) => keyCode),
    T.map(String.fromCharCode)
  );

const waitForMainMenuChoice = pipe(
  ["1", "2", "R", "X"],
  A.map(charCodeAt(0)),
  makeWaitForMenuChoice
);

const waitForToolMenuChoice = pipe(
  ["S", "X"],
  A.map(charCodeAt(0)),
  makeWaitForMenuChoice
);

const makeDoUntilMenuChoice = <R, E, A>(
  effect: S.Stream<R, E, Canvas.Instruction[]>
) =>
  pipe(
    // Run 2 effects in parallell
    T.parZip(
      // One that runs the effect until a menu choice (S or X) is pressed
      pipe(
        effect,
        takeUntil(waitForToolMenuChoice),
        S.collectArray,
        T.map(A.chain(identity))
      ),
      // And second the menu choice itself
      waitForToolMenuChoice
    ),
    // If the menu choice was X return an empty list of instructions otherwise return instructions.
    T.map(([instructions, code]) => (code === "S" ? instructions : []))
  );

/**
 * Main program
 */
const main = Do(T.effect)
  // Create a ref that stores canvas drawings as serializable instructions.
  .bind(
    "stateRef",
    ref.makeRef({
      instructions: [] as Canvas.Instruction[],
    })
  )
  .doL(({ stateRef }) =>
    // Use the ref in a program that runs forever.,
    T.forever(
      Do(T.effect)
        // Clear the canvas on every run.
        .do(Canvas.clear)
        // Convert the instructions in state to effects that draw onto the canvas.
        .do(
          pipe(
            stateRef.get,
            T.chain((state) => Canvas.parseInstructions(state.instructions))
          )
        )
        // Wait for the user to make a choice (1, 2, or X)
        .bind("mainMenuChoice", waitForMainMenuChoice)
        // Allow the user to draw on canvas or clear it if the choice was X
        .bindL("additionalInstructions", ({ mainMenuChoice }) => {
          switch (mainMenuChoice) {
            case "1":
              return makeDoUntilMenuChoice(drawCirclesOnClick);
            case "2":
              return makeDoUntilMenuChoice(drawMarkerOnClick);
            case "X":
              // Empty the instructions in state
              return T.as(
                stateRef.update(() => ({ instructions: [] })),
                []
              );
            default:
              return T.pure([]);
          }
        })
        // Update state and add the new set of instructions to the current set
        .doL(({ additionalInstructions }) =>
          stateRef.update((current) => {
            return {
              instructions: current.instructions.concat(additionalInstructions),
            };
          })
        )
        .done()
    )
  )
  .done();

export const useCircles = (
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>
) =>
  React.useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");

      if (ctx) {
        pipe(
          // Run the main program
          main,
          // Provide Emitter which adds support for listening to mouse clicks and keyboard presses
          T.provideS(Emitter.makeEmitterLive(document)),
          // Provide the canvas 2d context
          T.provideS(Canvas.makeCanvasLive(ctx)),
          // Provide console logging capabilities
          provideConsole,
          T.run
        );
      }
    }
  }, [canvasRef]);
