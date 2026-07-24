---
title: 'From Bonjour to Tailscale - syncing a Mac and an iPhone over the LAN (Part 1/2)'
description: 'One machine holds the state and a secret it can never surrender. You want your phone as a live remote for it, with no cloud in the middle. Part 1 is the foundation: how the two apps find each other, authenticate, and stay live over your local network - discovery, a bearer-token doorman, and a WebSocket observer model.'
date: 2026-07-24
tags: ['Networking', 'Bonjour', 'Tailscale', 'iOS', 'Systems Design', 'WebSockets']
heroImage: '../../assets/covers/from-bonjour-to-tailscale-part-1-lan.png'
---

> **Part 1 of 2.** This part gets a Mac and an iPhone talking directly over your local network - discovery, a live channel, and a doorman - and nails down the one architectural decision the whole thing rests on. [Part 2](/articles/from-bonjour-to-tailscale-part-2-tailscale/) takes that same connection out of the house over Tailscale and makes switching between networks automatic.

Here is a shape of problem that shows up more often than people admit: a single machine does the real work - it runs a long-lived process, and it holds a secret (a private key, a credential, a decrypted store) that must **never** leave it. You want your phone to be a live, first-class remote for that machine. Not a screenshot, not a "sync to the cloud and read it back" - the phone actually driving and reflecting the state on the Mac, in real time.

The obvious answer is "stand up a backend." But a backend is exactly what the constraints forbid: it means the secret leaves the machine, or you build a second trusted system to hold it. So the interesting version of the question is whether the phone can talk **directly** to the Mac, with the secret staying put and no server in the middle.

