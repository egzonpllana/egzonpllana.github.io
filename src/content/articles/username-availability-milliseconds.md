---
title: 'How Big-Name Companies Check Username Availability in Milliseconds'
description: 'It is not a search, it is a keyed existence lookup. How indexes, Bloom filters, and caches make the check instant, and why correctness lives somewhere else entirely.'
date: 2026-07-13
tags: ['Systems Design', 'Bloom Filters', 'Databases', 'Caching', 'Distributed Systems']
heroImage: '../../assets/covers/username-availability-milliseconds.png'
---

You type a username into a signup form, and before you finish the last character a little green check appears: available. Type one more letter and it flips to taken. It feels like magic, and it feels instant. So how does a service with two billion accounts tell you, in a few milliseconds, whether one string is free?

The short answer is the one most people get wrong on the first guess: **they do not search for it.** Searching implies scanning, and scanning millions of rows would never be milliseconds. What actually happens is a keyed existence lookup on a data structure built for exactly that, plus a couple of layers in front of it. Correctness, it turns out, lives somewhere else entirely.

Here is the whole chain, from the moment you type.

## 1. The client does not ask on every keystroke

The first optimization happens before any request leaves your machine. The field debounces: it waits until you stop typing, typically ~200-400 ms, then fires a single small async request instead of one per keystroke. Part of the "instant" feel is nothing clever at all, just that the payload is tiny and the request lands on a geographically close edge or CDN node. You are not talking to a datacenter across the ocean; you are talking to something a few milliseconds away.

## 2. The backend does an indexed key lookup, not a table scan

This is the core of the whole thing. An index is a separate lookup structure the database keeps alongside the table, sorted so it can jump straight to an entry instead of reading every row, exactly like the index at the back of a book. The `username` column has a *unique* one, either a B-tree (`O(log n)`) or a hash index (effectively `O(1)`). Looking up whether `egzon` exists costs essentially the same whether the table holds ten users or two billion, because you never walk the rows, you jump to the entry.

That is the real answer to "how does it check in milliseconds." The honest reframe of the question is "why isn't it slow," and the reason is that a proper index makes existence checks cheap regardless of table size. Everything else in this article is an optimization on top of an operation that was already fast.

## 3. A cache sits in front of the database

Redis or Memcached holds hot lookups, so many checks never touch the database at all. This is the layer everyone reaches for first, and, as we will see at the end, it is actually the weakest link for this particular access pattern. Hold that thought.

## 4. Bloom filters make the common case free

This is the piece most people miss, and it is the most interesting one.

A Bloom filter is a probabilistic structure that answers a single question, "is this key in the set?", with two possible answers: **definitely not present**, or **possibly present**. It never gives a false negative, but it will occasionally give a false positive. That asymmetry is the whole trick.

The mechanics are simple. Each username is run through `k` independent hash functions, and each hash sets one bit in a large bit array:

