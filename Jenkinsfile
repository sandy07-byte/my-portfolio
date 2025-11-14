pipeline {
  agent any

  environment {
    // Replace these credential IDs with ones you create in Jenkins
    DOCKER_CREDENTIALS = 'docker-registry-creds'
    KUBECONFIG_CREDENTIALS = 'kubeconfig-file-creds'
    KUBE_NAMESPACE = 'default'
    DEPLOYMENT_NAME = 'portfolio-deployment'
    // Default registry set to your GitHub account; change if you use Docker Hub
    DOCKER_REGISTRY = 'ghcr.io/sandy07-byte'
    IMAGE_NAME = '' // optional override (job parameter or global env)
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install & Build') {
      steps {
        sh 'npm ci'
        sh 'npm run build'
      }
    }

    stage('Docker Build & Push') {
      steps {
        script {
          def registry = env.IMAGE_NAME ?: "${env.DOCKER_REGISTRY ?: 'REPLACE_WITH_REGISTRY_USERNAME' }"
          def tag = "${env.BUILD_NUMBER}-${env.GIT_COMMIT?.substring(0,7) ?: 'local'}"
          def image = "${registry}/portfolio:${tag}"

          withCredentials([usernamePassword(credentialsId: env.DOCKER_CREDENTIALS, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
            sh "echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin"
            sh "docker build -t ${image} -f Dockerfile.prod ."
            sh "docker push ${image}"
          }

          // expose built image tag for downstream stage
          env.BUILT_IMAGE = image
        }
      }
    }

    stage('Deploy to Kubernetes') {
      steps {
        script {
          if (!env.BUILT_IMAGE) {
            error 'Built image not found; aborting deploy.'
          }

          withCredentials([file(credentialsId: env.KUBECONFIG_CREDENTIALS, variable: 'KUBECONFIG_FILE')]) {
            // Use the kubeconfig file stored in Jenkins credentials (type: secret file)
            sh 'export KUBECONFIG=$KUBECONFIG_FILE'

            // Replace the deployment's container image (assumes container name equals deployment name/container 'portfolio')
            sh "kubectl set image deployment/${env.DEPLOYMENT_NAME} ${env.DEPLOYMENT_NAME}=${env.BUILT_IMAGE} -n ${env.KUBE_NAMESPACE} --record"

            // Optional: rollout status check
            sh "kubectl rollout status deployment/${env.DEPLOYMENT_NAME} -n ${env.KUBE_NAMESPACE} --timeout=120s"
          }
        }
      }
    }
  }

  post {
    always {
      sh 'docker logout || true'
    }

    success {
      echo "Deployed ${env.BUILT_IMAGE} successfully"
    }

    failure {
      echo 'Pipeline failed, check logs.'
    }
  }
}
