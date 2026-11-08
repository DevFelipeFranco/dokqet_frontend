import {
  Component,
  input,
  signal,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  ChangeDetectionStrategy,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { LogoComponent } from '../../ui/logo.component';
import {
  createOrigami,
  generateMosaicTriangles,
  BRAND_FEATURES,
  NOVEDAD_INDEX,
  MosaicTriangle,
  BrandFeature,
} from '../../../utils/origami-animation.utils';

export type AnimationFase = 'inicio' | 'mosaico' | 'pajaro' | 'final';

@Component({
  selector: 'app-origami-brand-panel',
  standalone: true,
  imports: [RouterLink, LogoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './origami-brand-panel.component.html',
})
export class OrigamiBrandPanelComponent implements AfterViewInit, OnDestroy {
  readonly animate = input<boolean>(true);
  readonly showFeatures = input<boolean>(true);

  @ViewChild('panelRef') panelRef?: ElementRef<HTMLElement>;
  @ViewChild('mosaicoRef') mosaicoRef?: ElementRef<SVGSVGElement>;
  @ViewChild('pajaroRef') pajaroRef?: ElementRef<SVGSVGElement>;

  readonly currentFase = signal<AnimationFase>('inicio');
  readonly showAviso = signal<boolean>(false);

  readonly triangles: MosaicTriangle[] = generateMosaicTriangles();
  readonly features: BrandFeature[] = BRAND_FEATURES;

  private readonly timeouts: ReturnType<typeof setTimeout>[] = [];
  private animationFrameId: number = 0;

  ngAfterViewInit(): void {
    const pajaro = this.pajaroRef?.nativeElement;
    const mosaico = this.mosaicoRef?.nativeElement;

    if (!pajaro || !mosaico) {
      return;
    }

    const dibujar = createOrigami(pajaro);

    // Verificación de accesibilidad para preferencias de reducción de movimiento
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!this.animate() || prefersReducedMotion) {
      dibujar(3);
      this.currentFase.set('final');
      return;
    }

    const en = (ms: number, fn: () => void) => {
      this.timeouts.push(setTimeout(fn, ms));
    };

    const triangulos = Array.from(mosaico.querySelectorAll('polygon'));
    dibujar(0);

    // 1. Los procesos aparecen en desorden (30ms - 900ms)
    triangulos.forEach((t) => {
      t.style.transitionDelay = `${Math.round(100 + Math.random() * 600)}ms`;
    });
    en(30, () => this.currentFase.set('mosaico'));
    en(900, () => {
      triangulos.forEach((t) => (t.style.transitionDelay = ''));
    });

    // 2. El escaneo recorre las 8 columnas
    for (let c = 0; c < 8; c++) {
      const columna = triangulos.filter(
        (t) => t.getAttribute('data-columna') === String(c)
      );
      en(900 + c * 90, () => {
        columna.forEach((t) => t.setAttribute('data-escaneo', ''));
      });
      en(1080 + c * 90, () => {
        columna.forEach((t) => t.removeAttribute('data-escaneo'));
      });
    }

    // 3. Un proceso se enciende con una novedad (#21)
    en(1700, () => {
      triangulos[NOVEDAD_INDEX]?.setAttribute('data-encendido', '');
    });

    // 4. De él sale una hoja que se pliega en el pajarito (1,3 segundos)
    en(2000, () => {
      this.currentFase.set('pajaro');
      const inicio = performance.now() + 300;
      const paso = (ahora: number) => {
        const k = Math.max(0, Math.min(1, (ahora - inicio) / 1300));
        dibujar(3 * k);
        if (k < 1) {
          this.animationFrameId = requestAnimationFrame(paso);
        }
      };
      this.animationFrameId = requestAnimationFrame(paso);
    });

    // 5. Llega el aviso de ejemplo y, al final, las funciones
    en(3500, () => this.showAviso.set(true));
    en(3700, () => this.currentFase.set('final'));
    en(4800, () => this.showAviso.set(false));
  }

  ngOnDestroy(): void {
    this.timeouts.forEach(clearTimeout);
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    const mosaico = this.mosaicoRef?.nativeElement;
    if (mosaico) {
      const triangulos = mosaico.querySelectorAll('polygon');
      triangulos.forEach((t) => {
        t.style.transitionDelay = '';
        t.removeAttribute('data-escaneo');
        t.removeAttribute('data-encendido');
      });
    }
  }
}
