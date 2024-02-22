import { Component } from '@angular/core';
import { RegisterModel } from '../../model/register.model';
import { AuthService } from '../../service/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['../login/login.component.css']
})
export class RegisterComponent {

  register: RegisterModel = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'EDITOR'
  };

  constructor(private authService: AuthService, private router: Router) { }

  onSubmit() {
    this.authService.register(this.register).subscribe(() => {
      this.router.navigate(['/login']).then();
    });
  }

}
