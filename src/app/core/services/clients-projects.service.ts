import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface Project {
  projectId: number;
  title: string;
  overview: string;
  budget: number;
  deadline: string;
  status: string;
  freelancer: Freelancer | null;
  skills: Skill[];
}

export interface Skill {
  skillId: number;
  skill: string;
  category: string;
}

export interface Freelancer {
  freelancerId: string;
  freelancerName: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClientsProjectsService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5021/api/projects';

  getClientProjects(): Observable<Project[]> {
    const token = localStorage.getItem('token');
    
    console.log('Token:', token);
    const headers = {
      Authorization: `Bearer ${token}`
    };
    return this.http.get<Project[]>(`${this.apiUrl}/mine`, { headers });
  }

  deleteClientProjects(id: number): Observable<string> {
    const token = localStorage.getItem('token');
    console.log('Token:', token);
    const headers = {
      Authorization: `Bearer ${token}`
    };
    return this.http.delete(`${this.apiUrl}/${id}`, { headers, responseType: 'text' });
  }

  createProject(payload: { title: string; projectOverview: string; requiredTasks: string; additionalNotes: string; budget: number; deadline: string; skills: Skill[] }): Observable<{ projectId: number }> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication token not found.');
    }
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.post<{ projectId: number }>(`${this.apiUrl}/create`, payload, { headers });
  }
}