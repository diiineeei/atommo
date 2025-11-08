build-win:
    docker run --rm -ti -v "$PWD":/project -w /project electronuserland/builder:wine bash -lc "npm ci && npx cross-env ELECTRON=true npm run build && npx electron-builder --win"
