FROM node:20-slim AS builder

WORKDIR /app

# Increase Node.js memory limit for build
ENV NODE_OPTIONS=--max_old_space_size=4096

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:20-slim AS runner

WORKDIR /app

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=http://localhost:8000

CMD ["node", "server.js"]