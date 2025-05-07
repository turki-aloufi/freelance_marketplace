import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientApprovedProjectsComponent } from './client-approved-projects.component';

describe('ClientApprovedProjectsComponent', () => {
  let component: ClientApprovedProjectsComponent;
  let fixture: ComponentFixture<ClientApprovedProjectsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientApprovedProjectsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientApprovedProjectsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
