import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProposalService {
  private baseUrl = 'http://localhost:5021/api/FreelancerProposal';

  constructor(private http: HttpClient) {}

  getMyProposals(freelancerId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/myproposals/${freelancerId}`);
  }

  deleteProposal(proposalId: number, freelancerId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/delete/${proposalId}/${freelancerId}`);
  }
}
