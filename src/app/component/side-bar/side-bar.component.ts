import { Component } from '@angular/core';
import { AuthService } from "../../service/auth.service";
import { Router } from "@angular/router";

@Component({
  selector: 'app-side-bar',
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.css']
})
export class SideBarComponent {

  projects = [];
  fullName: string = '';
  email: string = '';

  constructor(public authService: AuthService, private router: Router) {
    const user = JSON.parse(localStorage.getItem('loggedUser')!);
    if (user) {
      this.fullName = user.fullName;
      this.email = user.email;
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

}
