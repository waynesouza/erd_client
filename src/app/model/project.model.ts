export interface ProjectUser {
  id: string;
  email: string;
  role: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt?: string;
  usersDto: ProjectUser[];
}

export interface CreateProjectDto {
  name: string;
  description: string;
  userEmail: string;
}

export interface UpdateProjectDto {
  id: string;
  name: string;
  description: string;
}
