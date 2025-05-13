import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Auth, user, User } from '@angular/fire/auth';
import { Observable, switchMap, take } from 'rxjs';

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
  private user$: Observable<User | null>;

  constructor(private http: HttpClient, private auth: Auth) {
    this.user$ = user(this.auth);
  }

  private getAuthToken(): Observable<string | null> {
    return this.user$.pipe(
      take(1),
      switchMap(user => {
        if (!user) {
          return new Observable<string | null>(observer => observer.next(null));
        }
        return user.getIdToken();
      })
    );
  }

  getMyWorkingProjects(freelancerId: string): Observable<ProjectSummary[]> {
    return this.getAuthToken().pipe(
      switchMap(token => {
        let headers = new HttpHeaders();
        if (token) {
          headers = headers.set('Authorization', `Bearer ${token}`);
        }
        return this.http.get<ProjectSummary[]>(`${this.apiUrl}/Get-AllMyWorkingProjects/${freelancerId}`, { headers });
      })
    );
  }
}

