import { effect as T } from "@matechs/effect";
import { Do } from "fp-ts-contrib/lib/Do";
import { pipe } from "fp-ts/lib/pipeable";
import * as Rnd from "fp-ts/lib/Random";
import * as A from "fp-ts/lib/Array";

import { fromIO, rndColor } from "../../utils/effect";
import { tuple } from "../../utils/tuple";

export const uri = "@uri/canvas";

interface Flavoring<FlavorT> {
  _type?: FlavorT;
}

export type Flavor<T, FlavorT> = T & Flavoring<FlavorT>;

type Radian = Flavor<number, "radius">;

type Arc = {
  type: "@instruction/arc";
  args: [number, number, number, number, number, boolean];
};

type ClearRect = {
  type: "@instruction/clearRect";
  args: [number, number, number, number];
};

type BeginPath = { type: "@instruction/beginPath" };
type Stroke = { type: "@instruction/stroke" };
type Fill = { type: "@instruction/fill" };
type LineWidth = { type: "@instruction/lineWidth"; args: [number] };
type StrokeStyle = { type: "@instruction/strokeStyle"; args: [string] };
type FillStyle = { type: "@instruction/fillStyle"; args: [string] };

export type Instruction =
  | Arc
  | ClearRect
  | BeginPath
  | Stroke
  | Fill
  | LineWidth
  | StrokeStyle
  | FillStyle;

export type Tagged<T> = { type: "@tag"; instructions: Instruction[]; data: T };

export const tag = (instructions: Instruction[]) => <T>(
  data: T
): Tagged<T> => ({ type: "@tag", instructions, data });

export interface Canvas {
  [uri]: {
    canvas: T.UIO<HTMLCanvasElement>;
    clearRect: (
      x?: number,
      y?: number,
      width?: number,
      height?: number
    ) => T.RUIO<Canvas, Instruction>;
    arc: (
      x: number,
      y: number,
      radius: number,
      startAngle: Radian,
      endAngle: Radian,
      anticlockwise?: boolean | undefined
    ) => T.UIO<Instruction>;
    lineWidth: (width: number) => T.UIO<Instruction>;
    beginPath: T.UIO<Instruction>;
    stroke: T.UIO<Instruction>;
    fill: T.UIO<Instruction>;
    strokeStyle: (color: string) => T.UIO<Instruction>;
    fillStyle: (color: string) => T.UIO<Instruction>;
  };
}

/**
 * circle :: number -> number -> number -> number? -> number? -> Effect Canvas never (number, number, number)
 *
 * Draws a circle on the canvas. X, y, and radius are returned again.
 */
export const circle = (
  x: number,
  y: number,
  r: number,
  sa?: number,
  ea?: number
) =>
  T.accessM((_: Canvas) => {
    const ctx = _[uri];
    return pipe(
      T.zip(
        sa ? T.pure(sa) : fromIO(Rnd.randomInt(0, 360)),
        ea
          ? T.pure(ea)
          : fromIO(Rnd.randomInt((Math.PI / 10) * 1000, Math.PI * 1000))
      ),
      T.chain(([sa, ea]) => {
        const list: T.UIO<Instruction>[] = [
          pipe(rndColor(1), T.chain(ctx.strokeStyle)),
          pipe(rndColor(), T.chain(ctx.fillStyle)),
          ctx.lineWidth(2),
          ctx.beginPath,
          ctx.arc(x, y, r, sa, ea / 1000),
          ctx.stroke,
          ctx.fill,
        ];

        return A.array.sequence(T.effect)(list);
      })
    );
  });

/**
 * clear :: T.Effect Canvas never void
 *
 * Clears a canvas
 */
export const clear = T.accessM((_: Canvas) => _[uri].clearRect());

const accessCanvas = T.accessM((_: Canvas) => _[uri].canvas);

const accessCanvasProp = <TProp extends keyof HTMLCanvasElement>(prop: TProp) =>
  pipe(
    accessCanvas,
    T.map((el) => el[prop])
  );

const canvasPropIfNot = <TProp extends keyof HTMLCanvasElement>(
  prop: TProp
) => (value?: HTMLCanvasElement[TProp]) =>
  value != null ? T.pure(value) : accessCanvasProp(prop);

const canvasWidthIfNot = canvasPropIfNot("width");
const canvasHeightIfNot = canvasPropIfNot("height");

const makeClearRectLive = (ctx: CanvasRenderingContext2D) => (
  x?: number,
  y?: number,
  width?: number,
  height?: number
): T.Effect<Canvas, never, ClearRect> =>
  Do(T.effect)
    .bind("width", canvasWidthIfNot(width))
    .bind("height", canvasHeightIfNot(height))
    .doL(({ width, height }) =>
      T.sync(() => ctx.clearRect(x || 0, y || 0, width, height))
    )
    .return(({ width, height }) => ({
      type: "@instruction/clearRect",
      args: tuple(x || 0, y || 0, width, height),
    }));

export const isInstruction = <TInstructionType extends Instruction["type"]>(
  type: TInstructionType
) => (
  instruction: Instruction
): instruction is Extract<Instruction, { type: TInstructionType }> =>
  instruction.type === type;

export const parseInstruction = (instruction: Instruction) =>
  T.accessM((_: Canvas): T.Effect<Canvas, never, Instruction> => {
    const ctx = _[uri];

    switch (instruction.type) {
      case "@instruction/arc": {
        return ctx.arc(...instruction.args);
      }
      case "@instruction/beginPath": {
        return ctx.beginPath;
      }
      case "@instruction/clearRect": {
        return ctx.clearRect(...instruction.args);
      }
      case "@instruction/fill": {
        return ctx.fill
      }
      case "@instruction/fillStyle": {
        return ctx.fillStyle(...instruction.args);
      }
      case "@instruction/lineWidth": {
        return ctx.lineWidth(...instruction.args);
      }
      case "@instruction/stroke": {
        return ctx.stroke;
      }
      case "@instruction/strokeStyle": {
        return ctx.strokeStyle(...instruction.args);
      }
    }
  });

export const parseInstructions = (instructions: Instruction[]) => pipe(
    instructions,
    A.map(parseInstruction),
    A.array.sequence(T.effect)
)

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
        T.as(
          T.sync(() =>
            ctx.arc(x, y, radius, startAngle, endAngle, anticlockwise)
          ),
          {
            type: "@instruction/arc",
            args: [x, y, radius, startAngle, endAngle, anticlockwise],
          }
        ),
      clearRect: makeClearRectLive(ctx),
      beginPath: T.as(
        T.sync(() => ctx.beginPath()),
        { type: "@instruction/beginPath" }
      ),
      stroke: T.as(
        T.sync(() => ctx.stroke()),
        { type: "@instruction/stroke" }
      ),
      fill: T.as(
        T.sync(() => ctx.fill()),
        { type: "@instruction/fill" }
      ),
      lineWidth: (width: number) =>
        T.as(
          T.sync(() => {
            ctx.lineWidth = Math.abs(width);
          }),
          { type: "@instruction/lineWidth", args: [width] }
        ),
      strokeStyle: (color: string) =>
        T.as(
          T.sync(() => {
            ctx.strokeStyle = color;
          }),
          { type: "@instruction/strokeStyle", args: [color] }
        ),
      fillStyle: (color: string) =>
        T.as(
          T.sync(() => {
            ctx.fillStyle = color;
          }),
          { type: "@instruction/fillStyle", args: [color] }
        ),
    },
  };
};
