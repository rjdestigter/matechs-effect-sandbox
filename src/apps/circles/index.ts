import * as React from "react";

import { effect as T, stream as S, ref } from "@matechs/effect";
import { provideConsole } from "@matechs/console";
import * as Rnd from "fp-ts/lib/Random";
import * as A from "fp-ts/lib/Array";
import * as O from "fp-ts/lib/Option";

import { pipe } from "fp-ts/lib/pipeable";
import { flow, identity, constant } from "fp-ts/lib/function";
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
    T.chain((r) => Canvas.circle(x, y, r)),
    T.map((instructions) => Canvas.group(instructions))
  );

/**
 * ```hs
 * mapMouseEventToCoord :: MouseEvent -> (X, Y
 * ```
 */
const mapMouseEventToCoord = (e: MouseEvent) => tuple(e.offsetX, e.offsetY);

const makeOnClick = <R, E, A>(
  makeEffect: ([x, y]: [X, Y]) => T.Effect<R, E, A>
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
    S.map(mapMouseEventToCoord),
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

/**
 * Draw a marker
 */
const marker = ([x, y]: [number, number]) =>
  Canvas.accessContext((ctx) =>
    pipe(
      [
        ctx.beginPath,
        ctx.arc(x, y, 3, 0, Math.PI * 2),
        ctx.strokeStyle("#000000"),
        ctx.fillStyle("#ffffff"),
        ctx.lineWidth(2),
        ctx.stroke,
        ctx.fill,
      ],
      A.array.sequence(T.effect),
      T.map(Canvas.group)
    )
  );

const drawMarkerOnClick = makeOnClick(marker);

/**
 * Take one element from a stream and return it as an effect.
 */
const takeOne = <R, E, A>(stream: S.Stream<R, E, A>) =>
  pipe(
    stream,
    S.take(1),
    S.collectArray,
    T.map(([a]) => a)
  );

const polygonCoordinates2Effect = ([h, ...t]: [number, number][]) =>
  pipe(
    A.array.sequence(T.effect)(
      pipe([
        Canvas.beginPath,
        Canvas.lineWidth(1),
        Canvas.accessContext(ctx => ctx.strokeStyle('#000')),
        // Move the cursor the head of the set of coordinates.
        Canvas.moveTo(h),
        // From there draw a line to every next coordinate
        ...t.map(Canvas.lineTo),
        Canvas.closePath,
        Canvas.stroke,
        // Draw a marker for the head position
        marker(h),
        // And every other.
        ...t.map(marker),
      ])
    ),
    T.map(Canvas.group)
  );

/**
 * Let the user draw a polygon.
 * @param onState The current state of the canvas. This is needed to redraw it on every mouse move.
 */
const drawPolygon = (currentState: Canvas.Instruction[]) => {
  // Effect that will restore the canvas to it's original
  const restoreCanvas = pipe(
    currentState,
    A.map(Canvas.parseInstruction),
    A.array.sequence(T.effect)
  );

  return pipe(
    // Create a ref to store the coordinates of the new polygon in.

    ref.makeRef({
      coords: [] as [number, number][],
      instructionGroup: O.none as O.Option<Canvas.InstructionGroup>,
    }),
    S.encaseEffect,
    S.chain((polygonRef) =>
      //   T.zip(
      pipe(
        // Wait for the user to assign the first coordinate by clicking on the canvas.
        takeOne(Emitter.subscribe("click")),
        T.map(mapMouseEventToCoord),
        // Store the first coordinate using the reference
        T.chain((coord) =>
          polygonRef.set({ coords: [coord], instructionGroup: O.none })
        ),
        // Continue as a stream
        S.encaseEffect,
        S.chain(
          constant(
            pipe(
              // Race between mousemove and click
              T.race(
                takeOne(Emitter.subscribe("click")),
                takeOne(Emitter.subscribe("mousemove"))
              ),
              // Chain mousevent to drawing the polygon
              T.chain((event) =>
                pipe(
                  event,
                  mapMouseEventToCoord,
                  (coord) =>
                    event.type === "click"
                    // If click won the race, update the reference with the new coordinate
                      ? pipe(
                          polygonRef.update(({ coords, instructionGroup }) => ({
                            coords: [...coords, coord],
                            instructionGroup,
                          })),
                          // Retain the set of coordinates from the update
                          T.map(dot("coords"))
                        )
                        // If mousemove won the race, get the coordiantes from the reference
                        // and concat the "move" coordinate.
                      : pipe(
                          polygonRef.get,
                          T.map(({ coords }) => [...coords, coord])
                        ),
                        // Retain the coordinates to be drawn with the event type
                  T.map((coords) => tuple(event.type, coords))
                )
              ),
              T.chain(([eventType, coords]) =>
                Do(T.effect)
                // Clear the canvas
                  .do(Canvas.clear)
                  // Restore what was already previously drawn
                  .do(restoreCanvas)
                  // Draw the polygon and stream the instructions
                  .bind(
                    "polygonInstructions",
                    polygonCoordinates2Effect(coords)
                  )
                  // Update the reference to the instructions
                  .doL(({ polygonInstructions }) =>
                    eventType === "click" && coords.length > 2
                      ? polygonRef.update(({ coords, instructionGroup }) => ({
                          coords,
                          instructionGroup: O.some(polygonInstructions),
                        }))
                      : T.pure(1)
                  )
                  .done()
              ),
              S.encaseEffect,
              // Rinse and repeat the race
              S.repeat,
            )
          )
        ),
        // The stream output is the instruction group collected on the reference
        S.chain(constant(pipe(
            polygonRef.get,
            T.map(dot('instructionGroup')),
            S.encaseEffect
        ))),
      )
    )
  );
};

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
  ["1", "2", "3", "R", "X"],
  A.map(charCodeAt(0)),
  makeWaitForMenuChoice
);