This first part is about the foundation - just the LAN. Before you can dream about reaching the Mac from a train (that's Part 2), you have to solve the smaller, sharper problem of two apps on the *same* network finding each other and communicating in real time. That breaks into three sub-problems, each with a naive solution that quietly fails, plus the single decision that ties them together and makes the whole series possible.

## The constraints write the architecture

Almost every decision downstream comes from being honest about what the constraints actually dictate:

- The state and the secret live on **one machine**. That rules out a cloud backend as the source of truth. The Mac is the source of truth; the phone is a window onto it.
- The phone must feel **live** - an action on the phone reflects on the Mac and vice versa, now, not on a 10-second poll.
- The moment it stops being a loopback connection - loopback being traffic that never leaves the machine, `127.0.0.1` - it's a real network listener that others can reach, so it needs **authentication**, not as a nice-to-have but as table stakes.

<figure class="bf-figure">
<div class="bf-scroll">
<svg viewBox="0 0 700 300" role="img" aria-labelledby="topoT topoD" style="font-family:inherit">
<title id="topoT">Two clients, one sidecar, two doors</title>
<desc id="topoD">The Mac app reaches the sidecar over loopback. The phone reaches the same sidecar's remote listener over the LAN or, later, over a Tailscale tunnel. Both doors share one router and one event bus.</desc>
<defs>
<marker id="tpAr" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="var(--fg-muted)"></path></marker>
<marker id="tpAc" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="var(--accent)"></path></marker>
<style>
.tp-box{fill:var(--bg-subtle);stroke:var(--border-strong);stroke-width:1.5}
.tp-core{fill:var(--bg-subtle);stroke:var(--border-strong);stroke-width:1.5}
.tp-port{fill:var(--accent-soft);stroke:var(--accent);stroke-width:1.4}
.tp-t{fill:var(--fg);font-size:15px;font-weight:700}
.tp-s{fill:var(--fg-muted);font-size:11.5px}
.tp-m{fill:var(--fg-muted);font-size:12px;font-weight:600}
.tp-a{fill:var(--accent-text);font-size:12px;font-weight:700}
</style>
</defs>
<rect class="tp-box" x="24" y="34" width="150" height="60" rx="10"></rect>
<text class="tp-t" x="99" y="60" text-anchor="middle">Mac app</text>
<text class="tp-s" x="99" y="80" text-anchor="middle">on the same box</text>
<rect class="tp-box" x="24" y="206" width="150" height="60" rx="10"></rect>
<text class="tp-t" x="99" y="232" text-anchor="middle">iPhone</text>
<text class="tp-s" x="99" y="252" text-anchor="middle">live remote</text>
<rect class="tp-core" x="430" y="34" width="246" height="232" rx="12"></rect>
<text class="tp-t" x="553" y="62" text-anchor="middle">the sidecar</text>
<text class="tp-s" x="553" y="82" text-anchor="middle">one router &middot; one event bus</text>
<rect class="tp-port" x="452" y="104" width="202" height="46" rx="8"></rect>
<text class="tp-m" x="553" y="125" text-anchor="middle">loopback door</text>
<text class="tp-s" x="553" y="142" text-anchor="middle">127.0.0.1 : ephemeral</text>
<rect class="tp-port" x="452" y="176" width="202" height="46" rx="8"></rect>
<text class="tp-m" x="553" y="197" text-anchor="middle">remote door</text>
<text class="tp-s" x="553" y="214" text-anchor="middle">0.0.0.0 : 42817</text>
<line x1="176" y1="64" x2="448" y2="118" stroke="var(--fg-muted)" stroke-width="1.6" marker-end="url(#tpAr)"></line>
<text class="tp-s" x="300" y="80">localhost</text>
<line x1="176" y1="236" x2="448" y2="200" stroke="var(--accent)" stroke-width="2" marker-end="url(#tpAc)"></line>
<text class="tp-a" x="250" y="176">LAN</text>
<path d="M176,250 C280,290 360,270 448,214" fill="none" stroke="var(--fg-muted)" stroke-width="1.8" stroke-dasharray="7 7" marker-end="url(#tpAr)"></path>
<text class="tp-m" x="286" y="284">Tailscale (Part 2)</text>
</svg>
</div>
<figcaption>The Mac app and the phone talk to the <em>same</em> sidecar. Only the door differs: loopback for the local app, a remote listener for the phone. In Part 1 the phone reaches that remote door over the LAN; Part 2 adds the dashed Tailscale path.</figcaption>
</figure>

The engine itself runs as a small helper process that the Mac launches and supervises alongside itself - a pattern commonly called a **sidecar** (a companion process that does one job for a main app, running next to it rather than inside it). Everything the phone and the Mac consume is served by one HTTP + WebSocket server inside that sidecar. That server has two listeners that share one router and one event bus; only the bind address and the accepted credential differ. Hold that picture: from here on, the whole story is *how the phone gets a working URL for the remote door, and what it does once it has one.*

## But couldn't this all just run on the iPhone?

It's the first question worth getting out of the way, because the whole architecture is a consequence of the answer. Two reasons, one practical and one by design.

Practically, iOS is a hostile host for a long-lived engine. Apps there are sandboxed and aggressively suspended the moment they leave the foreground - you can't keep a process quietly working in the background for hours, you can't spawn an arbitrary child process or ship a general-purpose runtime to run one, and you can't hold a listening socket open the way a desktop can. The engine needs a machine that simply stays awake and lets a process keep running: a Mac (or any always-on desktop), not a phone asleep in your pocket.

By design, the entire point is that the secret lives on exactly one trusted machine and never travels. A phone is the *worst* place to pin a long-lived key - it's the device most likely to be lost, stolen, or handed across a repair counter. Keeping the key on the Mac and making the phone a window means losing the phone loses nothing but a token you can revoke in seconds.

So the split isn't a limitation to apologize for - it *is* the design: the Mac is the vault and the workhorse, the phone is the remote control. (This is also why the engine runs as its own sidecar rather than living inside the Mac's app: a separate process can be written in whatever runtime the engine needs, crash and restart without taking the UI down, and expose one clean network surface that the Mac app and the phone consume identically.) Everything that follows is downstream of this division of labor.

## Problem 1: the address refuses to hold still

The naive first attempt is to type the Mac's IP into the phone. It works for exactly as long as the DHCP lease holds. Reboot the router, rejoin the Wi-Fi, let the lease expire, and `192.168.1.20` is now the smart TV. Hardcoding an address on a consumer network is building on sand.

