---
title: 'From Bonjour to Tailscale - going remote, automatically (Part 2/2)'
description: 'The LAN foundation dies at your front door. Part 2 is the upgrade: reaching the Mac from anywhere over a Tailscale mesh with no server and no port-forwarding, choosing between the LAN and the tunnel automatically as you move, and the ATS trap that silently blocks it - plus why this is the architectural opposite of Claude Code''s /rc, and the security inversion that makes the fallback path the private one.'
date: 2026-07-24
tags: ['Networking', 'Bonjour', 'Tailscale', 'iOS', 'Systems Design', 'WebSockets']
heroImage: '../../assets/covers/from-bonjour-to-tailscale-part-2-tailscale.png'
---

> **Part 2 of 2.** [Part 1](/articles/from-bonjour-to-tailscale-part-1-lan/) built the foundation - a Mac and an iPhone talking directly over the LAN, with discovery, a bearer-token doorman, and a WebSocket observer model. This part takes that same connection out of the house over Tailscale, makes switching between networks automatic, and closes the cleartext hole Part 1 left open.

In [Part 1](/articles/from-bonjour-to-tailscale-part-1-lan/) I built the foundation and hammered on one architectural decision: the phone's entire networking layer knows nothing but **a base URL and a token.** That seam is the hero of this part too - because "reach the Mac from anywhere" turns out to be *"hand that layer a different URL,"* and "do it automatically" turns out to be *"pick the right URL without asking the user."* Nothing above the seam changes. That's the whole reason Part 2 is an upgrade and not a rewrite.

But everything in Part 1 dies at your front door. mDNS doesn't cross routers, the saved LAN IPs aren't routable from outside, and the token is riding in cleartext. So this part has three jobs: get out of the LAN without standing up a server, choose between the LAN and the remote path **automatically** as you move between networks, and - almost as a bonus - fix the cleartext problem.

## First, a look-alike worth separating: this is not `/rc`

If you use an AI coding terminal, you've probably seen the feature this whole series gets mistaken for. In Claude Code you type `/remote-control` (or just `/rc`), and a moment later you're driving that same terminal session from your phone on the train - Gemini CLI and friends ship variations of the same trick. From the couch, that looks *identical* to what I'm building: "my phone controls a thing running on my machine at home, from anywhere." The confusion is completely reasonable, and the two designs are almost perfect opposites.

`/rc` works because **the vendor already owns an always-on server**. Your CLI opens an *outbound* connection to the vendor's cloud, your phone talks to that same cloud through your vendor account, and the cloud relays between them. It's a beautiful fit for what it is: zero networking setup, no ports, no VPN, works behind any NAT - precisely because every byte of the session transits the vendor's infrastructure, authentication is your vendor login, and the only thing reachable on your machine is that one product's session.

This series is the other branch of the tree. The constraint from Part 1 - a secret that must **never** leave the Mac, and no third machine you have to trust - rules the relay model out from the first sentence. So instead:

- **Who sits in the middle:** for `/rc`, the vendor's relay carries the session. Here, nothing carries the traffic - phone and Mac talk directly; Tailscale's coordination service only *introduces* them and steps out of the data path.
- **What authenticates you:** there, your cloud account. Here, a bearer token exchanged out-of-band at pairing - no account, no third party to phish or subpoena.
- **What's reachable:** there, one product's session. Here, an arbitrary HTTP+WebSocket surface you own end to end.
- **What fails when the internet-scale service is down:** there, the feature. Here, the LAN path doesn't even notice.

Neither is "better" - they solve for different trust models. `/rc` sells convenience by assuming you trust the vendor with the session; this design buys sovereignty by making you do the plumbing yourself. The rest of this part is that plumbing. Just don't let the identical demo - phone drives Mac from a train - fool you into thinking they're the same architecture underneath.

## Problem 4: getting out of the LAN without a server

To reach the Mac from anywhere, the tempting options are all bad:

- **Port-forward + dynamic DNS.** You've now published your engine to the entire internet and made your router's firewall the only thing between a private key and a botnet. Also, increasingly moot: many ISPs put you behind carrier-grade NAT (one public address shared across many customers, so you never get your own), which means there's no public port to forward in the first place.
- **A relay server on a VPS.** It works, but it reintroduces the exact thing the constraints forbade - a second always-on machine you have to trust, secure, and pay for, with your traffic passing through it.

