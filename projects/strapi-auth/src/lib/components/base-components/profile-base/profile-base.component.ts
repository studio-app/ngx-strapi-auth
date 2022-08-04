import { Component, OnInit } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators
} from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../services/auth/auth.service';
import { IUser } from '../../../types/models/User';
import { IReqUserUpdate } from '../../../types/requests/ReqUserUpdate';

@Component({
  selector: 'strapi-profile-base',
  template: ''
})
export class ProfileBaseComponent implements OnInit {
  public form: UntypedFormGroup = new UntypedFormBuilder().group({
    firstname: new UntypedFormControl(),
    lastname: new UntypedFormControl(),
    email: new UntypedFormControl(),
    username: new UntypedFormControl()
  });

  public passwordForm: UntypedFormGroup = new UntypedFormBuilder().group({
    password: new UntypedFormControl('', [
      Validators.required,
      Validators.pattern(
        '(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[$@$!%*?&])[A-Za-z\\d$@$!%*?&].{8,}'
      )
    ]),
    rePass: new UntypedFormControl('', [
      Validators.required,
      Validators.pattern(
        '(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[$@$!%*?&])[A-Za-z\\d$@$!%*?&].{8,}'
      )
    ]),
    oldPassword: new UntypedFormControl()
  });

  oldUserObj: IUser;

  userObj = {
    firstname: null,
    lastname: null,
    email: null,
    username: null,
    password: null,
    password_confirmation: null,
    oldPassword: null,
    provider: null
  };

  redirectDelay = 0;
  showMessages: any = {
    error: true
  };

  // TODO: Create error component for displaying errors
  // TODO: Add opt in error notifications
  submitted = false;
  passwordSubmitted = false;
  errors: string[] = [];
  messages: string[] = [];

  config = {
    firstnameRequired: false,
    firstnameMinLength: 2,
    firstnameMaxLength: 100,
    lastnameRequired: false,
    lastnameMinLength: 2,
    lastnameMaxLength: 100,
    usernameRequired: true,
    usernameMinLength: 2,
    usernameMaxLength: 100,
    emailRequired: true,
    passwordRequired: true,
    passwordMinLength: 6,
    passwordMaxLength: 60
  };

  constructor(
    protected authService: AuthService,
    protected translate: TranslateService
  ) {}

  ngOnInit(): void {
    // Import existing user obj
    this.oldUserObj = this.authService.getUser();

    if (this.oldUserObj) {
      this.userObj = {
        firstname: null,
        lastname: null,
        username: this.oldUserObj.username,
        email: this.oldUserObj.email,
        password: null,
        password_confirmation: null,
        oldPassword: null,
        provider: null
      };
    }
    // Hook on update from user service
    this.authService.UserState.subscribe(() => {
      this.oldUserObj = this.authService.getUser();
      this.userObj = {
        firstname: null,
        lastname: null,
        username: this.oldUserObj.username,
        email: this.oldUserObj.email,
        password: null,
        password_confirmation: null,
        oldPassword: null,
        provider: null
      };
    });
  }

  /**
   * Update UserData if changed
   */
  update(): void {
    this.clearErrors();
    this.submitted = true;
    const updateRequest: IReqUserUpdate = {
      username:
        this.userObj.username &&
        this.oldUserObj.username !== this.userObj.username
          ? this.userObj.username
          : null,
      email:
        this.userObj.email && this.oldUserObj.email !== this.userObj.email
          ? this.userObj.email
          : null,
      password: null,
      oldPassword: null
    };

    if (!updateRequest.username && !updateRequest.email) {
      this.submitted = false;
      return;
    }

    this.authService
      .updateProfile(updateRequest)
      .then(() => {
        this.submitted = false;
      })
      .catch((err) => {
        console.error(err);

        if (err.error.message === 'Username already exists!') {
          console.log('error');
          this.errors.push(
            this.translate.instant('errors.auth.profile.username_existence')
          );

          console.log(this.errors);
        }

        if (err.error.message === 'Email already exists!') {
          this.errors.push(
            this.translate.instant('errors.auth.profile.email_existence')
          );
        }

        this.submitted = false;
      });

    this.form.markAsPristine();
  }

  /**
   * Update password if changed
   * and confirmed
   */
  updatePassword(): void {
    this.clearErrors();
    this.passwordSubmitted = true;
    const updateRequest: IReqUserUpdate = {
      email: null,
      username: null,
      password:
        this.userObj.email && this.userObj.password_confirmation
          ? this.userObj.password
          : null,
      oldPassword: this.userObj.oldPassword
    };

    if (!updateRequest.password) {
      this.passwordSubmitted = false;
      return;
    }

    this.authService
      .updateProfile(updateRequest)
      .then(() => {
        this.passwordSubmitted = false;
        this.passwordForm.controls.password.reset();
        this.passwordForm.controls.rePass.reset();
        this.passwordForm.controls.oldPassword.reset();
      })
      .catch((err) => {
        console.error(err);

        // TODO: Display errors

        if (err.error.message === 'Old user password does not match!') {
          this.errors.push(
            this.translate.instant('errors.auth.profile.wrong_current_password')
          );
        } else if (
          err.error.message === 'Password does not fulfill requirements!'
        ) {
          this.errors.push(
            this.translate.instant('errors.auth.profile.password_requirements')
          );
        } else {
          this.errors.push(
            this.translate.instant('errors.auth.profile.password_change_error')
          );
        }

        this.passwordSubmitted = false;
      });
  }

  private clearErrors(): void {
    this.errors = [];
  }
}