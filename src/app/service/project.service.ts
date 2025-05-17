import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

const BASE_URL = 'http://localhost:8080/api/project';
const httpOptions = { headers: new HttpHeaders({'Content-Type': 'application/json'}) };

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  private selectedProject = new BehaviorSubject<string | null>(null);

  constructor(private http: HttpClient) { }

  createProject(project: any): Observable<HttpResponse<any>> {
    return this.http.post<any>(BASE_URL, project, httpOptions);
  }

  getProjectsByUserEmail(email: string): Observable<HttpResponse<any[]>> {
    return this.http.get<any>(`${BASE_URL}/user-email/${email}`, httpOptions);
  }

  updateProject(project: any): Observable<HttpResponse<any>> {
    return this.http.put<any>(BASE_URL, project, httpOptions);
  }

  getProjectById(id: string): Observable<HttpResponse<any>> {
    return this.http.get<any>(`${BASE_URL}/${id}`, httpOptions);
  }

  addTeamMember(teamMember: any): Observable<HttpResponse<any>> {
    return this.http.post<any>(`${BASE_URL}/team-member`, teamMember, httpOptions);
  }

  updateTeamMember(updateTeamMember: any): Observable<HttpResponse<any>> {
    return this.http.put<any>(`${BASE_URL}/team-member`, updateTeamMember, httpOptions);
  }

  removeTeamMember(memberId: string, projectId: string): Observable<HttpResponse<any>> {
    return this.http.put<any>(`${BASE_URL}/team-member/${memberId}/project/${projectId}`, httpOptions);
  }

  deleteProject(id: string): Observable<HttpResponse<any>> {
    return this.http.delete<any>(`${BASE_URL}/${id}`, httpOptions);
  }

}
