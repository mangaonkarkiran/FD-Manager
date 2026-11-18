import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  readonly remindersEnabled = signal(localStorage.getItem('nestegg.reminders') !== 'off');
  readonly notificationsEnabled = signal(localStorage.getItem('nestegg.notifications') !== 'off');

  constructor(private readonly router: Router) {}

  toggleReminders(): void {
    this.remindersEnabled.update((enabled) => !enabled);
    localStorage.setItem('nestegg.reminders', this.remindersEnabled() ? 'on' : 'off');
  }

  toggleNotifications(): void {
    this.notificationsEnabled.update((enabled) => !enabled);
    localStorage.setItem('nestegg.notifications', this.notificationsEnabled() ? 'on' : 'off');
  }

}
