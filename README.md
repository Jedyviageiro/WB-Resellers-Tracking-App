Water Bottle Tracking App helps clients find nearby retailers selling 19.8 liter water bottles. 
Retailers can update their stock in real-time, and clients can check availability before placing order.
Built using Java(Spring Boot), Angular for the front-end, MySQL for the DB.

## Features
- Add, update, and delete water bottle records
- Track bottle usage and status
- Responsive Angular UI
- RESTful API built with Spring Boot
- MySQL database integration

## Tech Stack
- Frontend: Angular
- Backend: Spring Boot (Java)
- Database: MySQL

### Prerequisites
- Node.js & npm
- Angular CLI
- Java 17+ (or 11+, depending on Spring Boot version)
- MySQL
- Maven

### Backend Setup (Spring Boot)
1. Clone the repository
   ```bash
   git clone https://github.com/your-username/water-bottle-tracker.git
   cd water-bottle-tracker

2. Configure application.properties
   ```bash
   spring.datasource.url=jdbc:mysql://localhost:3306/water_bottle_db
   spring.datasource.username=your_mysql_username
   spring.datasource.password=your_mysql_password
   spring.jpa.hibernate.ddl-auto=update

3. Run the application
    ```bash
    mvn spring-boot:run

### Frontend Setup (Angular)
1. Navigate to the frontend directory
   ```bash
   cd ../frontend

2. Install dependencies
    ```bash
    npm install

3. Run the Angular app
   ```bash
   ng serve


