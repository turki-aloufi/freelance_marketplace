import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientProjectApprovedComponent } from './client-project-approved.component';

describe('ClientProjectApprovedComponent', () => {
  let component: ClientProjectApprovedComponent;
  let fixture: ComponentFixture<ClientProjectApprovedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientProjectApprovedComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientProjectApprovedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
