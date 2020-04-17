import { effect as T, stream as S } from "@matechs/effect";
import * as O from "fp-ts/lib/Option";
import { pipe } from "fp-ts/lib/pipeable";
import { constant, flow, identity } from "fp-ts/lib/function";
import { subscribe, Emitter, EventFor } from "../emitter";

/**
 * Document
 */
export const documentUri = '@uri/document'

export type DocumentEnv = { [documentUri]: Document }

export const getDocument = T.accessM(flow((_: DocumentEnv) => _[documentUri], T.pure))

export const mapDocument = <R, E, A>(f: (doc: Document) => T.Effect<R, E, A>) => pipe(
  getDocument,
  T.map(f)
)

/**
 * QuerySelector
 */
interface QuerySelector {
  <K extends keyof HTMLElementTagNameMap>(selectors: K): <
    TNode extends ParentNode
  >(
    node: TNode
  ) => O.Option<HTMLElementTagNameMap[K]>;
  <K extends keyof SVGElementTagNameMap>(selectors: K): <
    TNode extends ParentNode
  >(
    node: TNode
  ) => O.Option<SVGElementTagNameMap[K]>;
  <E extends Element = Element>(selectors: string): <TNode extends ParentNode>(
    node: TNode
  ) => O.Option<E>;
}

interface QuerySelectorT {
  <K extends keyof HTMLElementTagNameMap>(selectors: K): <
    TNode extends ParentNode
  >(
    node: O.Option<TNode>
  ) => O.Option<HTMLElementTagNameMap[K]>;
  <K extends keyof SVGElementTagNameMap>(selectors: K): <
    TNode extends ParentNode
  >(
    node: O.Option<TNode>
  ) => O.Option<SVGElementTagNameMap[K]>;
  <E extends Element = Element>(selectors: string): <TNode extends ParentNode>(
    node: O.Option<TNode>
  ) => O.Option<E>
}

export const querySelector: QuerySelector = (selectors: string) => <
  TNode extends ParentNode
>(
  el: TNode
) => O.fromNullable(el.querySelector(selectors));

export const querySelectorO: QuerySelectorT = (selectors: string) => <
  TNode extends ParentNode
>(
  nodeOT: O.Option<TNode>
) =>
pipe(
  nodeOT,
  O.map((el) => querySelector(selectors)(el))
)

/**
 * $
 */
interface $ {
    <K extends keyof HTMLElementTagNameMap>(selectors: K): T.Effect<DocumentEnv, never, O.Option<HTMLElementTagNameMap[K]>>;
    <K extends keyof SVGElementTagNameMap>(selectors: K): T.Effect<DocumentEnv, never, O.Option<SVGElementTagNameMap[K]>>;
    <E extends Element = Element>(selectors: string): T.Effect<DocumentEnv, never, O.Option<E>>;
}

export const $: $ = (selectors: string) => pipe(
  getDocument,
  T.map(querySelector(selectors))
)

/**
 * ```hs
 * parentElement :: Node -> Option<HTMLelement>
 * ```
 */
export const parentElement = <TNode extends Node>(node: TNode) => O.fromNullable(node.parentElement)


export class EmptyOptionOfElement extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmptyOptionOfElement";
  }
}

export const raiseEmptyOptionOfElement = (message: string) => T.raiseError(new EmptyOptionOfElement(message))

export const makeEventStream = <TEventType extends string>(eventType: TEventType) => <R, E, A extends Element>(elementT: T.Effect<R, E, O.Option<A>>) => pipe(
  elementT,
  T.map(elementO => pipe(
    elementO,
    O.map(subscribe(eventType)),
    O.fold<S.Stream<Emitter, never, EventFor<TEventType>>, S.Stream<Emitter, EmptyOptionOfElement,  EventFor<TEventType>>>(
      constant(S.raised(new EmptyOptionOfElement(`Option does not contain some element to create ${eventType} event stream for`))),
      identity
    )
  ))
)

export const makeClickStream = makeEventStream('click')