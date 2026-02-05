# Jenkins Credentials Setup Guide

There are two common ways to handle these credentials in Jenkins: using **Secret Text Credentials** (Best Practice for passwords/secrets) or **Environment Variables** (Simpler for non-secrets).

## Method 1: Using Jenkins Credentials (Recommended for Security)

Use this method for `GOOGLE_CLIENT_SECRET`, `JWT_SECRET`, and `DB_PASSWORD`.

1.  **Go to Credentials**:
    *   Dashboard -> **Manage Jenkins** -> **Manage Credentials**.
    *   Click on **(global)** domain (or specific domain if configured).
    *   Click **Add Credentials**.

2.  **Add Each Secret**:
    *   **Kind**: Select **Secret text**.
    *   **Scope**: Global (Jenkins, nodes...).
    *   **Secret**: Paste the actual value (e.g., `GOCSPX-...`).
    *   **ID**: Enter a name you will reference later (e.g., `tahuna-google-secret`).
    *   **Description**: Optional description.
    *   *Repeat this for `DB_PASSWORD` and `JWT_SECRET`.*

3.  **Inject in Job (Freestyle Project)**:
    *   Go to your Job -> **Configure**.
    *   Under **Build Environment**, check **Use secret text(s) or file(s)**.
    *   Click **Add** -> **Secret text**.
    *   **Variable**: Enter the env var name your script expects (e.g., `GOOGLE_CLIENT_SECRET`).
    *   **Credentials**: Select the credential ID you created in Step 2.

4.  **Inject in Job (Pipeline)**:
    ```groovy
    pipeline {
        agent any
        environment {
            GOOGLE_CLIENT_SECRET = credentials('tahuna-google-secret')
            DB_PASSWORD = credentials('tahuna-db-password')
            // ... other secrets
        }
        stages {
            stage('Deploy') {
                steps {
                    sh './jenkins_deploy.sh'
                }
            }
        }
    }
    ```

## Method 2: Global Properties (For Non-Secrets)

Use this for `GOOGLE_CLIENT_ID`, `GOOGLE_REDIRECT_URI`, `FRONTEND_URL` if you don't mind them being visible in configurations.

1.  **Manage Jenkins** -> **Configure System**.
2.  Scroll to **Global properties**.
3.  Check **Environment variables**.
4.  Add your list:
    *   Key: `GOOGLE_CLIENT_ID`, Value: `9428...`
    *   Key: `GOOGLE_REDIRECT_URI`, Value: `https://...`

## Recommended "Quick Start" for Your Script

If you just want to run the script quickly in a Freestyle job:

1.  Go to your Job -> **Configure**.
2.  Look for **Build Environment** -> **Inject environment variables to the build process** (requires *EnvInject Plugin* if not using standard secrets).
3.  Or, simply add them in the **Execute Shell** block right before running the script (Least secure, but works for testing):

```bash
# In the Jenkins "Execute Shell" block:

export GOOGLE_CLIENT_ID="your-id"
export GOOGLE_CLIENT_SECRET="your-secret"
export GOOGLE_REDIRECT_URI="http://..."
export JWT_SECRET="your-jwt-secret"
export DB_PASSWORD="your-db-password"
export FRONTEND_URL="http://..."

chmod +x jenkins_deploy.sh
./jenkins_deploy.sh
```
