# Stage 1: Build the application
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Kopiere pom.xml und lade Abhängigkeiten herunter
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Kopiere den eigentlichen Quellcode und baue die Anwendung
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Run the application
FROM eclipse-temurin:17-jre
WORKDIR /app

# Kopiere das gebaute Jar-Archive in das zweite schlanke Image
COPY --from=build /app/target/backend-0.0.1-SNAPSHOT.jar app.jar

# Führe das Jar aus
ENTRYPOINT ["java", "-jar", "app.jar"]
