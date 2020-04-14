import { effect as T, stream as S, managed as M } from "@matechs/effect";
import { pipe } from "fp-ts/lib/pipeable";
import { dot } from "../../utils/getter";
import { log } from "@matechs/console";

export const uri = "@uri/emitter";

type EventFor<TEventType extends string> = TEventType extends
  | "keypress"
  | "keyup"
  | "keydown"
  ? KeyboardEvent
  : TEventType extends "click" | "dblclick"
  ? MouseEvent
  : Event;

type EventHandler<TEventType extends string> = (
  evt: EventFor<TEventType>
) => void;

export interface Emitter {
  [uri]: {
    fromEvent: <TEventType extends string>(
      type: TEventType
    ) => (cb: EventHandler<TEventType>) => T.Effect<T.NoEnv, never, void>;
    addEventListener: <THTMLElement extends HTMLElement>(
      el: THTMLElement
    ) => <TEventType extends string>(
      type: TEventType
    ) => (cb: EventHandler<TEventType>) => T.Effect<T.NoEnv, never, void>;
  };
}

// Events
export const subscribe = <
  TEventType extends string,
  THTMLElement extends HTMLElement
>(
  type: TEventType,
  el?: THTMLElement
) => {
  return S.fromSource(
    M.managed.chain(
      M.bracket(
        T.accessM((_: Emitter) =>
          T.sync(() => {
            const { next, ops, hasCB } = S.su.queueUtils<
              never,
              EventFor<TEventType>
            >();

            const fn = el ? _[uri].addEventListener(el) : _[uri].fromEvent;

            return {
              unsubscribe: fn(type)((a) => next({ _tag: "offer", a })),
              ops,
              hasCB,
            };
          })
        ),
        dot("unsubscribe")
      ),
      ({ ops, hasCB }) => S.su.emitter(ops, hasCB)
    )
  );
};

export const makeEmitterLive = <
  TRoot extends Pick<HTMLElement, "addEventListener" | "removeEventListener">
>(
  rootEl: TRoot
): Emitter => {
  return {
    [uri]: {
      fromEvent: <TEventType extends string>(type: TEventType) => (
        cb: EventHandler<TEventType>
      ) => {
        rootEl.addEventListener(type, cb as any);

        return T.sync(() => rootEl.removeEventListener(type, cb as any));
      },
      addEventListener: <THTMLElement extends HTMLElement>(
        el: THTMLElement
      ) => <TEventType extends string>(type: TEventType) => (
        cb: EventHandler<TEventType>
      ) => {
        el.addEventListener(type, cb as any);

        return T.sync(() => el.removeEventListener(type, cb as any));
      },
    },
  };
};

/**
 * waitForKeyPress :: number -> Effect NoEnv never void
 *
 * Given a keyCode returns an effect that resolves once the user
 * presses a key on the keyboard matching the key code.
 */
export const waitForKeyPress = (...keyCodes: number[]) =>
  T.effect.chain(log("Waiting for ", ...keyCodes), () =>
    pipe(
      subscribe("keyup"),
      S.filter((event) => keyCodes.includes(event.keyCode)),
      S.take(1),
      S.collectArray,
      T.map(([evt]) => evt)
    )
  );
