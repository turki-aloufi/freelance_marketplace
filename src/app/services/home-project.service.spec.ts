import { TestBed } from '@angular/core/testing';

import { HomeProjectService } from './home-project.service';

describe('HomeProjectService', () => {
  let service: HomeProjectService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HomeProjectService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