const waitForToolMenuChoice = pipe(
  ["S", "X"],
  A.map(charCodeAt(0)),
  makeWaitForMenuChoice
);

const makeDoUntilMenuChoice = <R, E, A>(
  effect: S.Stream<R, E, A>
): T.Effect<R & Emitter.Emitter, E, O.Option<A[]>> =>
  pipe(
    // Run 2 effects in parallell
    T.parZip(
      // One that runs the effect until a menu choice (S or X) is pressed
      pipe(effect, takeUntil(waitForToolMenuChoice), S.collectArray),
      // And second the menu choice itself
      waitForToolMenuChoice
    ),
    // If the menu choice was X return an empty list of instructions otherwise return instructions.
    T.map(([instructions, code]) =>
      code === "S" ? O.some(instructions) : O.none
    )
  );

type EffectOf<T> = T extends T.Effect<any, any, infer A> ? A : never;

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
            case "1": {
              const program = makeDoUntilMenuChoice(drawCirclesOnClick);
              return program;
            }
            case "2": {
              const program = makeDoUntilMenuChoice(drawMarkerOnClick);
              return program;
            }
            case "3": {
              const program = pipe(
                // Let the user draw a polygon until they press S or X (to cancel)
                makeDoUntilMenuChoice(
                  pipe(
                    stateRef.get,
                    T.map(dot("instructions")),
                    S.encaseEffect,
                    S.chain(drawPolygon),
                  )
                ),
                // makeDoUntilMenuChoice returns an option to indicate cancellation
                T.map(option => pipe(
                    option,
                    // drawPolygon also returns an option and is a stream (array) of options
                    O.chain(suboptions => pipe(
                        suboptions,
                        // We only want the last polygon since that was the final version
                        A.reverse,
                        ([h]) => h,
                    )),
                    // Put it back into an array (the other 2 programs emit arrays)
                    O.map(A.of)
                )),
              );

              return program;
            }
            case "X": {
              // Empty the instructions in state
              return T.as(
                stateRef.update(() => ({ instructions: [] })),
                O.none as O.Option<Canvas.InstructionGroup[]>
              );
            }
            default:
              return T.pure(O.none as O.Option<Canvas.InstructionGroup[]>);
          }
        })
        // Update state and add the new set of instructions to the current set
        .doL(({ additionalInstructions }) => {
          console.log(additionalInstructions);
          return pipe(
            additionalInstructions,
            O.map((instructions) =>
              T.as(
                stateRef.update((current) => {
                  return {
                    instructions: [...current.instructions, ...instructions],
                  };
                }),
                1
              )
            ),
            O.fold(constant(T.pure(1)), identity)
          );
        })
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
          //   T.forever,
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
