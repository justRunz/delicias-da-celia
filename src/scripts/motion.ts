import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/* --- Défilement doux + ancres ------------------------------------------ */
let lenis: Lenis | null = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.1 });
  window.lenis = lenis;
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

const headerOffset = () => -(document.querySelector<HTMLElement>("[data-header]")?.offsetHeight ?? 0) + 1;

// Liens vers une section de la page courante (#contacto, /#sobre depuis l'accueil, / pour remonter)
document.addEventListener("click", (e) => {
  const link = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[href]");
  if (!link || link.target === "_blank" || e.metaKey || e.ctrlKey) return;
  const url = new URL(link.href);
  if (url.origin !== location.origin || url.pathname !== location.pathname) return;
  const toTop = !url.hash || url.hash === "#topo";
  const target = toTop ? null : document.querySelector<HTMLElement>(decodeURIComponent(url.hash));
  if (!toTop && !target) return;
  e.preventDefault();
  if (lenis) lenis.scrollTo(target ?? 0, { offset: target ? headerOffset() : 0, duration: 1.4 });
  else (target ?? document.body).scrollIntoView();
  history.replaceState(null, "", url.pathname + url.hash);
});

/* --- Découpe d'un titre en mots ----------------------------------------- */
function splitWords(el: HTMLElement) {
  const walk = (node: Node): Node[] => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent!.split(/(\s+)/).flatMap((part) => {
        if (!part) return [];
        if (/^\s+$/.test(part)) return [document.createTextNode(part)];
        const outer = document.createElement("span");
        outer.className = "w";
        const inner = document.createElement("span");
        inner.textContent = part;
        outer.appendChild(inner);
        return [outer];
      });
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      const clone = (node as HTMLElement).cloneNode(false) as HTMLElement;
      Array.from(node.childNodes).forEach((c) => walk(c).forEach((n) => clone.appendChild(n)));
      return [clone];
    }
    return [];
  };
  el.replaceChildren(...Array.from(el.childNodes).flatMap(walk));
  return el.querySelectorAll<HTMLElement>(".w > span");
}

const inHero = (el: Element) => !!el.closest("[data-hero]");

