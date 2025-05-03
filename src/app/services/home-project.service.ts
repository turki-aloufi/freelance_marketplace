import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Skill {
  skillId: number;
  skill: string;
  category: string;
}

export interface HomeProject {
  projectId: number;
  title: string;
  projectOverview: string;
  requiredTasks: string;
  additionalNotes: string;
  budget: number;
  deadline: string;
  status: string;
  createdAt: string;
  skills: Skill[];
}
@Injectable({
  providedIn: 'root'
})
export class HomeProjectService {

  private apiUrl = 'http://localhost:5021/api/FreelancerProject/all/available/projects';

  constructor(private http: HttpClient) {}

  getAllAvailableProjects(): Observable<HomeProject[]> {
    return this.http.get<HomeProject[]>(this.apiUrl);
  }
}
