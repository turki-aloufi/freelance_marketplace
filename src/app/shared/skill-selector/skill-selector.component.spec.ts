import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SkillSelectorComponent } from './skill-selector.component';

describe('SkillSelectorComponent', () => {
  let component: SkillSelectorComponent;
  let fixture: ComponentFixture<SkillSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkillSelectorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SkillSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
