import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-icon-library',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon-library.component.html',
})
export class IconLibraryComponent {}
