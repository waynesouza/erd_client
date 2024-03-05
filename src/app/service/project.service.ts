import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders, HttpResponse } from "@angular/common/http";
import { BehaviorSubject, Observable } from "rxjs";

const BASE_URL = 'http://localhost:8080/api/project';
const httpOptions = { headers: new HttpHeaders({'Content-Type': 'application/json'}) };

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  private selectedProject = new BehaviorSubject<string | null>(null);

  constructor(private http: HttpClient) { }

  getProjectsByUserEmail(email: string): Observable<HttpResponse<any[]>> {
    return this.http.get<any>(`${BASE_URL}/user-email/${email}`, httpOptions);
  }

  getSelectedProject(): Observable<string | null> {
    return this.selectedProject.asObservable();
  }

  setSelectedProject(projectId: string) {
    this.selectedProject.next(projectId);
  }

}
