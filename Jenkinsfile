pipeline {
    agent any

    environment {
        // Ganti dengan nama credential secret file Anda yang tersimpan di Jenkins
        SECRET_FILE_CREDENTIAL_ID = 'tahuna-preventive-env'
        
        IMAGE_NAME = 'tahuna-preventive-app'
        CONTAINER_NAME = 'tahuna-preventive-app'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Prepare Environment') {
            steps {
                // Menggunakan Secret File dari Jenkins
                withCredentials([file(credentialsId: "${SECRET_FILE_CREDENTIAL_ID}", variable: 'SECRET_ENV')]) {
                    // Menyalin secret file ke .env untuk digunakan oleh runtime container
                    sh 'cp $SECRET_ENV .env'
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                // Membangun Docker Image
                sh "docker build -t ${IMAGE_NAME}:latest ."
            }
        }

        stage('Deploy Container') {
            steps {
                script {
                    // Cek jika container sudah ada, hentikan dan hapus
                    sh """
                        if [ "\$(docker ps -aq -f name=${CONTAINER_NAME})" ]; then
                            echo "Stopping and removing existing container..."
                            docker stop ${CONTAINER_NAME} || true
                            docker rm ${CONTAINER_NAME} || true
                        fi
                    """

                    // Menjalankan container baru
                    // Host port 3006 mapping ke container port 3000
                    // .env dipasang pada runtime dengan --env-file
                    sh "docker run -d --restart always --name ${CONTAINER_NAME} -p 3006:3000 --env-file .env ${IMAGE_NAME}:latest"
                }
            }
        }
    }

    post {
        always {
            // Bersihkan file secret .env di workspace
            sh 'rm -f .env'
            
            // Bersihkan dangling images untuk menghemat storage
            sh 'docker image prune -f'
        }
    }
}
