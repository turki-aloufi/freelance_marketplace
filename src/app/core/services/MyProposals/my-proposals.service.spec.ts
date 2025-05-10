import { TestBed } from '@angular/core/testing';

import { MyProposalsService } from './my-proposals.service';

describe('MyProposalsService', () => {
  let service: MyProposalsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MyProposalsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
