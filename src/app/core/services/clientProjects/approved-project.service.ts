import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApprovedProjectService {
  private apiUrl = 'http://localhost:5021/api/ClientProject/approved';

  constructor(private http: HttpClient) { }
  // ------- Get All client approved project -------
  getApprovedProjects(userID: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${userID}`);
  }

  markProjectAsCompleted(ProjectId:string):Observable<any[]> {
    return this.http.put<any[]>(`${this.apiUrl}/${ProjectId}/mark-completed`, null);
  }
}