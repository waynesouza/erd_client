import { Component, OnInit } from '@angular/core';
import { AuthService } from "../../service/auth.service";

@Component({
  selector: 'app-side-bar',
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.css']
})
export class SideBarComponent {

  isVisible = true;
  projects = [];
  fullName: string = '';
  email: string = '';

  constructor(public authService: AuthService) {
    const user = JSON.parse(localStorage.getItem('loggedUser')!);
    if (user) {
      this.fullName = user.fullName;
      this.email = user.email;
    }
  }

  toggleSidebar() {
    this.isVisible = !this.isVisible;
  }

  logout() {
    this.authService.logout();
  }

}
