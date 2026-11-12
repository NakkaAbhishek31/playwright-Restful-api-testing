// Windows agent prerequisites: Git, Node.js 22+, npm, and Java 17+.
// npm ci installs the local CLI. Jenkins publishes through its managed Allure tool.
// Jenkins plugins: Pipeline, Git, Credentials Binding, and Allure.
// Configure Manage Jenkins > Tools > Allure Commandline: name Allure, version 2.43.0.
// Create username/password credentials named restful-booker-api for the API.
pipeline {
    agent any

    tools {
        nodejs 'nodejs'
        allure 'Allure'
    }
    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
        skipDefaultCheckout(true)
        timeout(time: 30, unit: 'MINUTES')
    }

    parameters {
        choice(
            name: 'WORKERS',
            choices: ['1', '2', '3', '4', '5', '6', '7', '8'],
            description: 'Maximum parallel Playwright workers.'
        )
        string(
            name: 'TEST_NAME',
            defaultValue: '',
            trim: true,
            description: 'Optional test title or regular expression passed to Playwright --grep.'
        )
        choice(
            name: 'TEST_FILE',
            choices: [
                'ALL',
                'health.spec.ts',
                'auth.spec.ts',
                'booking-create.spec.ts',
                'booking-read.spec.ts',
                'booking-update.spec.ts',
                'booking-delete.spec.ts'
            ],
            description: 'Select all tests or one test file.'
        )
        string(
            name: 'TEST_FILES',
            defaultValue: '',
            trim: true,
            description: 'Optional comma-separated file names, e.g. auth.spec.ts,booking-create.spec.ts. Overrides the dropdown.'
        )
        string(
            name: 'BASE_URL',
            defaultValue: 'https://restful-booker.herokuapp.com',
            trim: true,
            description: 'API environment to test.'
        )
    }

    environment {
        CI = 'true'
    }

    stages {
        stage('Clean and Checkout') {
            steps {
                deleteDir()
                checkout scm
            }
        }

        stage('Select tests') {
            steps {
                script {
                    def allowedFiles = [
                        'health.spec.ts',
                        'auth.spec.ts',
                        'booking-create.spec.ts',
                        'booking-read.spec.ts',
                        'booking-update.spec.ts',
                        'booking-delete.spec.ts'
                    ]
                    def customFiles = params.TEST_FILES?.trim()
                    def selectedFiles = []

                    if (customFiles) {
                        selectedFiles = customFiles.split(',').collect { it.trim() }.unique()
                    } else if (params.TEST_FILE && params.TEST_FILE != 'ALL') {
                        selectedFiles = [params.TEST_FILE]
                    }

                    selectedFiles.each { name ->
                        if (!allowedFiles.contains(name)) {
                            error("Unknown test file '${name}'. Use the file names from the dropdown.")
                        }
                        if (!fileExists("tests/API/${name}")) {
                            error("Missing test file: tests/API/${name}")
                        }
                    }

                    if (!(params.BASE_URL ==~ /https?:\/\/\S+/)) {
                        error('BASE_URL must be an HTTP or HTTPS URL.')
                    }

                    if (!((params.WORKERS ?: '1') in ['1', '2', '3', '4', '5', '6', '7', '8'])) {
                        error('WORKERS must be between 1 and 8.')
                    }
                    env.TEST_NAME_FILTER = params.TEST_NAME?.trim() ?: ''
                    env.PLAYWRIGHT_WORKER_COUNT = params.WORKERS ?: '1'
                    env.PLAYWRIGHT_RETRY_COUNT = '2'
                    env.BASE_URL = params.BASE_URL.trim()
                    env.SELECTED_TEST_FILES = selectedFiles.join(',')
                    echo "Selected tests: ${selectedFiles ? selectedFiles.join(', ') : 'ALL'}"
                    echo "Playwright settings: ${env.PLAYWRIGHT_WORKER_COUNT} workers, ${env.PLAYWRIGHT_RETRY_COUNT} retries per failed test."
                }
            }
        }

        stage('Prepare current results') {
            steps {
                // Remove stale output from this workspace before starting a new run.
                // The Jenkins Allure publisher manages report history.
                dir('allure-results') { deleteDir() }
                dir('allure-report') { deleteDir() }
                dir('playwright-report') { deleteDir() }
                dir('test-results') { deleteDir() }
                dir('blob-report') { deleteDir() }
            }
        }

        stage('Install dependencies') {
            steps {
                bat '''
@echo off
call node --version
if errorlevel 1 exit /b 1
call npm --version
if errorlevel 1 exit /b 1
call npm ci
if errorlevel 1 exit /b 1
'''
                powershell '''
$ErrorActionPreference = 'Stop'
$version = & node 'node_modules/allure-commandline/bin/allure' --version
if ($LASTEXITCODE -ne 0) { throw 'Unable to run Allure CLI.' }
Write-Output "Allure version: $version"
if (-not ($version -match '^2[.]')) {
    throw 'Expected project-local Allure CLI 2. Check package-lock.json and npm ci.'
}
'''
            }
        }

        stage('Run API tests') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'restful-booker-api',
                    usernameVariable: 'API_USERNAME',
                    passwordVariable: 'API_PASSWORD'
                )]) {
                    script {
                        def testExitCode = powershell(returnStatus: true, script: '''
$ErrorActionPreference = 'Stop'
$testArguments = @('node_modules/@playwright/test/cli.js', 'test', ('--workers=' + $env:PLAYWRIGHT_WORKER_COUNT), ('--retries=' + $env:PLAYWRIGHT_RETRY_COUNT))
if ($env:TEST_NAME_FILTER) { $testArguments += @('--grep', $env:TEST_NAME_FILTER) }

if ($env:SELECTED_TEST_FILES) {
    foreach ($file in $env:SELECTED_TEST_FILES.Split(',')) {
        # Playwright CLI file filters are regular expressions.
        $testArguments += [regex]::Escape($file) + '$'
    }
}

& node @testArguments
exit $LASTEXITCODE
''')
                        if (testExitCode != 0) {
                            error("Playwright exited with code ${testExitCode}. See the published reports.")
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                try {
                    if (fileExists('allure-results')) {
                        echo 'Publishing Allure results in Jenkins, including failed tests'
                        catchError(buildResult: 'UNSTABLE', stageResult: 'UNSTABLE') {
                            // Jenkins Tools must contain a managed installation named Allure.
                            allure([
                                commandline: 'Allure',
                                jdk: '',
                                includeProperties: false,
                                reportBuildPolicy: 'ALWAYS',
                                report: 'allure-report',
                                results: [[path: 'allure-results']]
                            ])
                        }
                    }
                } finally {
                    archiveArtifacts(
                        artifacts: 'allure-results/**,allure-report/**,playwright-report/**,test-results/**',
                        allowEmptyArchive: true
                    )
                }
            }
        }
    }
}
