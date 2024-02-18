import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DiagramData } from '../model/diagram.model';

const BASE_URL = 'http://localhost:8080';

@Injectable({
    providedIn: 'root'
})
export class DiagramService {

    constructor(private http: HttpClient) { }

    getDiagram(projectId: string): Observable<DiagramData> {
      return this.http.get<DiagramData>(`${BASE_URL}/diagram/${projectId}`);
    }
}
