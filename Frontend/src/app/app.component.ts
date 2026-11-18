import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { filter } from 'rxjs';
import { IconLibraryComponent } from './shared/icons/icon-library.component';

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IconLibraryComponent,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatSnackBarModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private installPrompt: InstallPromptEvent | null = null;
  readonly canInstall = signal(false);
  readonly showNavigation = signal(this.shouldShowNavigation());
  readonly isDarkMode = signal(localStorage.getItem('nestegg.theme') === 'dark');

  constructor() {
    this.applyTheme();
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.showNavigation.set(this.shouldShowNavigation()));
  }

  @HostListener('window:beforeinstallprompt', ['$event'])
  captureInstallPrompt(event: Event): void {
    event.preventDefault();
    this.installPrompt = event as InstallPromptEvent;
    this.canInstall.set(true);
  }

  @HostListener('window:appinstalled')
  onInstalled(): void {
    this.canInstall.set(false);
    this.installPrompt = null;
    this.snackBar.open('FD Manager is ready on your home screen.', 'Dismiss', {
      duration: 3500,
    });
  }

  async installApp(): Promise<void> {
    if (!this.installPrompt) {
      this.snackBar.open(
        'Use your browser menu to add FD Manager to your home screen.',
        'Got it',
        { duration: 4500 },
      );
      return;
    }
    await this.installPrompt.prompt();
    await this.installPrompt.userChoice;
    this.installPrompt = null;
    this.canInstall.set(false);
  }

  showNotifications(): void {
    this.snackBar.open('You’re all caught up.', 'Dismiss', { duration: 2500 });
  }

  toggleTheme(): void {
    this.isDarkMode.update((isDark) => !isDark);
    localStorage.setItem(
      'nestegg.theme',
      this.isDarkMode() ? 'dark' : 'light',
    );
    this.applyTheme();
  }

  private applyTheme(): void {
    document.documentElement.dataset['theme'] = this.isDarkMode()
      ? 'dark'
      : 'light';
  }

  private shouldShowNavigation(): boolean {
    const path = this.router?.url.split('?')[0] ?? '';
    return ![ '/auth', '/verify-mobile', '/deposits/new'].includes(path);
  }
}
