import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface ProjectSummary {
  projectId: number;
  title: string;
  overview: string;
  budget: number;
  deadline: string;
  status: string;
  freelancer: {
    freelancerId: string;
    freelancerName: string;
  };
  skills: {
    skillId: number;
    skill: string;
    category: string;
  }[];
  postedBy: string;
}


@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private apiUrl = 'http://localhost:5021/api/Projects'; 

  constructor(private http: HttpClient) {}

  getMyWorkingProjects(freelancerId: string): Observable<ProjectSummary[]> {
    return this.http.get<ProjectSummary[]>(`${this.apiUrl}/Get-AllMyWorkingProjects/${freelancerId}`);
  }
}