<figure class="bf-figure">
<div class="bf-scroll">
<svg viewBox="0 0 700 344" role="img" aria-labelledby="bfTitle bfDesc" style="font-family:inherit">
<title id="bfTitle">How a Bloom filter answers &quot;is this username taken?&quot;</title>
<desc id="bfDesc">Inserting egzon sets bits 2, 7 and 11 in the array. On a query, any zero bit means definitely free, while all ones means possibly taken.</desc>
<defs>
<marker id="bfArrow" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="var(--fg-muted)"></path></marker>
<style>
.bf-box{fill:var(--bg-subtle);stroke:var(--border-strong);stroke-width:1.5;rx:8}
.bf-accent{fill:var(--accent-soft);stroke:var(--accent);stroke-width:1.5}
.bf-t{fill:var(--fg);font-size:14px;font-weight:600}
.bf-s{fill:var(--fg-muted);font-size:11.5px}
.bf-i{fill:var(--fg-faint);font-size:10px}
.bf-c0{fill:var(--bg-subtle);stroke:var(--border-strong);stroke-width:1.4}
.bf-c1{fill:var(--accent-soft);stroke:var(--accent);stroke-width:1.6}
.bf-b0{fill:var(--fg-faint);font-size:13px}
.bf-b1{fill:var(--accent-text);font-size:13px;font-weight:700}
.bf-a{stroke:var(--fg-muted);stroke-width:1.4;fill:none}
</style>
</defs>
<rect class="bf-box" x="24" y="40" width="150" height="34" rx="8"></rect>
<text class="bf-t" x="99" y="62" text-anchor="middle">insert "egzon"</text>
<line class="bf-a" x1="176" y1="57" x2="296" y2="57" marker-end="url(#bfArrow)"></line>
<rect class="bf-box" x="300" y="40" width="124" height="34" rx="8"></rect>
<text class="bf-t" x="362" y="62" text-anchor="middle">h1  h2  h3</text>
<text class="bf-s" x="362" y="90" text-anchor="middle">k hash functions</text>
<line class="bf-a" x1="362" y1="76" x2="119" y2="128" marker-end="url(#bfArrow)"></line>
<line class="bf-a" x1="362" y1="76" x2="309" y2="128" marker-end="url(#bfArrow)"></line>
<line class="bf-a" x1="362" y1="76" x2="461" y2="128" marker-end="url(#bfArrow)"></line>
<text class="bf-s" x="24" y="118">Bit array - every bit starts at 0</text>
<rect class="bf-c0" x="24" y="130" width="38" height="34" rx="4"></rect><text class="bf-b0" x="43" y="152" text-anchor="middle">0</text><text class="bf-i" x="43" y="180" text-anchor="middle">0</text>
<rect class="bf-c0" x="62" y="130" width="38" height="34" rx="4"></rect><text class="bf-b0" x="81" y="152" text-anchor="middle">0</text><text class="bf-i" x="81" y="180" text-anchor="middle">1</text>
<rect class="bf-c1" x="100" y="130" width="38" height="34" rx="4"></rect><text class="bf-b1" x="119" y="152" text-anchor="middle">1</text><text class="bf-i" x="119" y="180" text-anchor="middle">2</text>
<rect class="bf-c0" x="138" y="130" width="38" height="34" rx="4"></rect><text class="bf-b0" x="157" y="152" text-anchor="middle">0</text><text class="bf-i" x="157" y="180" text-anchor="middle">3</text>
<rect class="bf-c0" x="176" y="130" width="38" height="34" rx="4"></rect><text class="bf-b0" x="195" y="152" text-anchor="middle">0</text><text class="bf-i" x="195" y="180" text-anchor="middle">4</text>
<rect class="bf-c0" x="214" y="130" width="38" height="34" rx="4"></rect><text class="bf-b0" x="233" y="152" text-anchor="middle">0</text><text class="bf-i" x="233" y="180" text-anchor="middle">5</text>
<rect class="bf-c0" x="252" y="130" width="38" height="34" rx="4"></rect><text class="bf-b0" x="271" y="152" text-anchor="middle">0</text><text class="bf-i" x="271" y="180" text-anchor="middle">6</text>
<rect class="bf-c1" x="290" y="130" width="38" height="34" rx="4"></rect><text class="bf-b1" x="309" y="152" text-anchor="middle">1</text><text class="bf-i" x="309" y="180" text-anchor="middle">7</text>
<rect class="bf-c0" x="328" y="130" width="38" height="34" rx="4"></rect><text class="bf-b0" x="347" y="152" text-anchor="middle">0</text><text class="bf-i" x="347" y="180" text-anchor="middle">8</text>
<rect class="bf-c0" x="366" y="130" width="38" height="34" rx="4"></rect><text class="bf-b0" x="385" y="152" text-anchor="middle">0</text><text class="bf-i" x="385" y="180" text-anchor="middle">9</text>
<rect class="bf-c0" x="404" y="130" width="38" height="34" rx="4"></rect><text class="bf-b0" x="423" y="152" text-anchor="middle">0</text><text class="bf-i" x="423" y="180" text-anchor="middle">10</text>
<rect class="bf-c1" x="442" y="130" width="38" height="34" rx="4"></rect><text class="bf-b1" x="461" y="152" text-anchor="middle">1</text><text class="bf-i" x="461" y="180" text-anchor="middle">11</text>
<rect class="bf-c0" x="480" y="130" width="38" height="34" rx="4"></rect><text class="bf-b0" x="499" y="152" text-anchor="middle">0</text><text class="bf-i" x="499" y="180" text-anchor="middle">12</text>
<rect class="bf-c0" x="518" y="130" width="38" height="34" rx="4"></rect><text class="bf-b0" x="537" y="152" text-anchor="middle">0</text><text class="bf-i" x="537" y="180" text-anchor="middle">13</text>
<rect class="bf-c0" x="556" y="130" width="38" height="34" rx="4"></rect><text class="bf-b0" x="575" y="152" text-anchor="middle">0</text><text class="bf-i" x="575" y="180" text-anchor="middle">14</text>
<rect class="bf-c0" x="594" y="130" width="38" height="34" rx="4"></rect><text class="bf-b0" x="613" y="152" text-anchor="middle">0</text><text class="bf-i" x="613" y="180" text-anchor="middle">15</text>
<text class="bf-s" x="328" y="208" text-anchor="middle" font-style="italic">A single 0 among the probed bits proves the name was never inserted.</text>
<rect class="bf-box" x="24" y="252" width="150" height="44" rx="8"></rect>
<text class="bf-t" x="99" y="279" text-anchor="middle">check "egzon"</text>
<text class="bf-s" x="99" y="314" text-anchor="middle">probes bits 2, 7, 11</text>
<line class="bf-a" x1="176" y1="268" x2="246" y2="254" marker-end="url(#bfArrow)"></line>
<line class="bf-a" x1="176" y1="288" x2="246" y2="308" marker-end="url(#bfArrow)"></line>
<rect class="bf-box" x="248" y="232" width="428" height="44" rx="8"></rect>
<text class="bf-t" x="268" y="256">all bits = 1  →  POSSIBLY present</text>
<text class="bf-s" x="268" y="272">must confirm with a real DB lookup</text>
<rect class="bf-accent" x="248" y="286" width="428" height="44" rx="8"></rect>
<text class="bf-t" x="268" y="310" fill="var(--accent-text)">any bit = 0  →  DEFINITELY free</text>
<text class="bf-s" x="268" y="326">answered instantly, no DB hit needed</text>
</svg>
</div>
<figcaption>Each username is run through <em>k</em> hash functions that set <em>k</em> bits. On a query, a single 0 among those bits proves the name was never inserted; all 1s only means probably taken.</figcaption>
</figure>

