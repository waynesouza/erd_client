import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class DiagramService {

    constructor(private http: HttpClient) { }

    getDiagram(projectId: string): Observable<any> {
      return this.http.get(`localhost:8080/diagram/${projectId}`);
    }
}
