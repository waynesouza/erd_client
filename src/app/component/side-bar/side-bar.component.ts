import { Component } from '@angular/core';
import { AuthService } from "../../service/auth.service";
import { Router } from "@angular/router";
import { ProjectService } from "../../service/project.service";

@Component({
  selector: 'app-side-bar',
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.css']
})
export class SideBarComponent {

  projects: any[] | null = [];
  fullName: string = '';
  email: string = '';

  constructor(public authService: AuthService, public projectService: ProjectService, private router: Router) {
    const user = JSON.parse(localStorage.getItem('loggedUser')!);
    if (user) {
      this.fullName = user.fullName;
      this.email = user.email;
      this.buildProjectList()
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']).then();
  }

  isLoginOrRegisterRoute() {
    const url = this.router.url;
    return url.includes('/login') || url.includes('/register');
  }

  buildProjectList() {
    console.log('Getting projects by user email: ' + this.email);
    this.projectService.getProjectsByUserEmail(this.email).subscribe(response => {
      this.projects = response.body;
    });
  }

}
