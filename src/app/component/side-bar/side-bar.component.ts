import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { AuthService } from '../../service/auth.service';
import { Router } from '@angular/router';
import { ProjectService } from '../../service/project.service';
import { StorageService } from '../../service/storage.service';
import { SharedService } from '../../service/shared.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-side-bar',
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.css']
})
export class SideBarComponent implements OnInit {

  @Output() itemClicked: EventEmitter<string> = new EventEmitter<string>();
  projects: any[] | null = [];
  email: string = '';
  isExpanded: boolean = false;
  isModalOpen: boolean = false;
  isHovered: boolean = false;
  private subscription: Subscription;

  constructor(public authService: AuthService, public projectService: ProjectService,
              private storageService: StorageService, private router: Router, private sharedService: SharedService) {
    this.subscription = this.authService.isLoggedIn.subscribe(() : void => {
      this.buildProjectList();
    });
  }

  ngOnInit(): void {
    this.buildProjectList();
  }

  toggleMenu(): void {
    this.isExpanded = !this.isExpanded;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']).then();
  }

  isLoginOrRegisterRoute() {
    const url = this.router.url;
    return url.includes('/login') || url.includes('/register');
  }

  buildProjectList() {
    const user = this.storageService.getUser();
    this.projectService.getProjectsByUserEmail(user.email).subscribe(response => {
      // @ts-ignore
      this.projects = response;
    });
  }

  loadProject(projectId: string) {
    this.sharedService.changeProjectId(projectId);
  }

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

}