This is precisely what **Bonjour** exists to solve - and yes, that's *bonjour*, French for "hello." It's just Apple's brand name for the technology, and an apt one, because the whole job of the protocol is devices greeting each other on the network to work out who's around. Under the friendly name, Bonjour is Apple's implementation of two small open standards - **mDNS** (multicast DNS) and **DNS-SD** (DNS-based service discovery) - that together let devices find each other on a local network with no router configuration, no central DNS server, and nothing typed by hand. The trick is that instead of asking a server "what is the address of `my-mac`?", a device *multicasts* the question to everyone on the subnet, and the machine that owns that name answers for itself. DNS-SD adds a layer on top: devices don't just resolve names, they advertise **services** by type - "I offer an `_myengine._tcp` service on port 42817" - so a client can ask "who here offers this kind of service?" and get back a live list. It's the same machinery behind AirPrint finding your printer and AirPlay finding your TV.

Applied here: the Mac advertises its service ("there is an engine here, of this type, on this port") and the phone browses for that service type and resolves whoever answers. No address is ever typed; discovery is dynamic by construction.

The detail that earns its keep: I resolve to a **hostname**, `http://my-mac.local:42817`, not to the raw IP the browser hands back. The `.local` name is itself re-resolved by mDNS on every connection, so when DHCP shuffles the Mac to a new address, the URL keeps working with no re-pairing. That one choice deletes an entire category of "worked yesterday, broke today" tickets.

But discovery is a **convenience, never the source of truth**, and it's important to be clear-eyed about why. mDNS is a single-subnet protocol - it does not cross routers, and plenty of corporate, guest, and captive-portal networks block multicast outright. So Bonjour is how the phone *rediscovers* the Mac cheaply when it can, and the authoritative fallback is an explicit list of URLs the phone learned during pairing. Discovery accelerates the common case; the saved list guarantees the general one.

> Classic `NetService` still works everywhere, but Apple now steers you to the `Network` framework's `NWListener` / `NWBrowser`. Same concepts, newer API - pick per your deployment target.

## Problem 2: a listener on the network needs a doorman

The moment you bind to `0.0.0.0` instead of loopback, you have created a real service that anyone on the network can reach. On your home Wi-Fi that's your family; on café Wi-Fi that's everyone. An unauthenticated engine that holds a private key is not a feature, it's an incident waiting for a port scan.

So every request carries a **bearer token**, and the interesting engineering is in how that token is established and checked, not in the header itself.

**Establish it out-of-band.** The Mac shows a QR code; the phone scans it. That sidesteps the whole "how do two devices agree on a secret over an untrusted channel" problem by using a channel an attacker isn't on - your eyes. The QR encodes a small, versioned payload:

```json
{
  "v": 1,
  "name": "my-mac",
  "urls": ["http://192.168.1.20:42817", "http://my-mac.local:42817"],
  "token": "u3n1c0rn-base64url-32-random-bytes"
}
```

Three things are doing real work here. The `urls` array is the Mac listing *every* address it believes it's reachable at, LAN-first - this is the authoritative fallback from Problem 1 (and in Part 2 it grows a Tailscale entry, which is what lets one pairing work both at home and away). The `token` is 32 random bytes encoded base64url so it survives being a QR and a URL. And `v` versions the whole scheme, so the transport can grow a TLS or cert-pinning story later without breaking old pairings.

