pipeline {
    agent any

    environment {
        APP_NAME        = 'tahuna-preventive-app'
        DOCKER_IMAGE    = "tahuna-preventive-app"
        CONTAINER_NAME  = 'tahuna-preventive-app'
        CONTAINER_PORT  = '3000'
        HOST_PORT       = '3006'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    sh "docker build -t ${DOCKER_IMAGE}:${BUILD_NUMBER} -t ${DOCKER_IMAGE}:latest ."
                }
            }
        }

        stage('Deploy') {
            steps {
                // Inject .env file from Jenkins Secret File credential
                withCredentials([file(credentialsId: 'tahuna-preventive-env', variable: 'ENV_FILE')]) {
                    script {
                        // Stop and remove existing container if running
                        sh """
                            docker stop ${CONTAINER_NAME} || true
                            docker rm ${CONTAINER_NAME} || true
                        """

                        // Run new container with .env file mounted
                        sh """
                            docker run -d \
                                --name ${CONTAINER_NAME} \
                                --restart always \
                                --env-file \${ENV_FILE} \
                                -e PORT=${CONTAINER_PORT} \
                                -e HOST=0.0.0.0 \
                                -e NODE_ENV=production \
                                -p ${HOST_PORT}:${CONTAINER_PORT} \
                                ${DOCKER_IMAGE}:latest
                        """
                    }
                }
            }
        }

        stage('Health Check') {
            steps {
                script {
                    // Wait for container to be ready
                    sh """
                        echo "Waiting for application to start..."
                        sleep 10
                        curl -sf http://localhost:${HOST_PORT}/ > /dev/null && echo "✅ Health check passed!" || (echo "❌ Health check failed!" && exit 1)
                    """
                }
            }
        }

        stage('Cleanup') {
            steps {
                script {
                    // Remove old Docker images (keep latest and current build)
                    sh """
                        docker images ${DOCKER_IMAGE} --format '{{.Tag}}' | grep -v latest | grep -v ${BUILD_NUMBER} | xargs -r -I {} docker rmi ${DOCKER_IMAGE}:{} || true
                    """
                }
            }
        }
    }

    post {
        success {
            echo "✅ ${APP_NAME} deployed successfully on port ${HOST_PORT}"
        }
        failure {
            echo "❌ Deployment failed for ${APP_NAME}"
            script {
                // Show container logs if deployment failed
                sh "docker logs ${CONTAINER_NAME} --tail 50 || true"
            }
        }
    }
}
