import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DiagramModel } from '../model/diagram.model';

const BASE_URL = 'http://localhost:8080/api';
const httpOptions = { headers: new HttpHeaders({'Content-Type': 'application/json'}) };

@Injectable({
  providedIn: 'root'
})
export class DiagramService {

  constructor(private http: HttpClient) {
  }

  getDiagram(projectId: string): Observable<DiagramModel> {
    return this.http.get<DiagramModel>(`${BASE_URL}/diagram/${projectId}`, httpOptions);
  }
}