**Use two tokens, not one.** The loopback door and the remote door get *separate* credentials: a per-launch token for localhost that never touches disk, and a persistent token for paired phones kept in the Keychain (it's a secret, so it lives where secrets live). Keeping them distinct means rotating the phone's access - or revoking a lost phone - never disturbs the local app, and vice versa.

**Compare it in constant time.** A naive `token == expected` leaks length and, byte by byte, content through timing. Secret comparisons use a constant-time equality (`timingSafeEqual` and friends) so a network attacker can't feel their way to the token one microsecond at a time. It's a small thing that is a real hole if you skip it.

There's a subtle iOS wrinkle worth flagging: the **first** connection your app makes to a local address triggers the system Local Network permission prompt, and that prompt races your request - your very first probe can fail purely because the user hasn't tapped "Allow" yet. So the pairing check probes twice, with a beat between rounds, and reports per-address diagnostics (`HTTP 401`, timeout, blocked) so a failed pairing tells you *why* instead of just spinning.

## How the two apps actually talk: REST for truth, a socket for hints

Now the interesting part - the communication model itself, because this is the architecture people most often get wrong. The phone needs to feel live, and the lazy way to do that is to poll: hit the REST API every couple of seconds and diff. That's wrong on every axis that matters: it drains the battery, it's laggy exactly when something just changed, and when many clients poll in lockstep you manufacture load spikes the system would never otherwise see.

So the design splits cleanly into two channels with two different jobs. **REST** (plain HTTP request/response) is for *truth*: give me the current items, the status, the config. **One WebSocket**, opened by the phone to an `/events` endpoint and authenticated with the same bearer token, is for *liveness*. And the key insight is not "use a WebSocket" - it's *what you let the socket mean*:

> The socket is a **hint stream**, not a source of truth. It tells you *when* something changed. REST tells you *what is true.*

That reframing is the whole reliability strategy, and it's cheaper than the alternative. Real sockets drop: phones sleep, Wi-Fi hiccups. If the socket were your source of truth you'd need acknowledgements, a replay buffer, guaranteed delivery - a small distributed-systems project. Instead, every message carries a **monotonically increasing sequence number**, and the client's entire correctness rule is: *if `seq` jumps, I missed something, so refetch the affected resource over REST.* No acks, no replay, no delivery guarantee. A gap is self-describing.

```json
{ "type": "item.updated", "seq": 47, "data": { "id": "…" } }
```

<figure class="bf-figure">
<div class="bf-scroll">
<svg viewBox="0 0 700 250" role="img" aria-labelledby="hintT hintD" style="font-family:inherit">
<title id="hintT">A gap in the sequence triggers a REST refetch</title>
<desc id="hintD">Events arrive with increasing sequence numbers. The phone sleeps and misses three. On reconnect the next sequence jumps from 43 to 47, a detectable gap, so the client refetches the truth over REST instead of trusting the stream.</desc>
<defs>
<marker id="hnAr" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="var(--accent)"></path></marker>
<style>
.hn-chip{fill:var(--bg-subtle);stroke:var(--border-strong);stroke-width:1.4}
.hn-live{fill:var(--accent-soft);stroke:var(--accent);stroke-width:1.5}
.hn-t{fill:var(--fg);font-size:13px;font-weight:700}
.hn-s{fill:var(--fg-muted);font-size:11.5px}
.hn-a{fill:var(--accent-text);font-size:12px;font-weight:700}
.hn-x{fill:var(--fg-faint);font-size:12px}
</style>
</defs>
<text class="hn-s" x="24" y="34">WebSocket /events - one seq per client</text>
<rect class="hn-live" x="24" y="46" width="70" height="40" rx="8"></rect><text class="hn-t" x="59" y="71" text-anchor="middle">41</text>
<rect class="hn-live" x="102" y="46" width="70" height="40" rx="8"></rect><text class="hn-t" x="137" y="71" text-anchor="middle">42</text>
<rect class="hn-live" x="180" y="46" width="70" height="40" rx="8"></rect><text class="hn-t" x="215" y="71" text-anchor="middle">43</text>
<rect class="hn-chip" x="262" y="46" width="150" height="40" rx="8" stroke-dasharray="5 5"></rect>
<text class="hn-x" x="337" y="65" text-anchor="middle">asleep -</text>
<text class="hn-x" x="337" y="80" text-anchor="middle">44, 45, 46 missed</text>
<rect class="hn-live" x="424" y="46" width="70" height="40" rx="8"></rect><text class="hn-t" x="459" y="71" text-anchor="middle">47</text>
<text class="hn-a" x="512" y="63">seq 43 -&gt; 47</text>
<text class="hn-a" x="512" y="80">= gap detected</text>
<line x1="459" y1="88" x2="459" y2="140" stroke="var(--accent)" stroke-width="1.8" marker-end="url(#hnAr)"></line>
<rect class="hn-chip" x="200" y="146" width="300" height="54" rx="10"></rect>
<text class="hn-t" x="350" y="170" text-anchor="middle">GET the affected resource over REST</text>
<text class="hn-s" x="350" y="189" text-anchor="middle">REST is the source of truth - resync, don't guess</text>
<text class="hn-s" x="24" y="226">The stream can drop, duplicate, or reorder; correctness never depends on it.</text>
</svg>
</div>
<figcaption>Treating the socket as advisory means a dropped connection costs one refetch, not a corrupted client. The sequence gap is the only reliability mechanism you need.</figcaption>
</figure>

### One event, many observers

Under that single socket sits a small pub/sub system, and it's worth seeing end to end because it's what makes the UI feel alive without any screen knowing where its data came from. On the **server**, anything that changes state - a poller noticing fresh data, a handler finishing a write - calls `emit(type, data)` on an in-process **event bus**. The WebSocket hub is the sole subscriber to that bus, and it fans each event out to every connected client. On the **client**, the incoming stream is itself observable: view models subscribe to it as **observers** (each holds an `AsyncStream` - an async sequence you can `await` new values from as they arrive over time), and one decoded event wakes up every screen that cares - the list, the badge, the detail view - with no direct wiring between them.

<figure class="bf-figure">
<div class="bf-scroll">
<svg viewBox="0 0 700 250" role="img" aria-labelledby="obsT obsD" style="font-family:inherit">
<title id="obsT">One event fans out to every observer</title>
<desc id="obsD">A change on the server is emitted to an event bus, sent as one WebSocket message, decoded into a client-side event stream, and fanned out to every view model observing it - the list, the badge, and the detail screen all update from the same event.</desc>
<defs>
<marker id="obAc" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="var(--accent)"></path></marker>
<marker id="obAn" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="var(--fg-muted)"></path></marker>
<style>
.ob-box{fill:var(--bg-subtle);stroke:var(--border-strong);stroke-width:1.5}
.ob-core{fill:var(--accent-soft);stroke:var(--accent);stroke-width:1.5}
.ob-t{fill:var(--fg);font-size:13px;font-weight:700}
.ob-s{fill:var(--fg-muted);font-size:11px}
.ob-a{fill:var(--accent-text);font-size:11px;font-weight:700}
</style>
</defs>
<rect class="ob-box" x="20" y="98" width="140" height="54" rx="10"></rect>
<text class="ob-t" x="90" y="122" text-anchor="middle">event bus</text>
<text class="ob-s" x="90" y="140" text-anchor="middle">emit(type, data)</text>
<line x1="160" y1="125" x2="204" y2="125" stroke="var(--accent)" stroke-width="2" marker-end="url(#obAc)"></line>
<rect class="ob-core" x="206" y="104" width="120" height="42" rx="9"></rect>
<text class="ob-t" x="266" y="125" text-anchor="middle">WebSocket</text>
<text class="ob-s" x="266" y="140" text-anchor="middle">one message</text>
<line x1="326" y1="125" x2="370" y2="125" stroke="var(--accent)" stroke-width="2" marker-end="url(#obAc)"></line>
<rect class="ob-box" x="372" y="98" width="130" height="54" rx="10"></rect>
<text class="ob-t" x="437" y="122" text-anchor="middle">event stream</text>
<text class="ob-s" x="437" y="140" text-anchor="middle">decoded, on device</text>
<rect class="ob-box" x="556" y="24" width="120" height="44" rx="9"></rect>
<text class="ob-t" x="616" y="50" text-anchor="middle">list view</text>
<rect class="ob-box" x="556" y="103" width="120" height="44" rx="9"></rect>
<text class="ob-t" x="616" y="129" text-anchor="middle">status badge</text>
<rect class="ob-box" x="556" y="182" width="120" height="44" rx="9"></rect>
<text class="ob-t" x="616" y="208" text-anchor="middle">detail screen</text>
<line x1="502" y1="120" x2="552" y2="52" stroke="var(--fg-muted)" stroke-width="1.5" marker-end="url(#obAn)"></line>
<line x1="502" y1="125" x2="552" y2="125" stroke="var(--fg-muted)" stroke-width="1.5" marker-end="url(#obAn)"></line>
<line x1="502" y1="130" x2="552" y2="200" stroke="var(--fg-muted)" stroke-width="1.5" marker-end="url(#obAn)"></line>
<text class="ob-a" x="512" y="90" text-anchor="middle">observers</text>
</svg>
</div>
<figcaption>The server emits once; the client fans out to many. Each view model is an observer on the same stream, so a single <code>item.updated</code> refreshes every screen that shows that item - no screen talks to the network directly.</figcaption>
</figure>

Two refinements keep that fan-out efficient. Events are **scoped**: the client tells the server `subscribe(gameIDs:)` for what's actually on screen, so a firehose of updates for things you aren't looking at never crosses the wire. And on the wire, a typed decoder maps each event's `type` string to a Swift enum case and **degrades loudly** - an unknown type is logged and dropped, never a crash. Everything else about the socket is ordinary hygiene: reconnect with exponential backoff plus jitter (so a flock of clients doesn't reconnect in a thundering wave), and re-send your subscriptions on reconnect because the server holds that state per-connection and a fresh connection starts empty.

