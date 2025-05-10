import { TestBed } from '@angular/core/testing';

import { ClientsProjectsService } from './clients-projects.service';

describe('ClientsProjectsService', () => {
  let service: ClientsProjectsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClientsProjectsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