To check a name, you hash it the same way and look at those bits:

- If **any** of the bits is `0`, the name was never inserted. Definitely free. Answered instantly, no database hit.
- If **all** of the bits are `1`, the name is probably taken, so you fall through to the real indexed lookup to disambiguate.

Why does this help? Most usernames people try are already taken, but the ones that are genuinely free get confirmed by the filter alone, in memory, with zero round-trips to the database. A single `0` bit is a proof of absence. All `1`s is only a hint, so you pay for the real lookup only when you might actually need it.

## The part engineers get wrong

Here is the trap. The availability check is a **UX hint, not a guarantee.** It is advisory. Between the moment the check says "available" and the moment you hit submit, someone else can claim the same name. That is the classic time-of-check-to-time-of-use race, and no amount of pre-checking closes it.

The real uniqueness guarantee is enforced at write time, by a unique constraint on the column, or an atomic `SET NX` / conditional insert. The insert either succeeds or fails atomically, and the database is the single source of truth. If you rely on the pre-check for correctness, you have a bug. The pre-check exists only so the user is not surprised at submit.

So the honest breakdown is two separate concerns that get conflated because they look like one feature:

- **Milliseconds** comes from indexed lookup + cache + Bloom filter + edge proximity.
- **Correctness** comes from a unique constraint enforced on insert.

> Neither Instagram nor Google publishes its exact internals. This is the standard distributed-systems pattern any team at that scale would reach for, not a claim about their precise stack.

## The napkin math: how big is that Bloom filter, really?

"Hold two billion usernames in memory" sounds expensive. It is worth doing the arithmetic, because the result is the reason this technique is worth it.

The optimal bit-array size for a Bloom filter is:

```text
m = -(n * ln p) / (ln 2)^2
```

where `n` is the number of items and `p` is the false-positive rate you are willing to tolerate. Plug in two billion usernames at a 1% false-positive rate:

```text
n = 2,000,000,000
p = 0.01

m  ~= 1.92 * 10^10 bits  ~= 2.4 GB
k  = (m / n) * ln 2  ~= 7 hash functions
```

So the entire "is this taken?" fast path for two billion accounts fits in about **2.4 GB** of RAM, using roughly **7 hash functions** per lookup. For comparison, storing the usernames themselves as plain strings at ~15 bytes each would run to ~30 GB, and you still could not answer an existence query without searching it. The filter is more than ten times smaller and answers in constant time.

