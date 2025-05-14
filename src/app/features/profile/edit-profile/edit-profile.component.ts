import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../../core/services/user/user.service';
import { finalize } from 'rxjs/operators';
import { SkillSelectorComponent } from '../../../shared/skill-selector/skill-selector.component';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import axios from 'axios'; 
import Bugsnag from '@bugsnag/js'; 

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
  imagePreview: string | null = null; // For local image preview
  selectedFile: File | null = null; // Store selected file until submission

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

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.selectedFile = file; // Store file for later upload
    this.imagePreview = URL.createObjectURL(file); // Create local preview URL
  }

async uploadImageToCloudinary(): Promise<string | null> {
  if (!this.selectedFile) return null;

  const formData = new FormData();
  formData.append('file', this.selectedFile);
  formData.append('upload_preset', 'unsigned_preset');

  try {
    const response = await axios.post(
      'https://api.cloudinary.com/v1_1/dpvg0vp6t/image/upload',
      formData
    );
    return response.data.secure_url;
  } catch (error: unknown) {  // Explicitly type as unknown
    console.error('Image upload failed:', error);
    
    // Type guard to ensure it's an Error
    if (error instanceof Error) {
      Bugsnag.notify(error, event => {
        event.severity = 'error';
        event.context = 'Cloudinary Upload Failed';
        
        // For Axios errors specifically
        if (axios.isAxiosError(error)) {
          event.addMetadata('Upload Error', {
            status: error.response?.status,
            data: error.response?.data,
            fileName: this.selectedFile?.name,
            fileSize: this.selectedFile?.size
          });
        }
      });
    }
    
    return null;
  }
}

  async onSubmit(): Promise<void> {
  if (this.profileForm.invalid || this.isSubmitting || !this.userId) return;

  this.isSubmitting = true;

  // Upload image to Cloudinary if a file was selected
  const uploadedImageUrl = await this.uploadImageToCloudinary();
  if (uploadedImageUrl) {
    this.profileForm.patchValue({ imageUrl: uploadedImageUrl });
  }

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
    finalize(() => {
      this.isSubmitting = false;
      // Clean up preview URL to avoid memory leaks
      if (this.imagePreview) {
        URL.revokeObjectURL(this.imagePreview);
        this.imagePreview = null;
      }
      this.selectedFile = null;
    })
  ).subscribe({
    next: () => {
      this.userService.clearCachedProfile();
      this.router.navigate(['/profile', this.userId]);
    },
    error: (err) => {
      console.error('Failed to update profile', err);
      // Add Bugsnag notification exactly like in ProjectDetailComponent
      const errorMessage = err.error?.message || 'Failed to update profile';
      Bugsnag.notify(err, event => {
        event.setUser(this.userId || undefined, undefined, '');
        event.addMetadata('ProfileUpdateError', {
          userId: this.userId,
          responseMessage: errorMessage,
          statusCode: err.status,
          statusText: err.statusText,
        });
      });
    }
  });
}

  onSkillsChange(skills: UISkill[]): void {
    this.selectedSkills = skills;
  }
}