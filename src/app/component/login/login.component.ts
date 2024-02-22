import { Component } from '@angular/core';
import { AuthService } from '../../service/auth.service';
import { Router } from '@angular/router';
import { LoginModel } from '../../model/login.model';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  login: LoginModel = {
    email: '',
    password: ''
  };

  constructor(private authService: AuthService, private router: Router) { }

  async onSubmit() {
    await this.authService.login(this.login).then(() => {
      this.router.navigate(['/diagram']).then();
    });
  }

}
