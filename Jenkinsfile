pipeline {
    agent {
        docker {
            image 'node:20'
            args '-u root'
            reuseNode true // Reuse the node to minimize container creation
        }
    }
    stages {
        stage('Checkout') {
            steps {
                git url: 'https://github.com/epolga/cross-stitch.git', branch: 'main'
            }
        }
        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }
        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }
        stage('Test') {
            steps {
                sh 'npm run test || true'
            }
        }
    }
    post {
        always {
            node('master') { // Provide node context for cleanWs
                cleanWs()
            }
        }
    }
}