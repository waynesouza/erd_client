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
import { SideBarComponent } from './component/side-bar/side-bar.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CreateProjectModalComponent } from './component/modal/create-project-modal/create-project-modal.component';
import { EntityEditFormComponent } from './component/entity-edit-form/entity-edit-form.component';
import { ProjectModalComponent } from './component/modal/project/project-modal.component';

@NgModule({
  declarations: [
    AppComponent,
    DiagramComponent,
    TableEditorComponent,
    LoginComponent,
    RegisterComponent,
    SideBarComponent,
    CreateProjectModalComponent,
    EntityEditFormComponent,
    ProjectModalComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule
  ],
  providers: [{ provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true }],
  bootstrap: [AppComponent]
})
export class AppModule { }
