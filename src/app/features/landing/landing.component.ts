import {
  Component,
  signal,
  computed,
  ChangeDetectionStrategy,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  viewChild,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LogoComponent } from '../../shared/components/ui';
import { OrigamiBrandPanelComponent } from '../../shared/components/brand';
import { createOrigami } from '../../shared/utils/origami-animation.utils';
import { ThemeService } from '../../core/services/theme.service';
import {
  LANDING_NAV,
  LANDING_HERO,
  LANDING_PROBLEM,
  LANDING_HOW,
  LANDING_DEMO,
  LANDING_PLANS,
  LANDING_CLOSING,
  LANDING_CONSULTING,
} from '../../core/models/landing.model';

export type LandingSectionId = 'problema' | 'funciones' | 'demo' | 'planes' | 'consultoria' | null;

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, LogoComponent, OrigamiBrandPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './landing.component.html',
})
export class LandingComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  readonly themeService = inject(ThemeService);

  readonly heroSection = viewChild<ElementRef<HTMLElement>>('heroSection');
  readonly closingBirdSvg = viewChild<ElementRef<SVGSVGElement>>('closingBirdSvg');
  readonly closingSection = viewChild<ElementRef<HTMLElement>>('closingSection');
  readonly problemSection = viewChild<ElementRef<HTMLElement>>('problemSection');
  readonly howSection = viewChild<ElementRef<HTMLElement>>('howSection');
  readonly demoSection = viewChild<ElementRef<HTMLElement>>('demoSection');
  readonly plansSection = viewChild<ElementRef<HTMLElement>>('plansSection');
  readonly consultingSection = viewChild<ElementRef<HTMLElement>>('consultingSection');

  readonly mobileMenuOpen = signal<boolean>(false);

  /** Porcentaje global de scroll (0 a 100) para la barra superior y parallax */
  readonly scrollProgressPercent = signal<number>(0);

  /** Progreso de salida del Hero (0 en el tope, 1 al salir) */
  readonly heroScrollOut = signal<number>(0);

  /** Piezas activas (1 a 7) del pájaro de progreso en la barra superior según el scroll */
  readonly activeBirdPieces = signal<number>(1);

  /** Sección activa actual para resaltar en la barra de navegación */
  readonly activeSection = signal<LandingSectionId>(null);

  /** Reloj narrativo del lunes que avanza de 7:40 a. m. a 6:00 p. m. con el scroll */
  readonly currentStoryTime = computed(() => {
    const p = this.scrollProgressPercent();
    if (p < 14) return 'Lunes · 7:40 a. m.';
    if (p < 32) return 'Lunes · 8:30 a. m.';
    if (p < 52) return 'Lunes · 10:00 a. m.';
    if (p < 72) return 'Lunes · 12:00 m.';
    if (p < 88) return 'Lunes · 4:00 p. m.';
    return 'Lunes · 6:00 p. m.';
  });

  /** Contador vivo de 1 a 48 en la sección «El Problema» */
  readonly problemCounter = signal<number>(1);

  /** Progreso continuo (0 a 1) de cada sección durante el scroll (scrub en vivo) */
  readonly problemProgress = signal<number>(1);
  readonly howProgress = signal<number>(1);
  readonly demoProgress = signal<number>(1);
  readonly plansProgress = signal<number>(1);
  readonly consultingProgress = signal<number>(1);
  readonly closingProgress = signal<number>(1);

  /** Transformación dinámica de vuelo para el pájaro de origami del cierre */
  readonly closingBirdTransform = signal<string>('translate3d(0px, 0px, 0px) rotate(0deg)');

  readonly nav = LANDING_NAV;
  readonly hero = LANDING_HERO;
  readonly problem = LANDING_PROBLEM;
  readonly how = LANDING_HOW;
  readonly demo = LANDING_DEMO;
  readonly plans = LANDING_PLANS;
  readonly closing = LANDING_CLOSING;
  readonly consulting = LANDING_CONSULTING;

  private closingOrigamiDraw: ((stage: number) => void) | null = null;
  private rafId = 0;
  private readonly onScrollBound = () => this.scheduleScrollUpdate();

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const svgEl = this.closingBirdSvg()?.nativeElement;
    if (svgEl) {
      this.closingOrigamiDraw = createOrigami(svgEl);
      this.closingOrigamiDraw(0);
    }

    window.addEventListener('scroll', this.onScrollBound, { passive: true });
    window.addEventListener('resize', this.onScrollBound, { passive: true });
    this.updateScrollAnimations();
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('scroll', this.onScrollBound);
      window.removeEventListener('resize', this.onScrollBound);
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
      }
    }
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  /**
   * 1. Parallax multicapa en el Hero al iniciar el scroll
   */
  getHeroTextTransform(): string {
    const out = this.heroScrollOut();
    const ty = (-42 * out).toFixed(1);
    const scale = (1 - 0.04 * out).toFixed(3);
    return `translate3d(0, ${ty}px, 0) scale(${scale})`;
  }

  getHeroTextOpacity(): number {
    return Number(Math.max(0.25, 1 - this.heroScrollOut() * 0.75).toFixed(2));
  }

  getHeroShowcaseTransform(): string {
    const out = this.heroScrollOut();
    const rotX = (14 * out).toFixed(1);
    const rotY = (-10 * out).toFixed(1);
    const ty = (28 * out).toFixed(1);
    return `perspective(1200px) translate3d(0, ${ty}px, 0) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  }

  getHeroFloatingCardTransform(cardIndex: 1 | 2): string {
    const out = this.heroScrollOut();
    if (cardIndex === 1) {
      const ty = (-65 * out).toFixed(1);
      const tx = (18 * out).toFixed(1);
      const rot = (6 * out).toFixed(1);
      return `translate3d(${tx}px, ${ty}px, 0) rotate(${rot}deg)`;
    }
    const ty = (55 * out).toFixed(1);
    const tx = (-18 * out).toFixed(1);
    const rot = (-6 * out).toFixed(1);
    return `translate3d(${tx}px, ${ty}px, 0) rotate(${rot}deg)`;
  }

  /**
   * 2. Triángulos de papel de origami flotantes en el fondo con rotación y parallax al scroll
   */
  getFloatingTriangleTransform(index: number): string {
    const p = this.scrollProgressPercent();
    const dir = index % 2 === 0 ? 1 : -1;
    const speed = 1.6 + (index % 3) * 0.9;
    const ty = (p * speed * dir).toFixed(1);
    const tx = (Math.sin(p * 0.06 + index) * 22).toFixed(1);
    const rot = (p * (2.4 + index * 0.5) * dir).toFixed(1);
    return `translate3d(${tx}px, ${ty}px, 0) rotate(${rot}deg)`;
  }

  /**
   * 3. Encabezados de sección y separadores luminosos sincronizados con el scroll
   */
  getSectionHeaderTransform(sectionProgress: number): string {
    const p = this.easeOutCubic(Math.min(1, sectionProgress * 1.4));
    const inv = 1 - p;
    const tx = (-32 * inv).toFixed(1);
    const ty = (22 * inv).toFixed(1);
    return `translate3d(${tx}px, ${ty}px, 0)`;
  }

  getSectionHeaderOpacity(sectionProgress: number): number {
    const p = this.easeOutCubic(Math.min(1, sectionProgress * 1.4));
    return Number((0.15 + 0.85 * p).toFixed(2));
  }

  getHairlineScale(sectionProgress: number): string {
    const p = this.easeOutCubic(Math.min(1, sectionProgress * 1.3));
    return `scaleX(${(0.12 + 0.88 * p).toFixed(3)})`;
  }

  /**
   * 4. Transformación 3D progresiva para las 3 tarjetas de «El Problema»
   */
  getProblemCardTransform(index: number): string {
    const p = this.staggeredProgress(this.problemProgress(), index, 3);
    const inv = 1 - p;
    const rotX = (-48 * inv).toFixed(1);
    const ty = (54 * inv).toFixed(1);
    const scale = (0.88 + 0.12 * p).toFixed(3);
    return `perspective(1100px) translate3d(0, ${ty}px, 0) rotateX(${rotX}deg) scale(${scale})`;
  }

  getProblemCardOpacity(index: number): number {
    const p = this.staggeredProgress(this.problemProgress(), index, 3);
    return Number((0.1 + 0.9 * p).toFixed(2));
  }

  getProblemBarTransform(index: number): string {
    const p = this.staggeredProgress(this.problemProgress(), index, 3);
    return `scaleY(${p.toFixed(3)})`;
  }

  /**
   * 5. Despliegue 3D tipo hoja de origami + haz conector para los 4 pasos de «Cómo Funciona»
   */
  getHowConnectorScale(): string {
    const p = this.easeOutCubic(this.howProgress());
    return `scaleX(${p.toFixed(3)})`;
  }

  isStepLit(index: number): boolean {
    const threshold = (index + 0.35) / 4;
    return this.howProgress() >= threshold;
  }

  getStepFoldTransform(index: number): string {
    const p = this.staggeredProgress(this.howProgress(), index, 4);
    const inv = 1 - p;
    const rotX = (-75 * inv).toFixed(1);
    const ty = (48 * inv).toFixed(1);
    const scale = (0.88 + 0.12 * p).toFixed(3);
    return `perspective(1200px) translate3d(0, ${ty}px, 0) rotateX(${rotX}deg) scale(${scale})`;
  }

  getStepFoldOpacity(index: number): number {
    const p = this.staggeredProgress(this.howProgress(), index, 4);
    return Number((0.1 + 0.9 * p).toFixed(2));
  }

  /**
   * 6. Apertura de Tríptico 3D + Contadores vivos para «Lo que ves en pantalla»
   */
  getDemoTriptychTransform(index: number): string {
    const p = this.easeOutCubic(this.demoProgress());
    const inv = 1 - p;
    if (index === 0) {
      const rotY = (72 * inv).toFixed(1);
      const tx = (-44 * inv).toFixed(1);
      const scale = (0.86 + 0.14 * p).toFixed(3);
      return `perspective(1600px) translate3d(${tx}px, 0, 0) rotateY(${rotY}deg) scale(${scale})`;
    }
    if (index === 1) {
      const sx = (0.42 + 0.58 * p).toFixed(3);
      const ty = (52 * inv).toFixed(1);
      return `perspective(1600px) translate3d(0, ${ty}px, 0) scaleX(${sx})`;
    }
    const rotY = (-72 * inv).toFixed(1);
    const tx = (44 * inv).toFixed(1);
    const scale = (0.86 + 0.14 * p).toFixed(3);
    return `perspective(1600px) translate3d(${tx}px, 0, 0) rotateY(${rotY}deg) scale(${scale})`;
  }

  getDemoTriptychOpacity(): number {
    const p = this.easeOutCubic(this.demoProgress());
    return Number((0.12 + 0.88 * p).toFixed(2));
  }

  getDemoCount(target: number): number {
    const p = this.easeOutCubic(this.demoProgress());
    return Math.max(1, Math.round(target * p));
  }

  /**
   * 7. Transformación 3D escalonada para Planes y Consultoría IA
   */
  getPlanCardTransform(index: number): string {
    const p = this.staggeredProgress(this.plansProgress(), index, 3);
    const inv = 1 - p;
    const ty = (56 * inv).toFixed(1);
    const rotX = (-42 * inv).toFixed(1);
    const scale = (0.88 + 0.12 * p).toFixed(3);
    return `perspective(1100px) translate3d(0, ${ty}px, 0) rotateX(${rotX}deg) scale(${scale})`;
  }

  getPlanCardOpacity(index: number): number {
    const p = this.staggeredProgress(this.plansProgress(), index, 3);
    return Number((0.1 + 0.9 * p).toFixed(2));
  }

  getConsultingCardTransform(index: number): string {
    const p = this.staggeredProgress(this.consultingProgress(), index, 4);
    const inv = 1 - p;
    const rotX = (-65 * inv).toFixed(1);
    const ty = (48 * inv).toFixed(1);
    const scale = (0.88 + 0.12 * p).toFixed(3);
    return `perspective(1100px) translate3d(0, ${ty}px, 0) rotateX(${rotX}deg) scale(${scale})`;
  }

  getConsultingCardOpacity(index: number): number {
    const p = this.staggeredProgress(this.consultingProgress(), index, 4);
    return Number((0.1 + 0.9 * p).toFixed(2));
  }

  /**
   * 8. Escala y resplandor de la tarjeta final en el cierre
   */
  getClosingCardTransform(): string {
    const p = this.easeOutCubic(this.closingProgress());
    const scale = (0.9 + 0.1 * p).toFixed(3);
    const ty = (36 * (1 - p)).toFixed(1);
    return `translate3d(0, ${ty}px, 0) scale(${scale})`;
  }

  private staggeredProgress(sectionProgress: number, index: number, total: number): number {
    const staggerSpan = 0.36;
    const start = (index / Math.max(1, total - 1)) * staggerSpan;
    const end = start + (1 - staggerSpan);
    const local = (sectionProgress - start) / Math.max(0.01, end - start);
    return this.easeOutCubic(Math.max(0, Math.min(1, local)));
  }

  private easeOutCubic(t: number): number {
    const clamped = Math.max(0, Math.min(1, t));
    return 1 - Math.pow(1 - clamped, 3);
  }

  private computeElementScrub(el: HTMLElement | undefined, startViewportRatio = 0.94, spanRatio = 0.55): number {
    if (!el) {
      return 1;
    }
    const rect = el.getBoundingClientRect();
    const viewH = Math.max(1, window.innerHeight);
    const raw = (viewH * startViewportRatio - rect.top) / Math.max(1, viewH * spanRatio);
    return Math.max(0, Math.min(1, raw));
  }

  private scheduleScrollUpdate(): void {
    if (this.rafId) {
      return;
    }
    this.rafId = requestAnimationFrame(() => {
      this.rafId = 0;
      this.updateScrollAnimations();
    });
  }

  private updateScrollAnimations(): void {
    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    const viewH = Math.max(1, window.innerHeight);
    const docHeight = Math.max(
      1,
      document.documentElement.scrollHeight - viewH
    );
    const totalProgress = Math.max(0, Math.min(1, scrollTop / docHeight));

    this.scrollProgressPercent.set(Math.round(totalProgress * 100));

    // Progreso de salida del Hero (0 a 1 en los primeros 500px de scroll)
    const heroOut = Math.max(0, Math.min(1, scrollTop / Math.max(320, viewH * 0.65)));
    this.heroScrollOut.set(heroOut);

    // 1. Pajarito de progreso en la barra superior (1 a 7 piezas)
    const pieces = Math.max(1, Math.min(7, Math.ceil(totalProgress * 7)));
    this.activeBirdPieces.set(pieces);

    // 2. Scrub de «El Problema» + Contador dinámico 1 a 48
    const probP = this.computeElementScrub(this.problemSection()?.nativeElement, 0.94, 0.54);
    this.problemProgress.set(probP);
    const count = Math.max(1, Math.min(48, Math.round(1 + probP * 47)));
    this.problemCounter.set(count);

    // 3. Scrub de «Cómo Funciona» (despliegue de hojas de origami + haz conector)
    const howP = this.computeElementScrub(this.howSection()?.nativeElement, 0.94, 0.56);
    this.howProgress.set(howP);

    // 4. Scrub de «Demostración» (apertura de tríptico 3D + contadores vivos)
    const demoP = this.computeElementScrub(this.demoSection()?.nativeElement, 0.92, 0.56);
    this.demoProgress.set(demoP);

    // 5. Scrub de «Planes»
    const plansP = this.computeElementScrub(this.plansSection()?.nativeElement, 0.94, 0.54);
    this.plansProgress.set(plansP);

    // 6. Scrub de «Consultoría IA»
    const consP = this.computeElementScrub(this.consultingSection()?.nativeElement, 0.94, 0.54);
    this.consultingProgress.set(consP);

    // 7. Plegado interactivo del pájaro de origami en el cierre (de hoja romboide 0 a ave 3)
    const closeP = this.computeElementScrub(this.closingSection()?.nativeElement, 0.96, 0.5);
    this.closingProgress.set(closeP);
    if (this.closingOrigamiDraw) {
      this.closingOrigamiDraw(3 * closeP);
      const inv = 1 - this.easeOutCubic(closeP);
      const tx = Math.round(-180 * inv);
      const ty = Math.round(95 * inv);
      const rot = Math.round(-60 * inv);
      this.closingBirdTransform.set(`translate3d(${tx}px, ${ty}px, 0px) rotate(${rot}deg)`);
    }

    // 8. Sección activa en la barra de navegación
    const sectionIds: Exclude<LandingSectionId, null>[] = [
      'problema',
      'funciones',
      'demo',
      'planes',
      'consultoria',
    ];
    const midLine = viewH * 0.42;
    let detected: LandingSectionId = null;
    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.top <= midLine && r.bottom >= midLine * 0.4) {
          detected = id;
        }
      }
    }
    this.activeSection.set(detected);
  }
}
