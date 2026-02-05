FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

# Pastikan aplikasi membaca process.env.PORT
ENV PORT=3000
EXPOSE 3000
CMD ["npm", "start"]