The move that actually fits the constraints is a **WireGuard mesh** - WireGuard being a modern, fast, open-source VPN protocol - which is what Tailscale gives you with the operational pain removed. Both devices join a private network (a "tailnet"); each gets a stable address in the CGNAT range `100.64.0.0/10` (a block of addresses reserved for exactly this kind of private, carrier-style networking); traffic between them is end-to-end encrypted and finds its own way through the routers and firewalls in between. Crucially, from the app's point of view a tailnet address is *just another URL* - `http://100.101.102.103:42817`. This is the dividend of the Part 1 seam: the transport layer never learns that "away" is different from "home." Tailscale simply adds one more entry to the `urls` list the phone already carries from pairing.

## Adding automatic on top

Now the phone has several candidate addresses - a LAN IP, a `.local` name, a tailnet IP - and some are reachable right now and some aren't, depending on where you're standing. The lazy design makes the user pick, or makes the app *guess* which network it's on. Guessing is fragile and always wrong at the boundary: walking out the door, joining a VPN, a flaky hotspot. **The automatic layer is the interesting engineering of this part**, and it has three moving pieces.

**Race, don't guess.** Instead of deciding which network it's on, the phone probes *every* candidate concurrently with a short health check and adopts the reachable one with the best priority:

<figure class="bf-figure">
<div class="bf-scroll">
<svg viewBox="0 0 700 300" role="img" aria-labelledby="raceT raceD" style="font-family:inherit">
<title id="raceT">Probe every candidate, adopt the best reachable one</title>
<desc id="raceD">The phone sends a concurrent health probe to every known address. It adopts the reachable one with the lowest priority number: private LAN beats unknown beats Tailscale. At home the LAN answers and wins; away, only the Tailscale address answers.</desc>
<defs>
<marker id="rcAc" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="var(--accent)"></path></marker>
<marker id="rcAn" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="var(--fg-muted)"></path></marker>
<style>
.rc-box{fill:var(--bg-subtle);stroke:var(--border-strong);stroke-width:1.5}
.rc-win{fill:var(--accent-soft);stroke:var(--accent);stroke-width:1.6}
.rc-t{fill:var(--fg);font-size:13px;font-weight:700}
.rc-s{fill:var(--fg-muted);font-size:11px}
.rc-a{fill:var(--accent-text);font-size:12px;font-weight:700}
.rc-p{fill:var(--fg-faint);font-size:11px;font-weight:700}
</style>
</defs>
<rect class="rc-box" x="24" y="112" width="120" height="60" rx="10"></rect>
<text class="rc-t" x="84" y="138" text-anchor="middle">phone</text>
<text class="rc-s" x="84" y="157" text-anchor="middle">GET /health</text>
<rect class="rc-win" x="300" y="30" width="250" height="50" rx="9"></rect>
<text class="rc-t" x="318" y="52">192.168.1.20 : 42817</text>
<text class="rc-s" x="318" y="69">private LAN</text>
<text class="rc-p" x="470" y="52">priority 0</text>
<text class="rc-a" x="470" y="69">answers -&gt; win</text>
<rect class="rc-box" x="300" y="92" width="250" height="50" rx="9"></rect>
<text class="rc-t" x="318" y="114">my-mac.local : 42817</text>
<text class="rc-s" x="318" y="131">mDNS name</text>
<text class="rc-p" x="470" y="122">priority 1</text>
<rect class="rc-box" x="300" y="154" width="250" height="50" rx="9"></rect>
<text class="rc-t" x="318" y="176">100.101.102.103 : 42817</text>
<text class="rc-s" x="318" y="193">Tailscale CGNAT</text>
<text class="rc-p" x="470" y="184">priority 2</text>
<line x1="146" y1="132" x2="296" y2="55" stroke="var(--accent)" stroke-width="2" marker-end="url(#rcAc)"></line>
<line x1="146" y1="142" x2="296" y2="117" stroke="var(--fg-muted)" stroke-width="1.5" marker-end="url(#rcAn)"></line>
<line x1="146" y1="152" x2="296" y2="179" stroke="var(--fg-muted)" stroke-width="1.5" marker-end="url(#rcAn)"></line>
<text class="rc-s" x="24" y="250">At home the LAN address answers first and wins on priority.</text>
<text class="rc-s" x="24" y="270">On a train, LAN and .local time out; only 100.x answers, so Tailscale is adopted automatically.</text>
</svg>
</div>
<figcaption>A concurrent health probe across every candidate, then adopt the reachable address with the best priority. The phone never has to know which network it's on - it just tries them all and lets reachability decide.</figcaption>
</figure>

