import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './component/login/login.component';
import { DiagramComponent } from "./diagram/diagram.component";
import { RegisterComponent } from "./component/register/register.component";

const routes: Routes = [
  {path: '', redirectTo: '/diagram', pathMatch: 'full'},
  {path: 'login', component: LoginComponent},
  {path: 'register', component: RegisterComponent},
  {path: 'diagram', component: DiagramComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
