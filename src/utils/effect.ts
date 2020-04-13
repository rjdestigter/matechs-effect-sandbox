import * as IO from "fp-ts/lib/IO";
import * as Rnd from "fp-ts/lib/Random";
import { pipe } from "fp-ts/lib/pipeable";
import { Do } from "fp-ts-contrib/lib/Do";
import { effect as T, stream as S } from "@matechs/effect";

export const fromIO = <T>(io: IO.IO<T>) => {
  return T.sync(() => io());
};

export const rndColor = (alpha?: number) =>
  Do(T.effect)
    .bind("r", fromIO(Rnd.randomInt(0, 255)))
    .bind("g", fromIO(Rnd.randomInt(0, 255)))
    .bind("b", fromIO(Rnd.randomInt(0, 255)))
    .bind(
      "a",
      alpha != null
        ? T.pure(alpha)
        : fromIO(
            pipe(
              Rnd.randomInt(0, 10),
              IO.map((a) => a / 10)
            )
          )
    )
    .return(({ r, g, b, a }) => `rgba(${r}, ${g}, ${b}, ${a})`);

/**
 * Take elements from a stream until a given effect resolves.
 *
 * @param until The effect that will terminate the stream
 * @param stream The stream
 */
function takeUntil_<R1, E1, R2, E2, A>(
  stream: S.Stream<R1, E1, A>,
  until: T.Effect<R2, E2, any>
) {
  type Wrapped = { type: "until" } | { type: "stream"; value: A };

  const wrappedUntil = S.as<Wrapped>({ type: "until" })(S.encaseEffect(until));

  const wrappedStream = pipe(
    stream,
    S.map((value): Wrapped => ({ type: "stream", value }))
  );

  return pipe(
    S.mergeAll([wrappedUntil as any, wrappedStream as any] as S.Stream<
      R1 & R2,
      E1 | E2,
      Wrapped
    >[]),
    S.takeWhile((wrapped) => wrapped.type === "stream"),
    S.filter(
      (wrapped): wrapped is Extract<Wrapped, { type: "stream" }> =>
        wrapped.type === "stream"
    ),
    S.map((wrapped) => (wrapped as Extract<Wrapped, { type: "stream" }>).value)
  );
}

export function takeUntil<R2, E2>(until: T.Effect<R2, E2, any>) {
  return function <R1, E1, A>(s: S.Stream<R1, E1, A>) {
    return takeUntil_(s, until);
  };
}
