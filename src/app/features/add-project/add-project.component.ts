import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SkillSelectorComponent } from '../../shared/skill-selector/skill-selector.component';
import { ClientsProjectsService } from '../../core/services/clients-projects.service'; 

interface Skill {
  SkillId: number;
  Skill: string;
  Category: string;
}


@Component({
  selector: 'app-add-project',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SkillSelectorComponent, MatSnackBarModule],
  templateUrl: './add-project.component.html',
  styleUrls: ['./add-project.component.css']
})
export class AddProjectComponent implements OnInit {
  projectForm: FormGroup;
  skills: Skill[] = [];
  successMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(private fb: FormBuilder, private clientsProjectsService: ClientsProjectsService, private router: Router, private snackBar: MatSnackBar) {
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

    this.clientsProjectsService.createProject(payload)
      .subscribe({
        next: (response) => {
          this.successMessage = `Project created successfully with ID: ${response.projectId}`;
          this.errorMessage = null;
          this.projectForm.reset();
          this.skills = [];
          this.snackBar.open(this.successMessage, 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
          this.router.navigate(['/client/projects']);
        },
        error: (err) => {
          console.error('Error creating project:', err);
          this.errorMessage = 'Failed to create project. Please try again.';
          this.successMessage = null;
        }
      });
  }
}