**Self-heal the candidate list.** Right after adopting a connection, the phone asks the Mac for its current address list and merges in anything new - so a phone paired *before* you installed Tailscale learns its `100.x` address on the next connection at home, with no re-pairing. The pairing QR is a starting point, not a permanent contract.

**Re-race on every network change.** A network-path monitor (`NWPathMonitor`, debounced because interfaces flap) re-runs the race whenever connectivity changes. This is the piece that silently flips you from LAN to Tailscale as you walk out the door - and back to LAN when you get home - without a tap. "Automatic" isn't one feature; it's these three: a race for *which*, self-heal for *what's known*, and a path monitor for *when to re-decide*.

You might reasonably ask why bother keeping the LAN path at all, when the tunnel reaches everywhere. Two reasons: the direct LAN hop is simply faster - no coordination round-trip, no risk of relaying through a distant server - and it still works if the tailnet or its coordination service is having a bad day. The priority ladder exists precisely so you *default* to the fast local path when it's there and lean on the tunnel only when you must. (The mirror-image question - why not route through Tailscale even at home, so nothing is ever sent in the clear? - is a real and arguably better option for security, which I get to below.)

## How the infrastructure evolved

It's worth seeing the whole arc, because each stage only ever added something *beneath* the URL-and-token seam - never above it. That's why none of this required touching a single view model or feature.

<figure class="bf-figure">
<div class="bf-scroll">
<svg viewBox="0 0 700 210" role="img" aria-labelledby="evoT evoD" style="font-family:inherit">
<title id="evoT">How the infrastructure evolved</title>
<desc id="evoD">Three stages: LAN only with Bonjour and saved IPs reaching the same network; adding Tailscale for a tailnet address reachable anywhere over an encrypted tunnel; adding automatic path selection so switching is hands-off.</desc>
<defs>
<marker id="evAr" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="var(--fg-muted)"></path></marker>
<style>
.ev-box{fill:var(--bg-subtle);stroke:var(--border-strong);stroke-width:1.5}
.ev-win{fill:var(--accent-soft);stroke:var(--accent);stroke-width:1.6}
.ev-t{fill:var(--fg);font-size:15px;font-weight:700}
.ev-s{fill:var(--fg-muted);font-size:11.5px}
.ev-r{fill:var(--accent-text);font-size:11.5px;font-weight:700}
.ev-cap{fill:var(--fg-faint);font-size:12px;font-weight:700;letter-spacing:0.04em}
</style>
</defs>
<text class="ev-cap" x="350" y="26" text-anchor="middle">HOW THE INFRASTRUCTURE EVOLVED</text>
<rect class="ev-box" x="24" y="56" width="190" height="128" rx="12"></rect>
<text class="ev-t" x="119" y="92" text-anchor="middle">LAN only</text>
<text class="ev-s" x="119" y="120" text-anchor="middle">Bonjour + saved IPs</text>
<text class="ev-s" x="119" y="140" text-anchor="middle">cleartext, same subnet</text>
<text class="ev-r" x="119" y="166" text-anchor="middle">reach: same network</text>
<rect class="ev-box" x="255" y="56" width="190" height="128" rx="12"></rect>
<text class="ev-t" x="350" y="92" text-anchor="middle">+ Tailscale</text>
<text class="ev-s" x="350" y="120" text-anchor="middle">a 100.x tailnet URL</text>
<text class="ev-s" x="350" y="140" text-anchor="middle">encrypted tunnel</text>
<text class="ev-r" x="350" y="166" text-anchor="middle">reach: anywhere</text>
<rect class="ev-win" x="486" y="56" width="190" height="128" rx="12"></rect>
<text class="ev-t" x="581" y="92" text-anchor="middle">+ Automatic</text>
<text class="ev-s" x="581" y="120" text-anchor="middle">race + path monitor</text>
<text class="ev-s" x="581" y="140" text-anchor="middle">no user choice</text>
<text class="ev-r" x="581" y="166" text-anchor="middle">reach: hands-off</text>
<line x1="216" y1="120" x2="253" y2="120" stroke="var(--fg-muted)" stroke-width="1.8" marker-end="url(#evAr)"></line>
<line x1="447" y1="120" x2="484" y2="120" stroke="var(--fg-muted)" stroke-width="1.8" marker-end="url(#evAr)"></line>
</svg>
</div>
<figcaption>LAN only, then a tailnet URL for reach, then a selection layer for hands-off switching. Every stage is additive and lives below the seam, so the app above it never noticed the ground shifting.</figcaption>
</figure>

