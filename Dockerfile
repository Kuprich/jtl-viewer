# ---- Stage 1: build frontend ----
FROM node:22.22-alpine AS frontend

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ---- Stage 2: build backend ----
FROM maven:3.9.16-eclipse-temurin-21 AS backend

WORKDIR /app/backend

COPY backend/jtlweb/pom.xml ./
RUN mvn -q dependency:go-offline

COPY backend/jtlweb/ ./
COPY --from=frontend /app/frontend/dist ./src/main/resources/static/
RUN mvn -q -DskipTests package

# ---- Stage 3: runtime ----
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app
COPY --from=backend /app/backend/target/jtlweb-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]