import { effect as T } from "@matechs/effect";
import * as O from "fp-ts/lib/Option";
import { pipe } from "fp-ts/lib/pipeable";
import { constant } from "fp-ts/lib/function";
import { dot } from "../../utils/getter";
import { Do } from "fp-ts-contrib/lib/Do";

interface QuerySelector {
  <K extends keyof HTMLElementTagNameMap>(selectors: K): <
    TNode extends ParentNode
  >(
    node: TNode
  ) => T.UIO<O.Option<HTMLElementTagNameMap[K]>>;
  <K extends keyof SVGElementTagNameMap>(selectors: K): <
    TNode extends ParentNode
  >(
    node: TNode
  ) => T.UIO<O.Option<SVGElementTagNameMap[K]>>;
  <E extends Element = Element>(selectors: string): <TNode extends ParentNode>(
    node: TNode
  ) => T.UIO<O.Option<E>>;
}

interface QuerySelectorT {
  <K extends keyof HTMLElementTagNameMap>(selectors: K): <
    TNode extends ParentNode
  >(
    node: T.UIO<O.Option<TNode>>
  ) => T.UIO<O.Option<HTMLElementTagNameMap[K]>>;
  <K extends keyof SVGElementTagNameMap>(selectors: K): <
    TNode extends ParentNode
  >(
    node: T.UIO<O.Option<TNode>>
  ) => T.UIO<O.Option<SVGElementTagNameMap[K]>>;
  <E extends Element = Element>(selectors: string): <TNode extends ParentNode>(
    node: T.UIO<O.Option<TNode>>
  ) => T.UIO<O.Option<E>>;
}

export const querySelector: QuerySelector = (selectors: string) => <
  TNode extends ParentNode
>(
  el: TNode
) => T.sync(() => O.fromNullable(el.querySelector(selectors)));

export const querySelectorT: QuerySelectorT = (selectors: string) => <
  TNode extends ParentNode
>(
  nodeT: T.UIO<O.Option<TNode>>
) =>
  pipe(
    nodeT,
    T.chain((nodeOption) =>
      pipe(
        nodeOption,
        O.fold(constant(T.pure(O.none)), (el) => querySelector(selectors)(el))
      )
    )
  );

export const querySelectorT2: QuerySelectorT = (selectors: string) => <
  TNode extends ParentNode
>(
  nodeT: T.UIO<O.Option<TNode>>
) =>
  Do(T.effect)
    .bind("node", nodeT)
    .bindL("result", ({ node }) =>
      pipe(
        node,
        O.fold(constant(T.pure(O.none)), (el) => querySelector(selectors)(el))
      )
    )
    .return(dot("result"));

