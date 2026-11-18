import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('creates the application shell', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('defaults to light theme when no preference is saved', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance.isDarkMode()).toBeFalse();
  });

  it('persists a selected dark theme', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.componentInstance.toggleTheme();
    expect(localStorage.getItem('nestegg.theme')).toBe('dark');
    expect(document.documentElement.dataset['theme']).toBe('dark');
  });
});
