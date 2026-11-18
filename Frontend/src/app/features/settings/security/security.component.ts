import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-security',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatSnackBarModule],
  templateUrl: './security.component.html',
  styleUrl: './security.component.scss',
})
export class SecurityComponent {
  private readonly snackBar = inject(MatSnackBar);

  readonly biometricEnabled = signal(localStorage.getItem('nestegg.security.biometric') !== 'off');
  readonly autoLockEnabled = signal(localStorage.getItem('nestegg.security.autolock') !== 'off');
  readonly hideBalanceEnabled = signal(localStorage.getItem('nestegg.security.hideBalance') === 'on');

  toggleBiometric(): void {
    this.biometricEnabled.update((enabled) => !enabled);
    localStorage.setItem('nestegg.security.biometric', this.biometricEnabled() ? 'on' : 'off');
  }

  toggleAutoLock(): void {
    this.autoLockEnabled.update((enabled) => !enabled);
    localStorage.setItem('nestegg.security.autolock', this.autoLockEnabled() ? 'on' : 'off');
  }

  toggleHideBalance(): void {
    this.hideBalanceEnabled.update((enabled) => !enabled);
    localStorage.setItem('nestegg.security.hideBalance', this.hideBalanceEnabled() ? 'on' : 'off');
  }

  showDemoNotice(action: string): void {
    this.snackBar.open(`${action} is a demo setting and isn't connected to a device service.`, 'Dismiss', {
      duration: 3000,
    });
  }

  savePreferences(): void {
    this.snackBar.open('Your security preferences are saved on this device.', 'Dismiss', {
      duration: 3000,
    });
  }
}