## The architecture key: the app knows only a URL and a token

Step back and notice what makes all three sub-problems composable rather than tangled: the entire communication layer - REST client, WebSocket, decoder, observers - only ever knows **a base URL and a token.** It has no idea whether that URL points at loopback on the Mac, a LAN IP, a `.local` name, or (spoiler for Part 2) a tunnel. One small component holds the current base URL and swaps it; everything above that line is transport-agnostic.

That single decision is why the Mac app and the iPhone app run the *same* networking code: the Mac points the component at `127.0.0.1:<ephemeral>`, the phone points it at whichever paired URL is reachable. It's also why Part 2 is an *upgrade* and not a rewrite - adding Tailscale means adding one more candidate URL beneath this seam, and nothing above it changes.

If you steal one thing from this article, steal this: decide, on day one, the narrowest thing your app is allowed to know about the network - here, *a URL and a token* - and push every hard problem beneath it.

## Where the LAN version strains

I've told a clean story; the LAN foundation genuinely works, and at home it's fast and it feels like magic. But be honest about its soft spots, because two of them are exactly what Part 2 exists to fix.

**Discovery is flaky by nature.** mDNS is single-subnet and blocked on plenty of networks, so the moment the phone and Mac aren't on the same well-behaved LAN, Bonjour goes quiet and you're leaning entirely on the saved URL list - which is useless the instant those addresses aren't routable, i.e. the moment you leave the house.

