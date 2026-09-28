# BioPulse AI — Dynamic Doctors Architecture

## Architecture Flow

The doctors management and presentation system follows an end-to-end decoupled pipeline:

```
Django Admin (Superuser/Staff Management)
      ↓
Doctor Database Model (`apps.health.models.Doctor`)
      ↓
Doctor Serializer (`apps.health.serializers_doctor.DoctorSerializer`)
      ↓
Doctor REST API (`apps.health.views_doctor.DoctorViewSet` @ `/api/v1/doctors/`)
      ↓
React API Service/Hook (`apps/web/src/services/doctorService.ts` via `useDoctors()`)
      ↓
Doctors Page (`apps/web/src/pages/public/Doctors.tsx` @ `/doctors`)
      ↓
Dynamic Doctor Cards
```

---

## 1. Backend Layer

### Doctor Model (`apps.health.models.Doctor`)
Stores doctor profile data in the database with strict typing:
- `id`: AutoField (primary key)
- `name`: `CharField(max_length=255)` (required)
- `slug`: `SlugField(max_length=255, unique=True, blank=True)` (auto-generated from name if not provided)
- `profile_image`: `ImageField(upload_to="doctors/", null=True, blank=True)`
- `specialty`: `CharField(max_length=255, null=True, blank=True)`
- `short_bio`: `TextField(null=True, blank=True)`
- `is_active`: `BooleanField(default=True)` (publishes or unpublishes the doctor)
- `display_order`: `IntegerField(default=0)` (lower numbers appear first)
- `created_at`: `DateTimeField(auto_now_add=True)`
- `updated_at`: `DateTimeField(auto_now=True)`

### Media / Portrait Handling
- Configured in `backend/config/settings.py` via `MEDIA_URL = "/media/"` and `MEDIA_ROOT = BASE_DIR / "media"`.
- Routed in `backend/config/urls.py` in `DEBUG` mode.
- `DoctorSerializer` computes absolute URLs for uploaded images when `request` is available in context.

### Django Admin (`apps.health.admin.DoctorAdmin`)
- Manage doctor records (add, edit, delete).
- Upload and preview portraits (both thumbnail in list view and high-res preview on detail page).
- Inline list editing of `is_active` and `display_order`.
- Search by `name`, `specialty`, `short_bio`, and `slug`.
- Filter by `is_active`, `specialty`, and `created_at`.
- Bulk actions: "Publish selected doctors" and "Unpublish selected doctors".

---

## 2. Public REST API Endpoint

- **Endpoint**: `GET /api/v1/doctors/`
- **Permissions**: Public (`permissions.AllowAny`), strictly read-only (`ReadOnlyModelViewSet`).
- **Security**: Public users cannot POST (create), PUT/PATCH (edit), or DELETE (destroy). Attempts return HTTP 405 Method Not Allowed.
- **Filtering**: Only active doctors (`is_active=True`) are included. Inactive doctors are excluded from both list and detail endpoints.
- **Ordering**: Sorted ascending by `display_order`, then `name`, then `id`.

### Example JSON Response
```json
[
  {
    "id": 1,
    "name": "Dr. Ayesha Malik",
    "slug": "dr-ayesha-malik",
    "profile_image": "http://127.0.0.1:8000/media/doctors/dr_ayesha.jpg",
    "specialty": "Reproductive Endocrinologist",
    "short_bio": "Specialist in PCOS metabolic phenotyping and Rotterdam diagnostic criteria.",
    "is_active": true,
    "display_order": 1
  }
]
```

---

## 3. Frontend Layer

- **Route**: `/doctors` mounted under `PublicLayout` in `apps/web/src/App.tsx`.
- **TypeScript Interface**: `Doctor` defined in `apps/web/src/types/doctor.ts`.
- **Service & Hook**: `useDoctors()` in `apps/web/src/services/doctorService.ts` fetches data dynamically from Django REST API.
- **Page States**:
  - `LOADING`: BioPulse animated loading indicator with stethoscope motif.
  - `ERROR`: Safe, user-friendly error card with "Try Again" retry action (server details masked).
  - `EMPTY`: Clean state displayed when 0 active doctors are returned.
  - `SUCCESS / MULTIPLE DOCTORS`: Responsive grid of doctor cards reflecting Django Admin ordering.
