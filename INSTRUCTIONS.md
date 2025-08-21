# Local Development Setup Instructions

This guide will walk you through setting up and running this project on your local machine using XAMPP and VS Code.

## Prerequisites

1.  **XAMPP:** Make sure you have XAMPP installed and running. You will need the **Apache** and **MySQL** services started.
2.  **Composer:** You need Composer installed globally on your machine. [Download Composer](https://getcomposer.org/download/)
3.  **Node.js and npm:** You need Node.js (which includes npm) installed on your machine. [Download Node.js](https://nodejs.org/en)

## Step-by-Step Guide

### 1. Database Setup

-   Open your web browser and navigate to `http://localhost/phpmyadmin`.
-   Click on the **"Databases"** tab.
-   Under "Create database", enter the name `umusuf` and click **"Create"**. You do not need to create any tables; the application will do this for you.

### 2. Project Installation

Open a new terminal in VS Code (`Terminal` > `New Terminal`).

-   **Install PHP Dependencies:**
    ```bash
    composer install
    ```
-   **Install JavaScript Dependencies:**
    ```bash
    npm install
    ```
-   **Setup Environment File:** The `.env` file is already configured in the project to connect to the `umusuf` database with the default XAMPP username (`root`) and an empty password. If you ever need to recreate it, you can copy the `.env.example` file:
    ```bash
    cp .env.example .env
    ```
-   **Generate Application Key:** This is a crucial step for securing your application.
    ```bash
    php artisan key:generate
    ```
-   **Run Database Migrations:** This command will create all the necessary tables in your `umusuf` database.
    ```bash
    php artisan migrate
    ```

### 3. Running the Application

You will need to run **two** commands in **two separate terminals** inside VS Code.

-   **Terminal 1: Start the Laravel Backend Server**
    ```bash
    php artisan serve
    ```
    This will start the backend server, usually at `http://127.0.0.1:8000`.

-   **Terminal 2: Start the Vite Frontend Server**
    ```bash
    npm run dev
    ```
    This will start the frontend development server, which compiles your Vue components and handles live updates.

### 4. Accessing the Application

Once both servers are running, you can open your web browser and navigate to the address provided by the `php artisan serve` command (usually `http://127.0.0.1:8000`).

You should now see the application's welcome page and be able to register and log in.
