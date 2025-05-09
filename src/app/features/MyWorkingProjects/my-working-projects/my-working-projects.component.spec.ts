import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyWorkingProjectsComponent } from './my-working-projects.component';

describe('MyWorkingProjectsComponent', () => {
  let component: MyWorkingProjectsComponent;
  let fixture: ComponentFixture<MyWorkingProjectsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyWorkingProjectsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyWorkingProjectsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
