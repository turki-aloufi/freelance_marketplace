import { TestBed } from '@angular/core/testing';

import { ApprovedProjectService } from './approved-project.service';

describe('ApprovedProjectService', () => {
  let service: ApprovedProjectService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApprovedProjectService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