**The token rides in the clear.** This is the uncomfortable one. Everything here is cleartext HTTP, so on the LAN the bearer token travels unencrypted. Any passive listener on the same network - a compromised smart bulb at home, anyone on shared Wi-Fi - can lift it straight off the wire. "Trusted local network" is a vibe, not a guarantee. I lean on it here because the LAN is a network you've chosen to trust, but it's a real limitation, and Part 2's tunnel turns out to fix it almost as a side effect.

## What Part 2 covers

Everything above dies at your front door. The LAN foundation is exactly that - a foundation - and it's deliberately the *easy* half: same network, short hops, a trust boundary you can hand-wave. The hard half is reaching the Mac from anywhere without a server, choosing between the LAN and that remote path **automatically** as you move between networks, and closing the cleartext hole - which is where Tailscale comes in.

[Continue to Part 2: going remote, automatically →](/articles/from-bonjour-to-tailscale-part-2-tailscale/)

## Resources

Discovery and the local network:

- [Bonjour Overview (Apple)](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/NetServices/Introduction.html)
- [Network framework: NWListener](https://developer.apple.com/documentation/network/nwlistener) and [NWBrowser](https://developer.apple.com/documentation/network/nwbrowser)
- [WWDC20 - Support local network privacy in your app](https://developer.apple.com/videos/play/wwdc2020/10110/)

Transport and liveness:

- [URLSessionWebSocketTask](https://developer.apple.com/documentation/foundation/urlsessionwebsockettask)
- [Keychain Services](https://developer.apple.com/documentation/security/keychain-services)
- [DataScannerViewController (VisionKit)](https://developer.apple.com/documentation/visionkit/datascannerviewcontroller)

The underlying standards:

- [RFC 6762 - Multicast DNS](https://www.rfc-editor.org/rfc/rfc6762)
- [RFC 6763 - DNS-Based Service Discovery](https://www.rfc-editor.org/rfc/rfc6763)

## Let's Connect

LinkedIn:
[https://www.linkedin.com/in/egzon-pllana](https://www.linkedin.com/in/egzon-pllana)
