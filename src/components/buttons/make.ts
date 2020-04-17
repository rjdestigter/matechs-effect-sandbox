import { effect as T, stream as S } from "@matechs/effect";
import * as O from "fp-ts/lib/Option";
import {
  $,
  makeClickStream,
  raiseEmptyOptionOfElement
} from "../../modules/dom";
import { pipe } from "fp-ts/lib/pipeable";
import { constant, identity } from "fp-ts/lib/function";

export default (selector: string) => {
  const element = $<HTMLButtonElement>(selector);

  const clicks = pipe(
    element,
    makeClickStream,
    S.encaseEffect,
    S.chain(identity)
  );

  const withButton = (error: string) => <A>(
    cb: (btn: HTMLButtonElement) => A
  ) =>
    pipe(
      element,
      T.chain(elementO =>
        pipe(
          elementO,
          O.fold(constant(raiseEmptyOptionOfElement(error)), btn =>
            T.sync(() => cb(btn))
          )
        )
      )
    );

  const disable = withButton(`Unable to disable button(${selector})`)(btn =>
    btn.setAttribute("disabled", "true")
  );

  const enable = withButton(`Unable to enable button(${selector})`)(btn =>
    btn.removeAttribute("disabled")
  );

  return { element, clicks, disable, enable };
};
