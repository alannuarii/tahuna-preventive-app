pipeline {
    agent any

    environment {
        APP_NAME = 'tahuna-preventive-app'
        HOST_PORT = '3013'
        CONTAINER_PORT = '3000'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Prepare Env') {
            steps {
                withCredentials([file(credentialsId: 'tahuna-preventive-env', variable: 'ENV_FILE')]) {
                    sh 'cp "$ENV_FILE" .env'
                }
            }
        }

        stage('Build Image') {
            steps {
                sh "docker build -t ${APP_NAME}:latest ."
            }
        }

        stage('Deploy') {
            steps {
                sh """
                    docker stop ${APP_NAME} || true
                    docker rm ${APP_NAME} || true
                    docker run -d \
                        --name ${APP_NAME} \
                        --restart unless-stopped \
                        --env-file .env \
                        -p ${HOST_PORT}:${CONTAINER_PORT} \
                        ${APP_NAME}:latest
                """
            }
        }
    }

    post {
        always {
            sh 'rm -f .env'
        }
        success {
            echo "✅ ${APP_NAME} deployed on port ${HOST_PORT}"
        }
        failure {
            echo "❌ Deployment failed for ${APP_NAME}"
        }
    }
}
