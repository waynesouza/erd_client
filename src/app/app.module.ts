import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DiagramComponent } from './diagram/diagram.component';
import { FormsModule } from "@angular/forms";
import { TableEditorComponent } from './component/table-editor/table-editor.component';

@NgModule({
  declarations: [
    AppComponent,
    DiagramComponent,
    TableEditorComponent,
  ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        FormsModule
    ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
