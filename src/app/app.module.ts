import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DiagramComponent } from './diagram/diagram.component';
import { FormsModule } from '@angular/forms';
import { TableEditorComponent } from './component/table-editor/table-editor.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { JwtInterceptor } from './interceptor/jwt.interceptor';
import { LoginComponent } from './component/login/login.component';
import { RegisterComponent } from './component/register/register.component';

@NgModule({
  declarations: [
    AppComponent,
    DiagramComponent,
    TableEditorComponent,
    LoginComponent,
    RegisterComponent,
  ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        FormsModule,
        HttpClientModule
    ],
  providers: [{provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true}],
  bootstrap: [AppComponent]
})
export class AppModule { }
