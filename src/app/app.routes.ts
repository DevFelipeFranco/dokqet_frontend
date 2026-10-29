import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { superAdminGuard } from './core/auth/super-admin.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'panel'
  },
  {
    path: 'iniciar-sesion',
    title: 'Iniciar sesión · Dokqet',
    loadComponent: () => import('./features/auth/sign-in/sign-in.component').then(m => m.SignInComponent)
  },
  {
    path: 'registro',
    title: 'Registro · Dokqet',
    loadComponent: () => import('./features/auth/sign-up/sign-up.component').then(m => m.SignUpComponent)
  },
  {
    path: 'recuperar-contrasena',
    title: 'Recuperar contraseña · Dokqet',
    loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'restablecer-contrasena',
    title: 'Restablecer contraseña · Dokqet',
    loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'verificar-correo',
    title: 'Verificación de Correo · Dokqet',
    loadComponent: () => import('./features/auth/verify-email/verify-email.component').then(m => m.VerifyEmailComponent)
  },
  {
    path: 'panel',
    title: 'Panel de procesos · Dokqet',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'procesos/nuevo',
    title: 'Registrar proceso · Dokqet',
    canActivate: [authGuard],
    loadComponent: () => import('./features/processes/register/register-process.component').then(m => m.RegisterProcessComponent)
  },
  {
    path: 'procesos/:id',
    title: 'Detalle de proceso · Dokqet',
    canActivate: [authGuard],
    loadComponent: () => import('./features/processes/detail/process-detail.component').then(m => m.ProcessDetailComponent)
  },
  {
    path: 'perfil',
    title: 'Mi perfil y administración · Dokqet',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'organizacion',
    title: 'Administración de organización · Dokqet',
    canActivate: [authGuard],
    loadComponent: () => import('./features/organization/organization-admin.component').then(m => m.OrganizationAdminComponent)
  },
  {
    path: 'organizaciones/nueva',
    title: 'Crear organización · Dokqet',
    canActivate: [authGuard],
    loadComponent: () => import('./features/organization/organization-admin.component').then(m => m.OrganizationAdminComponent)
  },
  {
    path: 'invitacion/:token',
    title: 'Invitación a Organización · Dokqet',
    loadComponent: () => import('./features/invitation/accept-invitation.component').then(m => m.AcceptInvitationComponent)
  },
  {
    path: 'catalogos',
    title: 'Catálogos y Tablas Maestras · Dokqet',
    canActivate: [authGuard],
    loadComponent: () => import('./features/admin/catalogs/catalogs-admin.component').then(m => m.CatalogsAdminComponent)
  },
  {
    path: 'admin/catalogos',
    redirectTo: 'catalogos'
  },
  {
    path: '**',
    redirectTo: 'panel'
  }
];
