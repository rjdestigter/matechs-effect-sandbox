import * as A from 'fp-ts/lib/Array'
export const concat = <A>(rest: A[]) => (first: A[]) => A.getMonoid<A>().concat(first, rest)