And you can trade accuracy for memory. Relax the false-positive rate to 10% and it drops to ~1.2 GB with only ~3 hashes:

```text
p = 0.10  ->  m ~= 1.2 GB,  k ~= 3
```

A false positive here costs nothing but a database round-trip you were sometimes going to make anyway, so a "wrong" answer is never wrong to the user. Notice too that the filter's size depends only on the **count** of usernames and the false-positive rate. It does not grow when the rows get wider or the accounts accrue more data. That is what makes it scale.

## The bit you can't unset

There is one operation a plain Bloom filter cannot do: delete. You can insert and you can query, but you cannot remove. The reason is baked into the structure. Each bit is potentially shared by many keys, so clearing the bits for one username could unset a bit that another username depends on, and that would create a false negative, the one answer a Bloom filter is never allowed to give.

So what happens when a username is freed, by account deletion or a rename? Its bits stay `1` forever. The filter now reports that name as "possibly taken" even though it is genuinely available again. It has gone stale in the one direction it cannot self-correct.

Here is the nice part: it does not break correctness, for exactly the reason from earlier. A "possibly taken" answer only triggers a real indexed lookup, and that lookup correctly reports the freed name as available. The user can still claim it. All you have lost is the free fast-path for that one name, which quietly degrades to a normal database check. A stale bit costs a round-trip, never a wrong answer.

If you do want the memory back, you have two standard options. A **counting Bloom filter** replaces each bit with a small counter, incremented on insert and decremented on delete, at roughly four times the memory. Or, simplest at scale, you **periodically rebuild** the filter from the database, which is the source of truth anyway. A nightly rebuild reclaims every freed name at once and resets the drift to zero.

## On the cache: how big, and can it be slower than the DB?

"Add a cache" gets treated as free speed. It is not, and questioning it is the right instinct.

**How big can it get?** The wrong mental model is one giant cache holding every username. Nobody does that. A cache's whole value is holding the *hot working set*, the small fraction of data being accessed right now. Cache everything and you have built a second database in RAM, except volatile and roughly an order of magnitude more expensive per byte. Caching two billion usernames to serve the ~0.001% checked this second is economically absurd. The ceiling is not "how big can it be," it is "how big does it need to be," and the answer is: only as big as your hot set, plus headroom.

**Can it be slower than the DB?** Yes, and username checks are exactly the pattern where that happens:

- **Low hit rate, the killer.** On a miss you pay the cache lookup *and then* the database lookup, strictly slower than just hitting the database. The space of attempted usernames is enormous and sparse, so hit rates are poor. This is precisely why the Bloom filter matters more than the cache here.
- **A network hop for nothing.** A cache lookup is still a round-trip plus deserialize. If the database is co-located, has the row in its buffer pool, and the query is a trivial indexed existence check, it can match or beat the cache. Caching an already-cheap query just adds a hop.
- **Thundering herd.** A popular key expires, thousands of concurrent requests miss at once, and all slam the database, a synchronized spike it would never have seen under steady traffic. Real, though mitigable with request coalescing or probabilistic early expiration.

**The pragmatic takeaway.** A cache is a bet that the same keys get hit repeatedly *and* the underlying operation is expensive enough to avoid. For username availability, the first is weak and the operation is already a cheap indexed lookup, so the cache is a minor optimization at best, not the star. The index does the heavy lifting, the Bloom filter handles the common "free" answer, and the cache is icing.

So it is not that a bigger cache gets slower. It is that a cache applied to the wrong access pattern is slower than no cache at all, regardless of size.

## What is the key, really?

Everything so far quietly assumed that `egzon` is a clean, unambiguous key. It is not, until you make it one. Before the string ever reaches the index, the filter, or the cache, it has to be canonicalized to exactly one form. Skip this and two people can grab what is really the same name:

- **Case folding.** `Egzon`, `EGZON`, and `egzon` are the same handle to a human. Store and compare on a single lowercased form (in Postgres, a `UNIQUE (lower(username))` index).
- **Whitespace and invisibles.** Trim surrounding spaces and strip zero-width characters that get pasted in, or `egzon` and `egzon ` become two different accounts.
- **Unicode normalization.** The same visible character can have more than one byte encoding. Normalize (NFC/NFKC) so the encodings compare equal.
- **Homoglyphs and reserved names.** Cyrillic `а` and Latin `a` are pixel-identical. Without a confusables mapping, `pаypal` (with a Cyrillic `a`) reads as available and can impersonate `paypal`. A reserved-name list (`admin`, `root`, `support`, `api`) blocks impersonation of your own system.