## The platform fights you: the ATS trap

Before any of this works on iOS, there's one gotcha that isn't in any tutorial and costs you an evening. Everything here is **cleartext HTTP**, and iOS App Transport Security blocks cleartext by default. Fine - you disable ATS. And then, being conscientious, you reach for the setting that *sounds* like the safe, scoped version of that: `NSAllowsLocalNetworking`. That is the trap.

Here's the mechanism. ATS exceptions are expressed **per domain**. Tailscale hands out bare numeric addresses in `100.64.0.0/10` - there is no domain to attach an exception to. So the only thing that permits the Tailscale connection is a blanket allowance:

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <!-- Cleartext is safe here: the LAN path is a trusted local network and the
         remote path rides inside Tailscale's WireGuard tunnel (E2E encrypted).
         ATS can't scope an exception to Tailscale's 100.64.0.0/10 CGNAT range
         (exceptions are per-domain), so ATS is disabled wholesale.
         Do NOT add NSAllowsLocalNetworking - when present, iOS ignores
         NSAllowsArbitraryLoads for non-local ranges, which silently re-enables
         ATS for the Tailscale 100.x address and blocks the connection. -->
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

The moment you *also* set `NSAllowsLocalNetworking`, iOS reinterprets `NSAllowsArbitraryLoads` as scoped to local ranges only. Your `192.168.x` connection keeps working - so it looks like you configured it *more* correctly - but `100.x` is no longer "local," ATS snaps back on for it, and the remote connection dies with an opaque failure. LAN works, Tailscale doesn't, and the broken plist reads as the more careful one.

<figure class="bf-figure">
<div class="bf-scroll">
<svg viewBox="0 0 700 240" role="img" aria-labelledby="atsT atsD" style="font-family:inherit">
<title id="atsT">Why adding NSAllowsLocalNetworking breaks Tailscale</title>
<desc id="atsD">With arbitrary loads alone, both the LAN address and the Tailscale 100.x address are permitted. Adding NSAllowsLocalNetworking re-enables ATS for non-local ranges, so the LAN address still works but the Tailscale address is blocked.</desc>
<defs>
<style>
.at-col{fill:var(--bg-subtle);stroke:var(--border-strong);stroke-width:1.5}
.at-ok{fill:var(--accent-soft);stroke:var(--accent);stroke-width:1.4}
.at-no{fill:none;stroke:var(--border-strong);stroke-width:1.4;stroke-dasharray:5 4}
.at-h{fill:var(--fg);font-size:13px;font-weight:700}
.at-s{fill:var(--fg-muted);font-size:11.5px}
.at-ay{fill:var(--accent-text);font-size:12px;font-weight:700}
.at-an{fill:var(--fg-faint);font-size:12px;font-weight:700}
</style>
</defs>
<rect class="at-col" x="24" y="24" width="316" height="192" rx="12"></rect>
<text class="at-h" x="182" y="50" text-anchor="middle">ArbitraryLoads only</text>
<text class="at-s" x="182" y="70" text-anchor="middle">the config that works</text>
<rect class="at-ok" x="48" y="88" width="268" height="44" rx="8"></rect>
<text class="at-s" x="66" y="106">192.168.1.20 &middot; LAN</text>
<text class="at-ay" x="300" y="115" text-anchor="end">allowed</text>
<rect class="at-ok" x="48" y="144" width="268" height="44" rx="8"></rect>
<text class="at-s" x="66" y="162">100.101.102.103 &middot; Tailscale</text>
<text class="at-ay" x="300" y="171" text-anchor="end">allowed</text>
<rect class="at-col" x="360" y="24" width="316" height="192" rx="12"></rect>
<text class="at-h" x="518" y="50" text-anchor="middle">+ LocalNetworking</text>
<text class="at-s" x="518" y="70" text-anchor="middle">looks safer, silently breaks</text>
<rect class="at-ok" x="384" y="88" width="268" height="44" rx="8"></rect>
<text class="at-s" x="402" y="106">192.168.1.20 &middot; LAN</text>
<text class="at-ay" x="636" y="115" text-anchor="end">allowed</text>
<rect class="at-no" x="384" y="144" width="268" height="44" rx="8"></rect>
<text class="at-s" x="402" y="162">100.101.102.103 &middot; Tailscale</text>
<text class="at-an" x="636" y="171" text-anchor="end">blocked</text>
</svg>
</div>
<figcaption>Same intent, one extra key. The "local networking" exception scopes arbitrary loads back down to local ranges, so the non-local Tailscale address quietly falls back under ATS and fails.</figcaption>
</figure>

