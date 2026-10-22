import {useEffect, type RefObject} from 'react';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import 'lenis/lenis.css';

gsap.registerPlugin(ScrollTrigger);

export function useStudyMotion(ref: RefObject<HTMLElement | null>, view: string) {
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    let teardown = () => {};
    const setup = () => {
      teardown();
      document.documentElement.dataset.motion = media.matches ? 'reduced' : 'full';
      if (media.matches) return;
      const lenis = new Lenis({autoRaf: false, lerp: .16, smoothWheel: true, syncTouch: false,
        prevent: node => !!node.closest('[data-lenis-prevent],dialog,.sidebar,.question-map,.history-list')});
      const tick = (time: number) => lenis.raf(time * 1000);
      const sync = () => ScrollTrigger.update();
      lenis.on('scroll', sync);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      const reset = () => {lenis.resize(); lenis.scrollTo(window.scrollY, {immediate: true, force: true}); ScrollTrigger.refresh();};
      const dialog = (e: Event) => (e as CustomEvent<boolean>).detail ? lenis.stop() : lenis.start();
      addEventListener('hashchange', reset);
      addEventListener('capm:dialog', dialog);
      const click = (event: Event) => {
        const target = (event.target as Element).closest('button,.option');
        if (!target || target.matches(':disabled')) return;
        gsap.fromTo(target, {scale: .985}, {scale: 1, duration: .18, ease: 'power2.out', clearProps: 'transform', overwrite: true});
      };
      document.addEventListener('click', click);
      const progress = new WeakMap<Element, number>();
      const animateProgress = (element: Element) => {
        const value = Number(element.getAttribute('aria-valuenow') ?? 0);
        const bar = element.querySelector('i');
        if (bar) gsap.fromTo(bar, {width: (progress.get(element) ?? 0) + '%'}, {width: value + '%', duration: .4, ease: 'power2.out', overwrite: true});
        progress.set(element, value);
      };
      const observer = new MutationObserver(records => {
        for (const record of records) if (record.type === 'attributes') animateProgress(record.target as Element);
        if (records.some(r => r.type === 'childList')) ref.current?.querySelectorAll('[role=progressbar]').forEach(element => {if (!progress.has(element)) animateProgress(element);});
      });
      if (ref.current) observer.observe(ref.current, {attributes: true, attributeFilter: ['aria-valuenow'], childList: true, subtree: true});
      teardown = () => {
        observer.disconnect(); document.removeEventListener('click', click);
        removeEventListener('hashchange', reset); removeEventListener('capm:dialog', dialog);
        gsap.ticker.remove(tick); lenis.off('scroll', sync); lenis.destroy();
        if (ref.current) {const targets = [...ref.current.querySelectorAll('button,.option,.progress-track i')]; gsap.killTweensOf(targets); gsap.set(targets.filter(x => !x.matches('.progress-track i')), {clearProps: 'transform'});}
      };
    };
    setup(); media.addEventListener('change', setup);
    return () => {media.removeEventListener('change', setup); teardown();};
  }, [ref]);

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !ref.current) return;
    const context = gsap.context(() => {
      const title = ref.current!.querySelector('.page-title,.welcome,.session-header');
      if (title) gsap.fromTo(title, {y: 8, opacity: .5}, {y: 0, opacity: 1, duration: .24, clearProps: 'transform,opacity'});
      const cards = [...ref.current!.querySelectorAll('.domain-card,.pdf-collection-card,.result-hero,.stat,.panel,.question-card')].slice(0, 24);
      if (cards.length) gsap.fromTo(cards, {y: 8, opacity: .5}, {y: 0, opacity: 1, duration: .28, stagger: .018, ease: 'power2.out', clearProps: 'transform,opacity'});
      const arc = ref.current!.querySelector('.score-arc');
      if (arc) gsap.fromTo(arc, {strokeDashoffset: 326.73}, {strokeDashoffset: Number(arc.getAttribute('data-offset')), duration: .65, ease: 'power2.out'});
    }, ref.current);
    return () => context.revert();
  }, [ref, view]);
}
