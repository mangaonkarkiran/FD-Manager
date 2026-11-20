import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthSessionService } from '../../../core/auth/auth-session.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DepositsService } from '../../deposits/deposits.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatSnackBarModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  readonly remindersEnabled = signal(localStorage.getItem('nestegg.reminders') !== 'off');
  readonly notificationsEnabled = signal(localStorage.getItem('nestegg.notifications') !== 'off');

  constructor(
    private readonly router: Router,
    private readonly session: AuthSessionService,
    private readonly depositsService: DepositsService,
    private readonly snackBar: MatSnackBar,
  ) {}

  toggleReminders(): void {
    this.remindersEnabled.update((enabled) => !enabled);
    localStorage.setItem('nestegg.reminders', this.remindersEnabled() ? 'on' : 'off');
  }

  toggleNotifications(): void {
    this.notificationsEnabled.update((enabled) => !enabled);
    localStorage.setItem('nestegg.notifications', this.notificationsEnabled() ? 'on' : 'off');
  }

  async signOut(): Promise<void> {
    try {
      await this.session.signOut();
      this.depositsService.reset();
      await this.router.navigate(['/auth']);
    } catch (error) {
      this.snackBar.open(
        error instanceof Error ? error.message : 'Could not sign out. Please try again.',
        'Dismiss',
        { duration: 4000 },
      );
    }
  }
}
