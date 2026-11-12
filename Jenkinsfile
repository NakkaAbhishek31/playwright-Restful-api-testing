// Windows agent prerequisites: Git, Node.js 22+, npm, and Allure CLI 3 on PATH.
// Install the CLI on the agent with: npm install -g allure@3
// Jenkins plugins: Pipeline, Git, Credentials Binding, Copy Artifact, and Allure
// with Allure 3 support.
// Create username/password credentials named restful-booker-api for the API.
pipeline {
    agent { label 'windows' }

    options {
        disableConcurrentBuilds()
        skipDefaultCheckout(true)
        timeout(time: 30, unit: 'MINUTES')
    }

    parameters {
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
        TESTS_STARTED = 'false'
    }

    stages {
        stage('Checkout') {
            steps {
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
                    } else if (params.TEST_FILE != 'ALL') {
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

                    env.BASE_URL = params.BASE_URL.trim()
                    env.SELECTED_TEST_FILES = selectedFiles.join(',')
                    echo "Selected tests: ${selectedFiles ? selectedFiles.join(', ') : 'ALL'}"
                    echo 'Playwright settings: 4 workers, 2 retries per failed test.'
                }
            }
        }

        stage('Prepare current results') {
            steps {
                // Remove stale output from this workspace before starting a new run.
                // History is restored separately from the previous build's artifacts.
                dir('allure-results') { deleteDir() }
                dir('allure-report') { deleteDir() }
                dir('playwright-report') { deleteDir() }
                dir('test-results') { deleteDir() }
                dir('blob-report') { deleteDir() }
            }
        }

        stage('Restore Allure history') {
            steps {
                dir('allure-history') { deleteDir() }
                // Optional allows the first build, which has no earlier history.
                copyArtifacts(
                    projectName: env.JOB_NAME,
                    selector: permalink('lastCompletedBuild'),
                    filter: 'allure-history/history.jsonl',
                    optional: true
                )
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
$version = & allure --version
if ($LASTEXITCODE -ne 0) { throw 'Unable to run Allure CLI.' }
Write-Output "Allure version: $version"
if (($version -join ' ').Trim() -notmatch '^3[.]') {
    throw 'Install Allure CLI 3 on this agent and ensure it is first on PATH.'
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
                        env.TESTS_STARTED = 'true'
                        def testExitCode = powershell(returnStatus: true, script: '''
$ErrorActionPreference = 'Stop'
$testArguments = @('node_modules/@playwright/test/cli.js', 'test', '--workers=4', '--retries=2')

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
                    if (env.TESTS_STARTED == 'true') {
                        // Allure 3 reads and appends the restored JSONL history.
                        // ALWAYS publishes results even when Playwright fails.
                        allure([
                            allureVersion: '3',
                            configPath: 'allurerc.mjs',
                            includeProperties: false,
                            reportBuildPolicy: 'ALWAYS',
                            results: [[path: 'allure-results']]
                        ])
                    }
                } finally {
                    if (env.TESTS_STARTED == 'true') {
                        archiveArtifacts(
                            artifacts: 'allure-results/**,allure-report/**,playwright-report/**,test-results/**,allure-history/history.jsonl',
                            allowEmptyArchive: true
                        )
                    } else {
                        // Preserve restored history if setup fails before tests start.
                        archiveArtifacts(
                            artifacts: 'allure-history/history.jsonl',
                            allowEmptyArchive: true
                        )
                    }
                }
            }
        }
    }
}
