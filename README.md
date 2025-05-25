# Water Bottle Tracking App

The **Water Bottle Tracking App** allows clients to locate nearby retailers selling 19.8-liter water bottles. Retailers can manage their inventory in real time, enabling clients to check availability before placing an order.

Built using **Spring Boot (Java)** for the backend, **Angular** for the frontend, and **MySQL** as the database.

---

## 🚀 Features

- Real-time stock updates by retailers
- Clients can view availability before ordering
- Add, update, and delete bottle records
- Responsive UI built with Angular
- RESTful API with Spring Boot
- MySQL integration for persistent data

---

## 🛠 Tech Stack

- **Frontend:** Angular
- **Backend:** Spring Boot (Java)
- **Database:** MySQL

---

## ⚙️ Prerequisites

Ensure you have the following installed:

- Node.js and npm
- Angular CLI
- Java 17+ (or Java 11+)
- MySQL
- Maven

---

## 🔧 Backend Setup (Spring Boot)

1. Clone the repository:
   ```bash
   git clone https://github.com/Jedyviageiro/water-bottle-tracker.git
   cd water-bottle-tracker/backend


2. Configure application.properties
   ```bash
   spring.datasource.url=jdbc:mysql://localhost:3306/water_bottle_db
   spring.datasource.username=your_mysql_username
   spring.datasource.password=your_mysql_password
   spring.jpa.hibernate.ddl-auto=update

3. Run the application
    ```bash
    mvn spring-boot:run

### 🌐 Frontend Setup (Angular)
1. Navigate to the frontend directory
   ```bash
   cd ../frontend

2. Install dependencies
    ```bash
    npm install
    
3. Run the Angular app
   ```bash
   ng serve
