import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Auth, user, User } from '@angular/fire/auth';
import { Observable, switchMap, take } from 'rxjs';
import {environment} from '../../../../environment.prod'
@Injectable({
  providedIn: 'root'
})
export class ApprovedProjectService {
  private readonly apiUrl = `${environment.apiUrl}/api/ClientProject/approved`;
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
        return user.getIdToken();
      })
    );
  }

  getApprovedProjects(userID: string): Observable<any[]> {
    return this.getAuthToken().pipe(
      switchMap(token => {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        return this.http.get<any[]>(`${this.apiUrl}/${userID}`, { headers });
      })
    );
  }

  markProjectAsCompleted(ProjectId: string): Observable<any> {
    return this.getAuthToken().pipe(
      switchMap(token => {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        return this.http.put<any>(
          `${this.apiUrl}/${ProjectId}/mark-completed`,
          null,
          { headers }
        );
      })
    );
  }
}