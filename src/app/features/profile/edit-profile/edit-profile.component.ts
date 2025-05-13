import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../../core/services/user/user.service';
import { finalize } from 'rxjs/operators';
import { SkillSelectorComponent } from '../../../shared/skill-selector/skill-selector.component';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router'; 

interface UISkill {
  SkillId: number;
  Skill: string;
  Category: string;
}

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SkillSelectorComponent
  ]
})
export class EditProfileComponent implements OnInit {
  profileForm: FormGroup;
  isLoading = false;
  isSubmitting = false;
  currentProfile: any;
  selectedSkills: UISkill[] = [];
  userId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router 
  ) {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      phone: [''],
      imageUrl: [''],
      aboutMe: ['']
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.userId = params.get('id');
      if (this.userId) {
        this.loadUserProfile(this.userId);
      } else {
        console.error('No user ID in route');
      }
    });
  }

  private transformToUISkill(skill: any): UISkill {
    return {
      SkillId: skill.skillId || skill.SkillId,
      Skill: skill.skill || skill.Skill,
      Category: skill.category || skill.Category
    };
  }

  loadUserProfile(userId: string): void {
    this.isLoading = true;

    this.userService.getUserProfile(userId).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (profile) => {
        this.currentProfile = profile;
        this.selectedSkills = (profile.skills || []).map(this.transformToUISkill);
        this.profileForm.patchValue({
          name: profile.name,
          phone: profile.phone,
          imageUrl: profile.imageUrl,
          aboutMe: profile.aboutMe
        });
      },
      error: (err) => {
        console.error('Failed to load profile', err);
      }
    });
  }

  onSkillsChange(skills: UISkill[]): void {
    this.selectedSkills = skills;
  }

  onSubmit(): void {
    if (this.profileForm.invalid || this.isSubmitting || !this.userId) return;

    this.isSubmitting = true;

    const formData = this.profileForm.value;
    const editProfileDto = {
      ...formData,
      skills: this.selectedSkills.map(skill => ({
        skillId: skill.SkillId,
        Skill: skill.Skill,
        Category: skill.Category
      }))
    };

    this.userService.updateUserProfile(editProfileDto).pipe(
      finalize(() => this.isSubmitting = false)
    ).subscribe({
      next: () => {
        this.userService.clearCachedProfile();
        // Redirect to profile page after successful update
        this.router.navigate(['/profile', this.userId]);
      },
      error: (err) => {
        console.error('Failed to update profile', err);
      }
    });
  }
}