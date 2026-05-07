# Current Task: Implement Google Login Backend Authentication

## Status
- [x] Install `Google.Apis.Auth` package
- [x] Update `User` model with `IsGoogleAccount`
- [x] Update `appsettings.json` with `GoogleAuth` configuration
- [x] Create `GoogleLoginRequestDto`
- [x] Create `GoogleAuthResponseDto`
- [x] Implement `GoogleLoginAsync` in `AuthService`
- [x] Implement `POST /api/auth/google` in `AuthController`
- [x] Update documentation and module contexts
- [x] Final verification

## Details
- Frontend sends `idToken` from Google OAuth popup.
- Backend verifies `idToken` using `GoogleJsonWebSignature`.
- New users are automatically created with a `Student` profile.
- Existing users are logged in (linked by email).
- Internal JWT is generated with standard claims (`userId`, `email`, `role`, `studentId`, `tutorId`).

## Next Steps
1. Update `ai-context/contexts/modules/auth-context.md`.
2. Update `ai-context/reviews/auth-review.md`.
3. Update `ai-context/global/MODULE_INDEX.md`.