## The security payoff, and an uncomfortable inversion

Disabling ATS wholesale sounds reckless, so be precise about the threat model rather than superstitious about the setting. And here's where Part 2 quietly repays a debt from Part 1. Back on the LAN, the bearer token travels in cleartext - anyone on the same Wi-Fi can lift it. The Tailscale path has no such problem: it rides inside WireGuard, which is end-to-end encrypted and authenticated at the tunnel layer. Which leads somewhere counterintuitive:

<figure class="bf-figure">
<div class="bf-scroll">
<svg viewBox="0 0 700 200" role="img" aria-labelledby="secT secD" style="font-family:inherit">
<title id="secT">The path I lean on is the one with no encryption</title>
<desc id="secD">The LAN path is cleartext HTTP with the bearer token in the clear, exposed to anyone on the network. The Tailscale path rides an encrypted, authenticated WireGuard tunnel and is opaque on the wire. The convenient path is the insecure one.</desc>
<defs>
<style>
.sc-col{fill:var(--bg-subtle);stroke:var(--border-strong);stroke-width:1.5}
.sc-h{fill:var(--fg);font-size:15px;font-weight:700}
.sc-s{fill:var(--fg-muted);font-size:11.5px}
.sc-line{fill:var(--fg);font-size:13px;font-weight:600}
.sc-bad{fill:none;stroke:var(--border-strong);stroke-width:1.4;stroke-dasharray:5 4}
.sc-badt{fill:var(--fg-faint);font-size:12px;font-weight:700}
.sc-good{fill:var(--accent-soft);stroke:var(--accent);stroke-width:1.4}
.sc-goodt{fill:var(--accent-text);font-size:12px;font-weight:700}
</style>
</defs>
<rect class="sc-col" x="24" y="20" width="316" height="160" rx="12"></rect>
<text class="sc-h" x="182" y="48" text-anchor="middle">LAN path</text>
<text class="sc-s" x="182" y="67" text-anchor="middle">the convenient one</text>
<text class="sc-line" x="182" y="100" text-anchor="middle">cleartext HTTP</text>
<text class="sc-s" x="182" y="120" text-anchor="middle">bearer token sent in the clear</text>
<rect class="sc-bad" x="48" y="138" width="268" height="30" rx="8"></rect>
<text class="sc-badt" x="182" y="157" text-anchor="middle">exposed to anyone on the network</text>
<rect class="sc-col" x="360" y="20" width="316" height="160" rx="12"></rect>
<text class="sc-h" x="518" y="48" text-anchor="middle">Remote path</text>
<text class="sc-s" x="518" y="67" text-anchor="middle">the one I called a fallback</text>
<text class="sc-line" x="518" y="100" text-anchor="middle">WireGuard tunnel</text>
<text class="sc-s" x="518" y="120" text-anchor="middle">encrypted + authenticated</text>
<rect class="sc-good" x="384" y="138" width="268" height="30" rx="8"></rect>
<text class="sc-goodt" x="518" y="157" text-anchor="middle">opaque on the wire</text>
</svg>
</div>
<figcaption>The inversion worth sitting with: the LAN path I reach for on grounds of speed is the one with no transport security, while the Tailscale path I framed as the fallback is the only one that is actually private.</figcaption>
</figure>

So ATS's job - stop *accidental* plaintext leaking to the public internet - is one there's nothing here to do: the remote path is encrypted by construction, and the LAN path never touches the public internet. You've removed the hazard, so you can remove the guard rail whose only job was to warn you about it. But the honest reading is that the *LAN* path still leaks the token to anyone sharing the network, and the real fix isn't subtle: put TLS with a pinned self-signed certificate on the listener, or refuse to speak cleartext at all and route even the at-home connection through the tailnet so WireGuard is always in the path. That `v` field in the pairing payload from Part 1 is me admitting, in a struct member, that I already know this isn't the final transport.

## Where this strains

A design you can't criticize is one you haven't understood. Four places where the tidy version frays:

