
import { Injectable } from '@angular/core';
import { throwError, Observable, switchMap, take } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Auth, user, User } from '@angular/fire/auth';

// Define interfaces
export interface Project {
  title: string;
  deadline: string;
  budget: number;
  skills: string[];
  overview: string;
  requiredTasks: string[] | string;
  additionalNotes: string;
  proposals: Proposal[];
  clientId: string;
  Status:string;
}

export interface Proposal {
  coverLetter: string;
  deadline: string;
  proposedAmount: number;
  freelancerName: string;
  freelancerAvatar: string;
  status: string;
  freelancerId: string;
  proposalId: number;
}

export interface AssignProjectDto {
 
  freelancerId: string;
  proposalId: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private baseUrl = 'http://localhost:5021/api';
  private user$: Observable<User | null>;

  constructor(
    private http: HttpClient,
    private auth: Auth
  ) {
    this.user$ = user(this.auth);
  }

  private getAuthToken(): Observable<string> {
    return this.user$.pipe(
      take(1),
      switchMap(user => {
        if (!user) throw new Error('No authenticated user');
        
        return user.getIdToken(); // Get Firebase JWT token
      })
    );
  }

  getProjectById(id: number): Observable<Project> {
    return this.getAuthToken().pipe(
      switchMap(token => {
        
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        return this.http.get<Project>(`${this.baseUrl}/FreelancerProposal/${id}`, { headers });
      })
    );
  }

  sendProposal(projectId: number, proposal: any): Observable<any> {
    return this.getAuthToken().pipe(
      switchMap(token => {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        const url = `${this.baseUrl}/FreelancerProposal/${projectId}/proposals`;
        return this.http.post<any>(url, proposal, { headers });
      })
    );
  }

  assignProject(projectId: number, model: AssignProjectDto): Observable<any> {
    return this.getAuthToken().pipe(
      switchMap(token => {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        return this.http.put(`${this.baseUrl}/Projects/${projectId}/assign`, model, { headers });
      })
    );
  }
}
