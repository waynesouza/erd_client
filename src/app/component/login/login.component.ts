import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../service/auth.service';
import { Router } from '@angular/router';
import { LoginModel } from '../../model/login.model';
import { StorageService } from "../../service/storage.service";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  login: LoginModel = {
    email: '',
    password: ''
  };
  isLoggedIn = false;
  isLoginFailed = false;
  errorMessage = '';

  constructor(private authService: AuthService, private storageService: StorageService, private router: Router) { }

  ngOnInit(): void {
    if (this.storageService.isLoggedIn()) {
      this.isLoggedIn = true;
      // If already logged in, redirect to diagram
      this.router.navigate(['/diagram']).then();
    }
  }

  onSubmit(): void {
    this.authService.login(this.login).subscribe({
      next: (data) => {
        this.storageService.saveUser(data);

        this.isLoggedIn = true;
        this.isLoginFailed = false;
        this.router.navigate(['/diagram']).then();
      },
      error: (err) => {
        this.errorMessage = err.error.message;
        this.isLoginFailed = true;
      }
    });
  }

}
