FROM node:20-alpine AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app
ENV COREPACK_DEFAULT_TO_LATEST=0
COPY package*.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY . .

ENV NEXT_PUBLIC_SCHEDULE_SERVER="http://vutler-node3.siberian-city.ts.net:4000"
ENV NEXT_PUBLIC_DEVICE_SERVER="http://vutler-node4.siberian-city.ts.net:4001"
ENV NEXT_PUBLIC_TTS_SERVER="http://vutler-node2.siberian-city.ts.net:4002"

RUN pnpm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
