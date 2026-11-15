# Ben · AI Health Coach: eight design directions

A clickable prototype of **Ben**, a face-to-face AI health coach, in eight very different visual directions. Each direction is a complete design for a different audience and use. All eight run on the same live Tavus video agent, so you can start a real conversation with Ben in any of them.

## Quick guide

**Run it**

```bash
npm install
npm run dev
```

Open the address it prints (for example `http://localhost:5173`). Allow the microphone and camera when you start a call with Ben.

**Switch between directions**

- **Dock:** the bar at the bottom of the screen. The arrows step through the directions, and the middle button opens a gallery of all eight.
- **Keyboard:** keys **1–8** jump straight to a direction, and **[** and **]** step through.
- **Links:** add the direction's name to the address, for example `#serene`, `#pulse` or `#aurevita`.

**Talk to Ben**

Press the start button on Ben's video in any direction. Most directions also have buttons and cards that ask Ben a specific question, such as "How do I get more deep sleep?". Pressing one starts the call and asks Ben that question.

## The eight directions

### 01 · Serene: the default

A calm, trustworthy health-coaching website, and the starting point for the whole product.

- **Look:** warm oat background, forest green and a soft serif. Clean and reassuring, like a modern clinic.
- **Top of the page:** the headline "Feel better, one conversation at a time." beside a photo styled as a live video-call card.
- **Meet Ben:** Ben's video sits in its own section below, with ready-made questions to start the conversation.
- **Further down:** focus cards (sleep, food, movement, stress), how it works, member stories and privacy.
- **Best for:** the main public website and the first impression for new members.

### 02 · Pulse: mobile version

Ben as a phone app. On a computer it appears inside a realistic phone frame. On a real phone it fills the whole screen.

- **Tabs:** Today, Trends, Ben (the centre button), Plan and Me, on a floating glass tab bar.
- **Today:** a readiness score, heart rate, sleep and steps, and a card from Ben with today's suggestion.
- **Ben:** a video call in portrait, the conversation as chat bubbles, and quick-reply questions.
- **The call keeps going** while you browse the other tabs. A pill at the top of the phone shows the timer and takes you back to Ben.
- **Around the phone on desktop:** a short app pitch, lock-screen notifications from Ben, and a card showing that Ben can read data from a smartwatch.
- **Best for:** showing the product as an app on iOS and Android.

### 03 · Aurevita: 3D clinic navigation

A walkable 3D longevity clinic. Visitors tour the clinic room by room, with Ben as their host.

- **Five rooms:** Reception, Consultation, Diagnostics, Recovery and Garden, joined by arched doorways.
- **Moving around:** drag to look around, use the room buttons or arrow keys to walk between rooms, or press "Guided tour" to be walked through automatically.
- **Hotspots:** glowing points on objects in each room explain what they are, and can ask Ben about them.
- **Ben knows where you are.** When you walk into a room, Ben is told which room it is, so he can talk about it.
- **Further down:** the method, a 90-day journey, a member story and membership plans.
- **Best for:** a premium clinic or longevity brand that wants visitors to "visit" before they book.

### 04 · Noir: luxury motion and animation

A dark, cinematic luxury website where every scroll and hover is animated.

- **Opening:** a curtain intro with a counting monogram, then the headline reveals letter by letter.
- **Cursor:** a custom gold cursor that labels what you can click, and buttons that pull gently toward the mouse.
- **Scrolling:** smooth scrolling, photos that reveal as you reach them, and a section that scrolls sideways while the page is held in place.
- **Background:** slow gold candle-light glows, a faint silk sheen and drifting gold dust.
- **Ben:** in a gold-framed consultation section.
- **Best for:** a high-end brand where the website itself should feel like a luxury experience.

### 05 · Aurora: mobile version that also works on PC

A bright, colourful app design that looks like a phone app but is built to work equally well on a computer.

- **Look:** a living aurora gradient background and frosted-glass panels.
- **Ben's video** sits in a glass device frame, so it reads as an app on any screen size.
- **Mood picker:** "How do you want to feel?" recolours the whole page and tells Ben your mood before the conversation.
- **Best for:** one design that serves phone and desktop users from the same app, with a modern, energetic feel.

### 06 · Heritage: traditional classic

A 19th-century almanac and apothecary, with Ben as a gentleman physician.

- **Look:** parchment paper, classic serif type, a newspaper-style masthead and a gilt frame around Ben.
- **Remedies of Habit:** four apothecary jars, one each for Sleep, Diet, Exercise and Temperament, illustrated with period engravings. Pressing a jar asks Ben about that topic.
- **Wording:** written in a gentle, old-fashioned voice, for example "Mr. Ben is receiving visitors".
- **Best for:** older members, and brands built on tradition, trust and timeless care.

### 07 · Ben & Buddies: specially for kids

A comic-book world where Ben is a friendly coach for children.

- **Look:** bold comic panels, halftone dots, bright primary colours, big comic lettering and animated emoji.
- **Super-power missions:** healthy habits presented as missions, such as drinking water or getting enough sleep.
- **Star chart:** rewards that make progress visible.
- **Feelings wheel:** children pick how they feel, and Ben is told before he answers.
- **Ben talks differently here.** He knows he is speaking with a child and keeps it simple, warm and playful.
- **Best for:** children's health programmes, schools and family plans.

