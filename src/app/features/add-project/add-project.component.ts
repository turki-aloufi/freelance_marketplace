// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
// import { HttpClient, HttpHeaders } from '@angular/common/http';
// // import { Skill } from '../../core/services/clients-projects.service'; // Ensure correct path
// import { SkillSelectorComponent } from '../../shared/skill-selector/skill-selector.component'; // Ensure correct path


// interface Skill {
//   SkillId: number;
//   Skill: string;
//   Category: string;
// }
// @Component({
//   selector: 'app-add-project',
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule, SkillSelectorComponent],
//   templateUrl: './add-project.component.html',
//   styleUrls: ['./add-project.component.css']
// })
// export class AddProjectComponent implements OnInit {
//   projectForm: FormGroup;
//   skills: Skill[] = []; // Explicitly typed with the service's Skill interface
//   successMessage: string | null = null;
//   errorMessage: string | null = null;

//   constructor(private fb: FormBuilder, private http: HttpClient) {
//     this.projectForm = this.fb.group({
//       projectName: ['', [Validators.required, Validators.minLength(3)]],
//       description: ['', [Validators.required, Validators.minLength(10)]],
//       requiredTasks: ['', Validators.required],
//       additionalNotes: [''],
//       budget: [0, [Validators.required, Validators.min(1)]],
//       deadline: ['', [Validators.required, Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)]]
//     });
//   }

//   ngOnInit() {}

//   submitProject() {
//     if (this.projectForm.invalid) {
//       this.projectForm.markAllAsTouched();
//       return;
//     }

//     const formValue = this.projectForm.value;
//     const payload = {
//       title: formValue.projectName,
//       projectOverview: formValue.description,
//       requiredTasks: formValue.requiredTasks,
//       additionalNotes: formValue.additionalNotes,
//       budget: formValue.budget,
//       deadline: formValue.deadline,
//       skills: this.skills
//     };

//     const token = localStorage.getItem('token');
//     if (!token) {
//       this.errorMessage = 'Authentication token not found. Please log in.';
//       return;
//     }

//     const headers = new HttpHeaders({
//       'Authorization': `Bearer ${token}`,
//       'Content-Type': 'application/json'
//     });

//     this.http.post<{ projectId: number }>('http://localhost:5021/api/projects/create', payload, { headers })
//       .subscribe({
//         next: (response) => {
//           this.successMessage = `Project created successfully with ID: ${response.projectId}`;
//           this.errorMessage = null;
//           this.projectForm.reset();
//           this.skills = [];
//         },
//         error: (err) => {
//           console.error('Error creating project:', err);
//           this.errorMessage = 'Failed to create project. Please try again.';
//           this.successMessage = null;
//         }
//       });
//   }
// }


import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SkillSelectorComponent } from '../../shared/skill-selector/skill-selector.component';
interface Skill {
  SkillId: number;
  Skill: string;
  Category: string;
}
@Component({
  selector: 'app-add-project',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SkillSelectorComponent],
  templateUrl: './add-project.component.html',
  styleUrls: ['./add-project.component.css']
})
export class AddProjectComponent implements OnInit {
  projectForm: FormGroup;
  skills: Skill[] = []; // Use Skill from ClientsProjectsService
  successMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.projectForm = this.fb.group({
      projectName: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      requiredTasks: ['', Validators.required],
      additionalNotes: [''],
      budget: [0, [Validators.required, Validators.min(1)]],
      deadline: ['', [Validators.required, Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)]]
    });
  }

  ngOnInit() {}

  submitProject() {
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      return;
    }

    const formValue = this.projectForm.value;
    const payload = {
      title: formValue.projectName,
      projectOverview: formValue.description,
      requiredTasks: formValue.requiredTasks,
      additionalNotes: formValue.additionalNotes,
      budget: formValue.budget,
      deadline: formValue.deadline,
      skills: this.skills.map(skill => ({
        skillId: skill.SkillId,
        skill: skill.Skill,
        category: skill.Category
      }))
    };

    const token = localStorage.getItem('token');
    if (!token) {
      this.errorMessage = 'Authentication token not found. Please log in.';
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.post<{ projectId: number }>('http://localhost:5021/api/projects/create', payload, { headers })
      .subscribe({
        next: (response) => {
          this.successMessage = `Project created successfully with ID: ${response.projectId}`;
          this.errorMessage = null;
          this.projectForm.reset();
          this.skills = [];
        },
        error: (err) => {
          console.error('Error creating project:', err);
          this.errorMessage = 'Failed to create project. Please try again.';
          this.successMessage = null;
        }
      });
  }
}