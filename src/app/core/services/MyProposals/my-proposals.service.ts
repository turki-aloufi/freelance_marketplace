import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, switchMap, take } from 'rxjs';
import { Auth, user, User } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class ProposalService {
  private baseUrl = 'http://localhost:5021/api/FreelancerProposal';
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

  getMyProposals(freelancerId: string): Observable<any[]> {
    return this.getAuthToken().pipe(
      switchMap(token => {
        let headers = new HttpHeaders();
        if (token) {
          headers = headers.set('Authorization', `Bearer ${token}`);
        }
        return this.http.get<any[]>(`${this.baseUrl}/myproposals/${freelancerId}`, { headers });
      })
    );
  }

  deleteProposal(proposalId: number, freelancerId: string): Observable<any> {
    return this.getAuthToken().pipe(
      switchMap(token => {
        let headers = new HttpHeaders();
        if (token) {
          headers = headers.set('Authorization', `Bearer ${token}`);
        }
        return this.http.delete(`${this.baseUrl}/delete/${proposalId}/${freelancerId}`, { headers });
      })
    );
  }
}