- **The race trades latency for priority.** To *prefer* the LAN address you have to wait for it to answer or time out, so every cold reconnect while you're away pays the full probe timeout before adopting Tailscale - the "instant" reconnection is only instant at home. Adopt the first responder instead and you throw away the priority ordering that was the point.
- **Resync across a reconnect is wholesale.** The `seq`-gap trick from Part 1 catches an event missed *within* a live socket, but the sequence resets on a new connection, so after any drop the client can't diff - it assumes it missed everything and refetches wholesale. On a flaky train connection that's a full resync every time the socket flaps.
- **"No server" has an asterisk.** Tailscale is a mesh, but there's a coordination service you depend on to introduce devices and exchange keys, and when two devices can't establish a direct path the traffic falls back through Tailscale's DERP relays - relay servers that forward the traffic when no direct link is possible. It stays end-to-end encrypted, so the relay can't read it, but now there's latency and a third party in your availability story. And the Mac is a single point of failure: it sleeps, a power nap suspends the process, and the "live remote" is a spinner.
- **The sidecar is a babysitting job.** The engine is a separate helper process the Mac launches and supervises (the sidecar), which means shipping a runtime, minding its lifecycle, and making sure a force-quit app doesn't leak an orphaned process squatting on the port.

None of this sinks the design - I ship it and I'd build it this way again. But if you read both parts nodding along and didn't stop cold at the cleartext token, *that's* the bug worth catching, not any line of the code.

## The one-line version

Across both parts: **a live, serverless remote for a machine is four problems - a moving address (Bonjour), an untrusted network (a bearer token paired out-of-band), liveness (a WebSocket treated as a hint over authoritative REST), and escaping the LAN (a WireGuard mesh) - unified by one rule, that the app knows only a URL and a token.** Get that seam right in Part 1 and Part 2 is just handing it better URLs: the whole leap from "works at home" to "works anywhere, automatically" happens beneath a line the rest of the app never sees.

## Postscript: the seam kept paying

Since these two parts were written, the app grew a third act that's worth a coda, because it stress-tested every claim above. The remote stopped being *my* remote: the design now admits other people's phones - customers holding a **license key** instead of the pairing QR. How a device connects decides what it is: the Part 1 pairing grants the full admin surface, a license key admits a read-mostly tier that sees exactly what the role ceiling allows and nothing else, and expiry demotes it further - all enforced at the same doorman that once checked a single bearer token.

And reach grew the same way everything else did - as **more URLs below the seam.** A tailnet address only serves people you've invited into your VPN, which is fine for one owner and useless for a customer. So the ladder gained two rungs: **Tailscale Funnel**, which publishes the Mac on a real public `https://<mac>.<tailnet>.ts.net` address - the customer's phone needs no Tailscale, no app, nothing - and a custom domain over a Cloudflare Tunnel for the same thing under your own name. Both are still outbound-only from the Mac: no port-forwarding, no exposed router, and the tunnel bridges *only* the remote-access port, never the loopback door where the operator's authority lives.

Two of this article's sore points quietly resolved along the way. The public paths are **real HTTPS with real certificates**, so the cleartext-token confession above no longer applies to the path strangers use - the `v` field finally cashed its promise. And the phone's networking layer, which never learned the difference between `192.168.x` and `100.x`, also never learned the difference between those and a public `.ts.net` hostname. Three infrastructure generations, zero changes above the seam. That's the strongest evidence I can offer for the one rule this series keeps repeating.

## Resources

Going remote:

- [How Tailscale works](https://tailscale.com/blog/how-tailscale-works)
- [Tailscale - MagicDNS](https://tailscale.com/kb/1081/magicdns)
- [Tailscale Funnel](https://tailscale.com/kb/1223/funnel)
- [WireGuard protocol](https://www.wireguard.com/protocol/)

Connectivity and the platform:

- [NWPathMonitor](https://developer.apple.com/documentation/network/nwpathmonitor)
- [App Transport Security keys (NSAppTransportSecurity)](https://developer.apple.com/documentation/bundleresources/information-property-list/nsapptransportsecurity)

The underlying standard:

- [RFC 6598 - Shared Address Space (100.64.0.0/10)](https://www.rfc-editor.org/rfc/rfc6598)

Missed the foundation? Start with [Part 1: syncing a Mac and an iPhone over the LAN](/articles/from-bonjour-to-tailscale-part-1-lan/).

## Let's Connect

LinkedIn:
[https://www.linkedin.com/in/egzon-pllana](https://www.linkedin.com/in/egzon-pllana)
