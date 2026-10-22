# EduNexa deployment: Vercel + Render + Neon + Cloudinary

## 1. Important security step

The uploaded archive contained `backend/.env`. It is intentionally omitted from the deployment package. Do not commit `.env` files. If any credential in that file has ever been pushed to a public repository or shared publicly, rotate it (especially Gemini API key and Gmail App Password).

## 2. Neon PostgreSQL

1. Create a Neon project and database.
2. Copy the PostgreSQL connection string with SSL enabled.
3. In Render environment variables, set `DATABASE_URL` to that full connection string.

## 3. Cloudinary media storage

1. Create a Cloudinary account.
2. Copy the Cloudinary URL from the dashboard.
3. Set `CLOUDINARY_URL` in Render environment variables.
4. Django FileField uploads (including notes) are configured to use Cloudinary storage.

## 4. Deploy Django backend to Render

Create a Web Service from the GitHub repository.
- Root Directory: `backend`
- Build Command: `bash build.sh`
- Start Command: `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`

Set these environment variables in Render (do not commit values):
- `SECRET_KEY`: a long random secret
- `DEBUG`: `False`
- `ALLOWED_HOSTS`: `YOUR-SERVICE.onrender.com`
- `DATABASE_URL`: Neon connection string
- `CLOUDINARY_URL`: Cloudinary connection URL
- `FRONTEND_URL`: `https://YOUR-APP.vercel.app`
- `CORS_ALLOWED_ORIGINS`: `https://YOUR-APP.vercel.app`
- `CSRF_TRUSTED_ORIGINS`: `https://YOUR-APP.vercel.app`
- `EMAIL_HOST`: `smtp.gmail.com`
- `EMAIL_PORT`: `587`
- `EMAIL_USE_TLS`: `True`
- `EMAIL_HOST_USER`: Gmail address
- `EMAIL_HOST_PASSWORD`: Gmail App Password
- `DEFAULT_FROM_EMAIL`: sender address
- `GEMINI_API_KEY` and `GEMINI_MODEL`: if PDF/AI features require them

Use actual deployed domains. If you add a custom domain, add it to the relevant host/origin lists too.

### Email warning for Render Free

The current notification code uses Gmail SMTP. Render Free web services block outbound SMTP ports 25, 465, and 587, so notifications sent through Gmail SMTP will not work on that free service. Use an HTTPS email API provider and update `notifications/email_utils.py`, or use a host/plan that permits SMTP. Do not assume the existing SMTP configuration works just because the variables are set.

## 5. Deploy React frontend to Vercel

1. Import the GitHub repository in Vercel.
2. Set Root Directory to `frontend`.
3. Framework preset: Vite; build command `npm run build`; output directory `dist`.
4. Add Environment Variable `VITE_API_URL` with value `https://YOUR-SERVICE.onrender.com/api`.
5. Deploy and then update Render's `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`, and `CSRF_TRUSTED_ORIGINS` with the actual Vercel domain.

`frontend/vercel.json` is included for client-side React Router routes.

## 6. Before pushing

- Ensure `.env` is not tracked: `git status --short` and `git ls-files backend/.env`.
- Run backend checks in a configured environment: `python manage.py check` and `python manage.py makemigrations --check`.
- Run frontend build: `npm ci` then `npm run build`.
- After deployment, test login, refresh-token flow, role permissions, test publishing, notes upload/download, AI/PDF features, and notification delivery.

## Free-tier limitations

Free tiers can change and do not guarantee lifetime availability. Render Free web services sleep when idle; keep database backups outside the hosting service. Neon and Cloudinary have usage limits.
