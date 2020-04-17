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

  const clicks = pipe(element, makeClickStream, S.encaseEffect, S.chain(identity));

  const disable = pipe(
    element,
    T.chain(elementO =>
      pipe(
        elementO,
        O.fold(
          constant(raiseEmptyOptionOfElement(`Unable to disable button(${selector})`)),
          element => T.sync(() => element.setAttribute("disabled", "true"))
        )
      )
    )
  );

  const enable = pipe(
    element,
    T.chain(elementO =>
      pipe(
        elementO,
        O.fold(
          constant(raiseEmptyOptionOfElement(`Unable to enable button(${selector})`)),
          element => T.sync(() => element.removeAttribute("disabled"))
        )
      )
    )
  );

  return { element, clicks, disable, enable }
}