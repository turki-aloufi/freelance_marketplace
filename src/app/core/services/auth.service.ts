import { Injectable, NgZone, PLATFORM_ID, Inject } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

// Interface for the backend DTO
export interface CreateUserDto {
  userId: string;
  name: string;
  email: string;
  phone: string;
  aboutMe: string;
  skills: SkillDto[];
}

export interface SkillDto {
  skillId: number;
  skill: string;
  category: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user$ = new BehaviorSubject<any>(null);
  private apiUrl = 'http://localhost:5021/api/users/create';

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router,
    private http: HttpClient,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    onAuthStateChanged(this.auth, (user) => {
      this.user$.next(user);
      if (isPlatformBrowser(this.platformId)) {
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
        } else {
          localStorage.removeItem('user');
        }
      }
    });
  }

  async signUp(userData: { firstName: string, lastName: string, email: string, contactNumber: string, skills: SkillDto[], about: string, password: string }) {
    try {
      const { email, password, firstName, lastName, contactNumber, skills, about } = userData;
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;

      // Prepare data for backend API
      const createUserDto: CreateUserDto = {
        userId: user.uid,
        name: `${firstName} ${lastName}`,
        email,
        phone: contactNumber,
        aboutMe: about,
        skills
      };
      console.log(createUserDto);
      // Call backend API to save user data
      await this.http.post(this.apiUrl, createUserDto).toPromise();

      this.ngZone.run(() => this.router.navigate(['/home']));
      return user;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  async loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(this.auth, provider);
      const user = userCredential.user;
  
      // Get Firebase token
      const token = await user.getIdToken();
      // Store the token in localStorage (or sessionStorage)
      localStorage.setItem('token', token);
  
      const createUserDto: CreateUserDto = {
        userId: user.uid,
        name: user.displayName || '',
        email: user.email || '',
        phone: '',
        aboutMe: '',
        skills: []
      };
  
      console.log(createUserDto);
  
      await this.http.post(this.apiUrl, createUserDto).toPromise();
  
      console.log("from auth service", userCredential);
      this.ngZone.run(() => this.router.navigate(['/home']));
      return user;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
  

  async loginWithEmail(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      console.log("from auth service" + userCredential)
      this.ngZone.run(() => this.router.navigate(['/dashboard']));
      return userCredential.user;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  async logout() {
    try {
      await signOut(this.auth);
      this.router.navigate(['/sign-in']);
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  get isAuthenticated(): boolean {
    return !!this.user$.value;
  }
}
