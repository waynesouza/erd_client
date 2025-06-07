import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ProjectService } from '../service/project.service';
import { StorageService } from '../service/storage.service';

@Injectable({
  providedIn: 'root'
})
export class ProjectGuard implements CanActivate {

  constructor(
    private projectService: ProjectService,
    private storageService: StorageService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    const projectId = route.params['projectId'] || route.params['id'];

    if (!projectId) {
      // Se não há projectId na rota, permite acesso (para rotas gerais)
      return of(true);
    }

    const user = this.storageService.getUser();
    if (!user || !user.email) {
      this.router.navigate(['/login']).then();
      return of(false);
    }

    // Verifica se o usuário tem acesso ao projeto
    return this.projectService.getProjectsByUserEmail(user.email).pipe(
      map(projects => {
        const hasAccess = projects.some(project => project.id === projectId);
        if (!hasAccess) {
          this.router.navigate(['/diagram']).then();
          return false;
        }
        return true;
      }),
      catchError(() => {
        this.router.navigate(['/diagram']).then();
        return of(false);
      })
    );
  }

}
