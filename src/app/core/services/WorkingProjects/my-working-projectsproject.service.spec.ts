import { TestBed } from '@angular/core/testing';

import { MyWorkingProjectsprojectService } from './my-working-projectsproject.service';

describe('MyWorkingProjectsprojectService', () => {
  let service: MyWorkingProjectsprojectService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MyWorkingProjectsprojectService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
