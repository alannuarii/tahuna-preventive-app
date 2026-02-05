pipeline {
    agent any

    environment {
        // Menghubungkan ID Credentials Jenkins ke variabel environment skrip
        DB_PASSWORD          = credentials('postgresql-db-password')
        JWT_SECRET           = credentials('preventive-tahuna-jwt-secret')
        GOOGLE_CLIENT_ID     = credentials('google-client-id')
        GOOGLE_CLIENT_SECRET = credentials('google-client-secret')
    }

    stages {
        stage('Checkout') {
            steps {
                // Mengambil kode terbaru dari GitHub
                checkout scm
            }
        }

        stage('Preparation') {
            steps {
                echo 'Memberikan izin eksekusi pada skrip deploy...'
                sh 'chmod +x jenkins_deploy.sh'
            }
        }

        stage('Deployment') {
            steps {
                echo 'Menjalankan skrip deployment...'
                // Skrip ini akan otomatis membaca variabel di blok environment di atas
                sh './jenkins_deploy.sh'
            }
        }
    }

    post {
        success {
            echo 'Deployment berhasil diselesaikan!'
        }
        failure {
            echo 'Deployment gagal. Silakan periksa log di atas.'
        }
    }
}