import { Component } from '@angular/core';
import { AuthService } from '../../service/auth.service';
import { Router } from '@angular/router';
import { Login } from '../../model/login.model';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  login: Login = {
    email: '',
    password: ''
  };

  constructor(private authService: AuthService, private router: Router) { }

  onSubmit() {
    this.authService.login(this.login).subscribe(() => {
      this.router.navigate(['/diagram']).then();
    });
  }

}