if (reduced) {
  gsap.set("[data-reveal]", { opacity: 1 });
} else {
  /* Titres : mots qui montent d'une fente */
  gsap.utils.toArray<HTMLElement>("[data-reveal='words']").forEach((el) => {
    const words = splitWords(el);
    gsap.set(el, { opacity: 1 });
    gsap.from(words, {
      yPercent: 115,
      rotate: 4,
      duration: 1.2,
      ease: "expo.out",
      stagger: 0.06,
      delay: inHero(el) ? 0.2 : 0,
      scrollTrigger: inHero(el) ? undefined : { trigger: el, start: "top 85%" },
    });
  });

  /* Citation : les mots s'allument au fil du défilement */
  gsap.utils.toArray<HTMLElement>("[data-reveal='scrub']").forEach((el) => {
    const words = splitWords(el);
    gsap.set(el, { opacity: 1 });
    gsap.fromTo(
      words,
      { opacity: 0.15 },
      {
        opacity: 1,
        ease: "none",
        stagger: 0.1,
        scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: true },
      },
    );
  });

  /* Blocs : fondu + montée */
  gsap.utils.toArray<HTMLElement>("[data-reveal='up']").forEach((el) => {
    const delay = Number(el.dataset.delay ?? 0);
    gsap.fromTo(
      el,
      { opacity: 0, y: 28 },
      {
        opacity: 1,
        y: 0,
        duration: 1.1,
        ease: "expo.out",
        delay: inHero(el) ? 0.55 + delay : delay,
        scrollTrigger: inHero(el) ? undefined : { trigger: el, start: "top 90%" },
      },
    );
  });

  /* Groupes : enfants en cascade */
  gsap.utils.toArray<HTMLElement>("[data-reveal='stagger']").forEach((el) => {
    gsap.set(el, { opacity: 1 });
    gsap.from(el.children, {
      opacity: 0,
      y: 20,
      duration: 0.9,
      ease: "expo.out",
      stagger: 0.08,
      scrollTrigger: { trigger: el, start: "top 88%" },
    });
  });

  /* Images : rideau qui s'ouvre de bas en haut, photo qui se dézoome */
  gsap.utils.toArray<HTMLElement>("[data-reveal='clip']").forEach((el) => {
    const img = el.querySelector("img");
    const tl = gsap.timeline({
      delay: inHero(el) ? 0.1 : 0,
      scrollTrigger: inHero(el) ? undefined : { trigger: el, start: "top 82%" },
    });
    tl.fromTo(
      el,
      { opacity: 1, clipPath: "inset(100% 0% 0% 0%)" },
      { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, ease: "expo.inOut", clearProps: "clipPath" },
    );
    if (img) tl.from(img, { scale: 1.3, duration: 1.8, ease: "expo.out" }, 0.25);
  });

  /* Vignettes et badges : apparition avec rebond */
  gsap.utils.toArray<HTMLElement>("[data-reveal='pop']").forEach((el, i) => {
    gsap.fromTo(
      el,
      { opacity: 0, scale: 0.4 },
      {
        opacity: 1,
        scale: 1,
        duration: 1.1,
        ease: "back.out(1.7)",
        delay: inHero(el) ? 0.9 + i * 0.12 : 0.2,
        scrollTrigger: inHero(el) ? undefined : { trigger: el, start: "top 90%" },
      },
    );
  });

  /* Flottement continu des vignettes du hero */
  gsap.utils.toArray<HTMLElement>("[data-float]").forEach((el) => {
    const alt = el.dataset.float === "b";
    gsap.to(el, {
      y: alt ? 12 : -14,
      duration: alt ? 3.4 : 2.8,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });
  });

  /* Parallaxe douce */
  gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
    const amount = Number(el.dataset.parallax || 12);
    gsap.fromTo(
      el,
      { yPercent: -amount / 2 },
      {
        yPercent: amount / 2,
        ease: "none",
        scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true },
      },
    );
  });

  /* Compteurs */
  gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
    const target = Number(el.dataset.count);
    const decimals = Number(el.dataset.decimals ?? 0);
    const obj = { v: 0 };
    // Part de 0 dès le chargement (sinon le chiffre final s'affiche puis retombe à 0)
    el.textContent = (0).toFixed(decimals).replace(".", ",");
    gsap.to(obj, {
      v: target,
      duration: 2,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 92%" },
      onUpdate: () => {
        el.textContent = obj.v.toFixed(decimals).replace(".", ",");
      },
    });
  });

  /* Bandeau : boucle infinie, accélère et change de sens avec le défilement */
  document.querySelectorAll<HTMLElement>("[data-marquee]").forEach((marquee) => {
    const track = marquee.querySelector<HTMLElement>("[data-marquee-track]")!;
    const loop = gsap.to(track, { xPercent: -50, duration: 38, ease: "none", repeat: -1 });
    let direction = 1;
    ScrollTrigger.create({
      trigger: marquee,
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => {
        if (self.direction !== direction) direction = self.direction;
        const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 300, 5);
        gsap.to(loop, { timeScale: boost * direction, duration: 0.25, overwrite: true });
        gsap.to(loop, { timeScale: direction, duration: 1.2, delay: 0.25, ease: "power2.out" });
      },
    });
  });

  /* Ligne « poche à douille » : se dessine au défilement, les étapes s'allument */
  document.querySelectorAll<HTMLElement>("[data-piping]").forEach((wrap) => {
    const path = wrap.querySelector<SVGPathElement>("[data-piping-path]")!;
    const len = path.getTotalLength();
    gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
    gsap.to(path, {
      strokeDashoffset: 0,
      ease: "none",
      // Même repère que les pastilles (80 % de l'écran) : la ligne arrive au 3 quand il s'allume
      scrollTrigger: { trigger: wrap, start: "top 80%", end: "bottom 80%", scrub: 0.6 },
    });
    wrap.querySelectorAll<HTMLElement>("[data-step]").forEach((step) => {
      const dot = step.querySelector<HTMLElement>("[data-step-dot]")!;
      // Arrive depuis la gauche (vers la ligne) : un décalage vers la droite
      // ferait déborder la page sur mobile tant que l'animation n'a pas démarré
      gsap.from(step.children[1], {
        opacity: 0,
        x: -24,
        duration: 1,
        ease: "expo.out",
        scrollTrigger: { trigger: step, start: "top 75%" },
      });
      ScrollTrigger.create({
        trigger: step,
        // 80 % : sur grand écran, toute la section tient à l'écran, le 3 doit déjà s'allumer
        start: "top 80%",
        onLeaveBack: () => dot.classList.remove("is-on"),
        onEnter: () => {
          dot.classList.add("is-on");
          gsap.fromTo(dot, { scale: 0.7 }, { scale: 1, duration: 0.8, ease: "back.out(2.5)" });
        },
      });
    });
  });

  /* Galerie horizontale épinglée (bureau) */
  const mm = gsap.matchMedia();
  mm.add("(min-width: 900px)", () => {
    gsap.utils.toArray<HTMLElement>("[data-hscroll]").forEach((section) => {
      const track = section.querySelector<HTMLElement>("[data-hscroll-track]");
      const progress = section.querySelector<HTMLElement>("[data-hscroll-progress]");
      if (!track) return;
      const distance = () => track.scrollWidth - window.innerWidth;
      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
          // Créée après les animations des sections suivantes : sans priorité, celles-ci
          // seraient calculées sans la hauteur ajoutée par l'épinglage et se déclencheraient
          // bien trop tôt sur ordinateur (avant même d'arriver à « Como encomendar »).
          refreshPriority: 1,
          onUpdate: (self) => progress && gsap.set(progress, { scaleX: self.progress }),
        },
      });
      // Chaque photo se redresse légèrement en entrant dans l'écran
      track.querySelectorAll<HTMLElement>(".gallery__frame").forEach((frame) => {
        gsap.fromTo(
          frame,
          { rotate: 3, scale: 0.92 },
          {
            rotate: 0,
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: frame,
              containerAnimation: tween,
              start: "left right",
              end: "center center",
              scrub: true,
            },
          },
        );
      });
    });
  });

  /* Boutons aimantés (souris uniquement) */
  if (finePointer) {
    document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => {
      // Effet discret : le bouton glisse de quelques pixels au plus, sans rebond
      const xTo = gsap.quickTo(el, "x", { duration: 0.8, ease: "power3.out" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.8, ease: "power3.out" });
      const clamp = gsap.utils.clamp(-6, 6);
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        xTo(clamp((e.clientX - (r.left + r.width / 2)) * 0.08));
        yTo(clamp((e.clientY - (r.top + r.height / 2)) * 0.12));
      });
      el.addEventListener("pointerleave", () => {
        xTo(0);
        yTo(0);
      });
    });
  }
}

// Remet les déclencheurs dans l'ordre de la page (la galerie épinglée a été créée en dernier)
ScrollTrigger.sort();
ScrollTrigger.refresh();

// Les polices et images modifient les hauteurs : on recalcule une fois tout chargé
window.addEventListener("load", () => ScrollTrigger.refresh());

// Arrivée directe sur une ancre (#galeria…) : y aller une fois la page en place
if (location.hash) {
  const target = document.querySelector<HTMLElement>(decodeURIComponent(location.hash));
  if (target) requestAnimationFrame(() => lenis?.scrollTo(target, { immediate: true, offset: headerOffset() }));
}
