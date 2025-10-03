# Stage 1: Use Node to build the app
FROM node:14

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve build with serve
RUN npm install -g serve

EXPOSE 5000
CMD ["serve", "-s", "build", "-l", "5000"]
