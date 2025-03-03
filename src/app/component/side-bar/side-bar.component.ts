import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { AuthService } from '../../service/auth.service';
import { Router } from '@angular/router';
import { ProjectService } from '../../service/project.service';
import { StorageService } from '../../service/storage.service';
import { SharedService } from '../../service/shared.service';
import { Subscription } from 'rxjs';
import { AuthResponseModel } from "../../model/auth-response.model";

@Component({
  selector: 'app-side-bar',
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.css']
})
export class SideBarComponent implements OnInit {

  @Output() itemClicked: EventEmitter<string> = new EventEmitter<string>();
  projects: any[] | null = [];
  email: string = '';
  isModalOpen: boolean = false;
  hoveredProjectId: string | null = null;

  isEditMode: boolean = false;
  selectedProject: any = null;

  private subscription: Subscription;
  protected user: AuthResponseModel;

  constructor(public authService: AuthService, public projectService: ProjectService, private storageService: StorageService, private router: Router, private sharedService: SharedService) {
    this.user = this.storageService.getUser();
    this.subscription = this.authService.isLoggedIn.subscribe((): void => {
      this.buildProjectList();
    });
  }

  ngOnInit(): void {
    this.buildProjectList();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']).then();
  }

  isLoginOrRegisterRoute() {
    const url: string = this.router.url;
    return url.includes('/login') || url.includes('/register');
  }

  buildProjectList() {
    this.projectService.getProjectsByUserEmail(this.user.email).subscribe(response => {
      // @ts-ignore
      this.projects = response;
    });
  }

  loadProject(projectId: string) {
    this.sharedService.changeProjectId(projectId);
  }

  openCreateModal() {
    this.isEditMode = false;
    this.selectedProject = null;
    this.isModalOpen = true;
  }

  openEditModal(project: any, event: MouseEvent) {
    event.stopPropagation();
    this.isEditMode = true;
    this.selectedProject = { ...project };
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.buildProjectList();
  }

  setHoveredProject(projectId: string | null) {
    this.hoveredProjectId = projectId;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

}