The rule that ties it together: the availability check and the unique constraint must operate on the *same* canonical key. If the pre-check normalizes differently than the insert, you have quietly reopened the race you thought you closed. The check clears a name in one form while the constraint guards another, and a duplicate slips through.

## The endpoint is an oracle

The entire design optimizes for cheap, instant answers to "does this exist?" That is also its weakness: the endpoint is a free enumeration oracle. Anyone can walk a wordlist and learn precisely which usernames are registered, a scrapable map of your userbase useful for targeted phishing, credential-stuffing, or plain competitive intelligence on who signed up. The very things that make it feel instant, a tiny payload, an edge cache, one debounced request, also make it cheap to abuse in bulk.

You cannot hide "taken" from a legitimate user, they need it. But you can make mass harvesting expensive: rate-limit per IP and per session, require an authenticated or token-bearing request, and treat the endpoint as attack surface rather than a static asset. The honest framing is that "available" versus "taken" is information disclosure by design, so the real question is how much of it you are willing to hand out for free.

## The real bottleneck is the wire

Step back and look at the latency budget. The Bloom probe is a handful of memory reads, nanoseconds. The indexed lookup is microseconds to a few milliseconds. A cache hit is sub-millisecond. Add it all up and the server-side work is a rounding error next to the one thing nobody optimized away: the network round-trip. The request has to travel to the server and the answer has to travel back, and on a normal connection that is tens of milliseconds, an order of magnitude more than everything the server does combined.

The instinct to blame TCP is right, with one refinement. The full handshake, `SYN`, `SYN-ACK`, `ACK`, and the TLS negotiation layered on top, is a per-connection cost, not a per-check cost. The browser keeps the connection alive and reuses it, so a debounced availability request usually rides an already-open, already-encrypted socket. What you pay on every check is one round-trip time, plus a little for headers and the tiny payload. So the bottleneck is latency, the propagation delay across the wire, and the handshake only bites on the very first request. This is exactly why the two changes that most improve the "instant" feel are not database tricks at all: debouncing, so you send one request instead of ten, and edge proximity, so that one round-trip is short.

Which reframes what all the server-side cleverness is actually for. For a single check, the index and the Bloom filter optimize microseconds that the network then dwarfs. Their real job is scale: when billions of accounts are checked millions of times a second, the index keeps each lookup cheap and the Bloom filter keeps most of them off the database and disk entirely, so the system stays fast under load instead of melting. That is also why a Bloom filter is overkill at small scale, a few thousand rows fit in memory and any lookup is already instant, but indispensable once both the dataset and the query volume are large. It never makes one check faster than the network. It makes millions of them survivable.

## The one-line version

If you remember nothing else: **the millisecond feel is an engineering illusion built from an index, a Bloom filter, and edge proximity, while the actual guarantee that no two people share a username is a single unique constraint enforced at insert time.** Speed and correctness look like one feature. They are two, and they live in completely different places.

## References

- Bloom, B. H. (1970). *Space/Time Trade-offs in Hash Coding with Allowable Errors.* Communications of the ACM, 13(7), 422-426. The original paper that introduced the Bloom filter: [cacm.acm.org](https://cacm.acm.org/research/space-time-trade-offs-in-hash-coding-with-allowable-errors/) (DOI: 10.1145/362686.362692)
- Redis. *Bloom filter* (probabilistic data type reference, including the `BF.ADD` / `BF.EXISTS` semantics used above): [redis.io/docs](https://redis.io/docs/latest/develop/data-types/probabilistic/bloom-filter/)
- Redis. *Diagnosing latency issues* - documents the single-threaded command execution and how one slow command blocks every other client: [redis.io/docs](https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/latency/)
- PostgreSQL. *Unique Indexes* - how a unique constraint is enforced by an index: [postgresql.org/docs](https://www.postgresql.org/docs/current/indexes-unique.html)
- PostgreSQL. *Index Uniqueness Checks* - the atomic, insert-time enforcement that is the real source of truth: [postgresql.org/docs](https://www.postgresql.org/docs/current/index-unique-checks.html)

The formulas for optimal Bloom filter size (`m`) and hash count (`k`) are the standard results derived in the references above; the 2 billion / 1% figures are worked from them directly.
