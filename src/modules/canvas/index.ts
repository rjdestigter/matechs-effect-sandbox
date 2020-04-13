import { effect as T } from "@matechs/effect";
import { Do } from "fp-ts-contrib/lib/Do";
import { pipe } from "fp-ts/lib/pipeable";
import { constVoid, constant } from "fp-ts/lib/function";
import * as Rnd from 'fp-ts/lib/Random'

import { fromIO, rndColor } from '../../utils/effect'
import { tuple } from "../../utils/tuple";

export const uri = "@uri/canvas";

interface Flavoring<FlavorT> {
  _type?: FlavorT;
}

export type Flavor<T, FlavorT> = T & Flavoring<FlavorT>;

type Radian = Flavor<number, "radius">;

export interface Canvas {
  [uri]: {
    canvas: T.UIO<HTMLCanvasElement>;
    clearRect: (
      x: number,
      y: number,
      width?: number,
      height?: number
    ) => T.RUIO<Canvas, void>;
    arc: (
      x: number,
      y: number,
      radius: number,
      startAngle: Radian,
      endAngle: Radian,
      anticlockwise?: boolean | undefined
    ) => T.UIO<void>;
    lineWidth: (width: number) => T.UIO<void>;
    beginPath: T.UIO<void>;
    stroke: T.UIO<void>;
    fill: T.UIO<void>;
    strokeStyle: (color: string) => T.UIO<void>;
    fillStyle: (color: string) => T.UIO<void>;
  };
}

/**
 * circle :: number -> number -> number -> number? -> number? -> Effect Canvas never (number, number, number)
 *
 * Draws a circle on the canvas. X, y, and radius are returned again.
 */
export const circle = (x: number, y: number, r: number, sa?: number, ea?: number) =>
  T.accessM((_: Canvas) => {
    const ctx = _[uri];
    return pipe(
      T.zip(
        sa ? T.pure(sa) : fromIO(Rnd.randomInt(0, 360)),
        ea
          ? T.pure(ea)
          : fromIO(Rnd.randomInt((Math.PI / 10) * 1000, Math.PI * 1000))
      ),
      T.chain(
        ([sa, ea]) =>
          Do(T.effect)
            .do(
              pipe(rndColor(1), T.chain(ctx.strokeStyle))
            )
            .do(
              pipe(rndColor(), T.chain(ctx.fillStyle))
            )
            .do(ctx.lineWidth(2))
            .do(ctx.beginPath)
            .do(ctx.arc(x, y, r, sa, ea / 1000))
            .do(ctx.stroke)
            .do(ctx.fill)
            .return(constant(tuple(x, y, r, sa, ea)))
       
      )
    );
  });

/**
 * clear :: T.Effect Canvas never void
 *
 * Clears a canvas
 */
export const clear = T.accessM((_: Canvas) => _[uri].clearRect(0, 0))

const accessCanvas = T.accessM((_: Canvas) => _[uri].canvas)

const accessCanvasProp = <TProp extends keyof HTMLCanvasElement>(prop: TProp) => pipe(
    accessCanvas,
    T.map((el) => el[prop])
)

const canvasPropIfNot = <TProp extends keyof HTMLCanvasElement>(prop: TProp) => (value?: HTMLCanvasElement[TProp]) =>  value != null
? T.pure(value)
: accessCanvasProp(prop)

const canvasWidthIfNot = canvasPropIfNot('width')
const canvasHeightIfNot = canvasPropIfNot('height')

const makeClearRectLive = (ctx: CanvasRenderingContext2D) => (
  x: number,
  y: number,
  width?: number,
  height?: number
) =>
  Do(T.effect)
    .bind(
      "width",
      canvasWidthIfNot(width)
    )
    .bind(
      "height",
      canvasHeightIfNot(height)
    )
    .doL(({ width, height }) =>
      T.sync(() => ctx.clearRect(x, y, width, height))
    )
    .return(constVoid);
    

export const makeCanvasLive = (ctx: CanvasRenderingContext2D): Canvas => {
  return {
    [uri]: {
    canvas: T.pure(ctx.canvas),
      arc: (
        x: number,
        y: number,
        radius: number,
        startAngle: Radian,
        endAngle: Radian,
        anticlockwise = false
      ) =>
        T.sync(() =>
          ctx.arc(x, y, radius, startAngle, endAngle, anticlockwise)
        ),
      clearRect: makeClearRectLive(ctx),
      beginPath: T.sync(() => ctx.beginPath()),
      stroke: T.sync(() => ctx.stroke()),
      fill: T.sync(() => ctx.fill()),
      lineWidth: (width: number) =>
        T.sync(() => {
          ctx.lineWidth = Math.abs(width);
        }),
        strokeStyle: (color: string) => T.sync(
            () => { ctx.strokeStyle = color; }
        ),
        fillStyle: (color: string) => T.sync(
            () => { ctx.fillStyle = color; }
        )
    },
  };
};