### 08 · Maison: luxury for a women's community

An elegant, magazine-style design for a premium women's wellness community. Women's daily healthcare has its own needs and rhythms, and this direction gives it the attention and refinement it deserves.

- **Look:** an editorial fashion-magazine layout, refined high-contrast serif type, soft ivory and deep green with brass details.
- **Daily itinerary:** a day of self-care laid out hour by hour, from a morning ritual to an evening bath, each with a button to ask Ben about it.
- **Treatment menu:** a printed-style menu of rituals and treatments, presented like a luxury spa.
- **Ben is a gracious host,** attentive and calm, in the tone of five-star hospitality.
- **Best for:** an exclusive members' community, such as women's health clubs, wellness retreats and concierge care.

## How Ben is built in (Tavus)

- **Video agent:** each direction places the Tavus `<tavus-embed>` element, which runs the live video conversation with Ben.
- **One Ben, many personalities:** `src/ben/config.ts` holds the Tavus deployment id. For each direction it also sets Ben's background and tone, his greeting, light or dark mode, and accent colour. That's how Ben speaks to a child in Ben & Buddies and acts as a tour host in Aurevita.
- **Shared wiring:** `src/ben/useBen.ts` connects every direction to Ben. It tracks the call status, timer and live transcript, and provides two actions:
  - `ask(text)` asks Ben a question. If no call is running, it starts one and asks once Ben has greeted you.
  - `share(context)` tells Ben something during a call without him reading it aloud, such as the room you're in, your mood or how a child feels.
- **Fresh sessions:** switching direction ends any call and starts a new session in the next direction.

## Aurevita on machines without a graphics card

The 3D clinic picks the best version the device can run:

| Device | What the visitor gets |
|---|---|
| Graphics card (almost every laptop, desktop and phone) | Full 3D with shadows, reflections and soft lighting |
| No graphics card (VPS, virtual machine, missing driver) | Lite 3D: lower resolution, no shadows and simpler lighting, redrawing only while something moves |
| No 3D in the browser, or lite 3D too slow | Picture tour: a pre-rendered view of each room, with the same room buttons, hotspots and guided tour |

To force a version, add `?tour=full`, `?tour=lite` or `?tour=still` to the address, before the `#aurevita`. The room pictures are in `public/aurevita/stills/`. They are rendered from the 3D scene, so re-capture them if the rooms change.

## For developers

- **Stack:** React, TypeScript and Vite.
- **Commands:** `npm run dev` starts the dev server, `npm run build` type-checks and builds, and `npm run lint` runs oxlint.
- **Code:** each direction is in `src/themes/` (one `.tsx` file and one `.css` file) and loads only when chosen. The heavy libraries, three.js and GSAP, load only with the directions that use them.
- **Hosting:** the Tavus deployment's allowed origins must include the address you serve the prototype from.

## Assets and licences

- **Photos:** [Pexels](https://www.pexels.com), free under the Pexels licence. They are in `public/img` and `public/<direction>/`.
- **3D models, HDRI and textures for the Aurevita clinic:** [Poly Haven](https://polyhaven.com), CC0. They are in `public/aurevita/`.
- **Heritage engravings:** from Wikimedia Commons, in `public/heritage/`.
  - Lavender plate (Köhler's Medizinal-Pflanzen, 1887) and apothecary engraving: public domain.
  - Sleep: *Sleeping Child*, Carl Bloch, 1881. Rijksmuseum, CC0.
  - Diet: *Hors d'Oeuvre Dishes and Savouries*, plate from Mrs Beeton's *Book of Household Management* (1923 edition), digitally enhanced by rawpixel. [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/), via [Flickr](https://www.flickr.com/photos/153584064@N07/50440537436/).
  - Exercise: Indian-club drill plate from a 19th-century exercise manual. Internet Archive Book Images, no known copyright restrictions.
  - Temperament: *Four heads of men who each exhibit one of the four temperaments*. Wellcome Collection, CC BY 4.0.
- **3D emoji:** [Microsoft Fluent Emoji](https://github.com/microsoft/fluentui-emoji), MIT.
- **Animated emoji:** [Google Noto Emoji](https://github.com/googlefonts/noto-emoji), Apache-2.0.
- **Icons:** [Lucide](https://lucide.dev), ISC.
- **Fonts:** self-hosted through Fontsource, all under the SIL Open Font License. They are Cormorant Garamond, Manrope, Italiana, Hanken Grotesk, Bodoni Moda, Jost, Unbounded, Plus Jakarta Sans, IM Fell English, EB Garamond, Bangers and Comic Neue. Directions 01–02 load Fraunces, Inter Tight, Space Grotesk and JetBrains Mono from Google Fonts.
- **Motion and 3D libraries:** [three.js](https://threejs.org), [GSAP](https://gsap.com) and [Lenis](https://lenis.darkroom.engineering).

All numbers, names, prices, ratings and testimonials are placeholder content for the prototype.
