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

type LineTo = {
  type: "@instruction/lineTo";
  args: [number, number];
};

type MoveTo = {
  type: "@instruction/moveTo";
  args: [number, number];
};

type BeginPath = { type: "@instruction/beginPath" };
type ClosePath = { type: "@instruction/closePath" };
type Stroke = { type: "@instruction/stroke" };
type Fill = { type: "@instruction/fill" };
type Save = { type: "@instruction/save" };
type Restore = { type: "@instruction/restore" };
type LineWidth = { type: "@instruction/lineWidth"; args: [number] };
type StrokeStyle = { type: "@instruction/strokeStyle"; args: [string] };
type FillStyle = { type: "@instruction/fillStyle"; args: [string] };

export type InstructionGroup = { type: '@instruction-group', instructions: Instruction[] }

export type Instruction =
  | Arc
  | ClearRect
  | BeginPath
  | Stroke
  | Fill
  | LineWidth
  | StrokeStyle
  | FillStyle
  | MoveTo
  | ClosePath
  | LineTo
  | Save
  | Restore
  | InstructionGroup

export type Tagged<T> = { type: "@tag"; instructions: Instruction[]; data: T };

export const tag = (instructions: Instruction[]) => <T>(
  data: T
): Tagged<T> => ({ type: "@tag", instructions, data });

export const group = (instructions: Instruction[]): InstructionGroup => ({
    type: '@instruction-group', instructions
})

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
    lineTo: (
      x: number,
      y: number,
    ) => T.UIO<Instruction>;
    moveTo: (
      x: number,
      y: number,
    ) => T.UIO<Instruction>;
    lineWidth: (width: number) => T.UIO<Instruction>;
    beginPath: T.UIO<Instruction>;
    closePath: T.UIO<Instruction>;
    stroke: T.UIO<Instruction>;
    save: T.UIO<Instruction>;
    restore: T.UIO<Instruction>;
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
       case "@instruction-group": {
        return pipe(
            parseInstructions(instruction.instructions),
            T.map(group)
        )
       }
      case "@instruction/arc": {
        return ctx.arc(...instruction.args);
      }
      case "@instruction/lineTo": {
        return ctx.lineTo(...instruction.args);
      }
      case "@instruction/moveTo": {
        return ctx.moveTo(...instruction.args);
      }
      case "@instruction/save": {
        return ctx.save;
      }
      case "@instruction/restore": {
        return ctx.restore;
      }
      case "@instruction/beginPath": {
        return ctx.beginPath;
      }
      case "@instruction/closePath": {
        return ctx.closePath;
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
      lineTo: (
        x: number,
        y: number,
      ) =>
        T.as(
          T.sync(() =>
            ctx.lineTo(x, y)
          ),
          {
            type: "@instruction/lineTo",
            args: [x, y],
          }
        ),
      moveTo: (
        x: number,
        y: number,
      ) =>
        T.as(
          T.sync(() =>
            ctx.moveTo(x, y)
          ),
          {
            type: "@instruction/moveTo",
            args: [x, y],
          }
        ),
      clearRect: makeClearRectLive(ctx),
      beginPath: T.as(
        T.sync(() => ctx.beginPath()),
        { type: "@instruction/beginPath" }
      ),
      closePath: T.as(
        T.sync(() => ctx.closePath()),
        { type: "@instruction/closePath" }
      ),
      stroke: T.as(
        T.sync(() => ctx.stroke()),
        { type: "@instruction/stroke" }
      ),
      save: T.as(
        T.sync(() => ctx.save()),
        { type: "@instruction/save" }
      ),
      restore: T.as(
        T.sync(() => ctx.restore()),
        { type: "@instruction/restore" }
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

export const moveTo = ([x, y]: [number, number]) => T.accessM(
    (_: Canvas) => _[uri].moveTo(x, y)
)

export const lineTo = ([x, y]: [number, number]) => T.accessM(
    (_: Canvas) => _[uri].lineTo(x, y)
)

export const lineWidth = (width: number) => T.accessM(
    (_: Canvas) => _[uri].lineWidth(width)
)

export const beginPath = T.accessM(
    (_: Canvas) => _[uri].beginPath
)

export const closePath = T.accessM(
    (_: Canvas) => _[uri].closePath
)

export const stroke = T.accessM(
    (_: Canvas) => _[uri].stroke
)

export const accessContext = <R, E, A>(f: (ctx: Canvas[typeof uri]) => T.Effect<Canvas & R, E, A>) => T.accessM((_: Canvas) => f(_[uri]))